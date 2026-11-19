// Demo logic for electronic student card
// In real life: server-side JWT/HMAC, central profile API, etc.

const SECRET = 'demo-secret-itmoscow-2026'; // только для демо

let currentStudent = {
  id: 'st_001',
  name: 'Маслов Максим',
  group: '2ИП-7-25',
  specialty: 'Центр программирования и кибербезопасности · поток Альфа',
  program: '09.02.07 Информационные системы и программирование',
  status: 'active', // active | suspended | graduated
  photo: null,
  shaburyata: 0,           // баланс Шабурят
  transactions: []         // история: { id, date, amount, reason, type: 'credit'|'debit' }
};

// Load from localStorage if exists
function loadStudentProfile() {
  const saved = localStorage.getItem('studentProfile');
  if (saved) {
    const parsed = JSON.parse(saved);
    // migrate old profiles without wallet
    currentStudent = {
      ...currentStudent,
      ...parsed,
      shaburyata: typeof parsed.shaburyata === 'number' ? parsed.shaburyata : 0,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
    };
  }
  updateProfileUI();
  updateWalletUI();
}

function saveStudentProfile() {
  localStorage.setItem('studentProfile', JSON.stringify(currentStudent));
}

function updateProfileUI() {
  const nameEl = document.getElementById('studentName');
  if (nameEl) nameEl.textContent = currentStudent.name;

  const groupEl = document.getElementById('group');
  if (groupEl) groupEl.textContent = `Студент · 2 курс · ${currentStudent.group}`;

  const specialtyEl = document.getElementById('specialty');
  if (specialtyEl) specialtyEl.textContent = currentStudent.specialty;

  const programEl = document.getElementById('program');
  if (programEl) programEl.textContent = currentStudent.program;

  const badge = document.getElementById('statusBadge');
  if (badge) {
    const statusText = {
      active: 'Статус: Активен',
      suspended: 'Статус: Приостановлен',
      graduated: 'Статус: Выпускник'
    }[currentStudent.status] || 'Неизвестно';
    badge.textContent = statusText;
    badge.style.background = currentStudent.status === 'active'
      ? 'rgba(0, 212, 170, 0.15)'
      : 'rgba(255, 77, 109, 0.15)';
    badge.style.color = currentStudent.status === 'active' ? 'var(--accent-green)' : 'var(--danger)';
  }

  // Avatar initials
  const initials = currentStudent.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatar = document.getElementById('avatar');
  if (avatar) avatar.textContent = initials;
}

function updateWalletUI() {
  const balanceEl = document.getElementById('shaburyataBalance');
  if (balanceEl) {
    balanceEl.textContent = currentStudent.shaburyata;
  }

  const historyEl = document.getElementById('walletHistory');
  if (historyEl) {
    if (!currentStudent.transactions || currentStudent.transactions.length === 0) {
      historyEl.innerHTML = '<p class="empty-history">Пока нет операций</p>';
    } else {
      const items = currentStudent.transactions
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8)
        .map(tx => {
          const sign = tx.type === 'credit' ? '+' : '−';
          const cls = tx.type === 'credit' ? 'credit' : 'debit';
          const d = new Date(tx.date);
          const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
          return `
            <div class="tx-item ${cls}">
              <div class="tx-main">
                <span class="tx-reason">${escapeHtml(tx.reason)}</span>
                <span class="tx-date">${dateStr}</span>
              </div>
              <div class="tx-amount">${sign}${tx.amount}</div>
            </div>`;
        })
        .join('');
      historyEl.innerHTML = items;
    }
  }

  // admin page balance display
  const adminBalance = document.getElementById('adminBalance');
  if (adminBalance) {
    adminBalance.textContent = currentStudent.shaburyata;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ========== Шабурята (бонусы) ==========
function awardShaburyata(amount, reason) {
  amount = parseInt(amount, 10);
  if (isNaN(amount) || amount === 0) {
    alert('Укажите ненулевое количество баллов');
    return false;
  }
  if (!reason || !reason.trim()) {
    alert('Укажите причину начисления');
    return false;
  }

  const type = amount > 0 ? 'credit' : 'debit';
  const absAmount = Math.abs(amount);

  // prevent negative balance on debit
  if (type === 'debit' && currentStudent.shaburyata < absAmount) {
    alert('Недостаточно Шабурят на балансе');
    return false;
  }

  currentStudent.shaburyata += amount;
  currentStudent.transactions = currentStudent.transactions || [];
  currentStudent.transactions.push({
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    date: new Date().toISOString(),
    amount: absAmount,
    reason: reason.trim(),
    type
  });

  saveStudentProfile();
  updateWalletUI();
  if (typeof renderAdminTable === 'function') renderAdminTable();
  return true;
}

// Simple HMAC-like signature for demo (not cryptographically secure, just for illustration)
async function signToken(payload) {
  const data = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(data) + '.' + sigHex.slice(0, 32); // short token
}

async function verifySignature(token) {
  try {
    const [b64, sig] = token.split('.');
    if (!b64 || !sig) return null;
    const data = atob(b64);
    const payload = JSON.parse(data);
    const expected = await signToken(payload);
    if (expected.split('.')[1] !== sig) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

let qrInstance = null;
let currentToken = '';
let secondsLeft = 60;

async function generateQR() {
  const now = Date.now();
  const exp = now + 60 * 1000; // 60 seconds
  const payload = {
    sid: currentStudent.id,
    exp: exp,
    n: Math.random().toString(36).slice(2, 8)
  };
  currentToken = await signToken(payload);

  const container = document.getElementById('qrcode');
  if (!container) return;
  container.innerHTML = '';

  // Adaptive QR size for mobile
  const w = window.innerWidth;
  const qrSize = w < 380 ? 160 : (w < 640 ? 180 : 220);

  qrInstance = new QRCode(container, {
    text: currentToken,
    width: qrSize,
    height: qrSize,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });

  secondsLeft = 60;
  updateTimer();
}

function updateTimer() {
  const el = document.getElementById('timer');
  if (!el) return;
  el.textContent = `Обновление через: ${secondsLeft} сек`;
  el.classList.toggle('warning', secondsLeft < 15);
}

function startTimer() {
  setInterval(() => {
    secondsLeft--;
    updateTimer();
    if (secondsLeft <= 0) {
      generateQR();
    }
  }, 1000);
}

async function verifyToken() {
  const input = document.getElementById('tokenInput');
  const resultEl = document.getElementById('result');
  if (!input || !resultEl) return;

  const token = input.value.trim();
  if (!token) {
    resultEl.className = 'result invalid';
    resultEl.innerHTML = 'Введите токен';
    return;
  }

  const payload = await verifySignature(token);
  if (!payload) {
    resultEl.className = 'result invalid';
    resultEl.innerHTML = '❌ Неверная подпись или повреждённый токен';
    return;
  }

  if (Date.now() > payload.exp) {
    resultEl.className = 'result invalid';
    resultEl.innerHTML = '❌ Токен просрочен';
    return;
  }

  // Check student status
  const student = JSON.parse(localStorage.getItem('studentProfile') || JSON.stringify(currentStudent));
  if (payload.sid !== student.id || student.status !== 'active') {
    resultEl.className = 'result invalid';
    resultEl.innerHTML = '❌ Статус студента неактивен или ID не совпадает';
    return;
  }

  resultEl.className = 'result valid';
  resultEl.innerHTML = `✅ Действителен<br>Студент: ${student.name}<br>Группа: ${student.group}<br>Истекает через ${Math.max(0, Math.floor((payload.exp - Date.now()) / 1000))} сек`;
}

// Admin functions
function renderAdminTable() {
  const tbody = document.querySelector('#profilesTable tbody');
  if (!tbody) return;
  const student = JSON.parse(localStorage.getItem('studentProfile') || JSON.stringify(currentStudent));
  // sync current
  currentStudent = { ...currentStudent, ...student };
  tbody.innerHTML = `
    <tr>
      <td>${escapeHtml(student.name)}</td>
      <td>${escapeHtml(student.group)}</td>
      <td>${student.status}</td>
      <td><strong>${student.shaburyata ?? 0}</strong> Ш</td>
      <td><button class="btn secondary" onclick="loadToEdit()">Редактировать</button></td>
    </tr>
  `;
  updateWalletUI();
}

function loadToEdit() {
  const student = JSON.parse(localStorage.getItem('studentProfile') || JSON.stringify(currentStudent));
  currentStudent = { ...currentStudent, ...student };
  const nameIn = document.getElementById('editName');
  const groupIn = document.getElementById('editGroup');
  const statusIn = document.getElementById('editStatus');
  if (nameIn) nameIn.value = student.name;
  if (groupIn) groupIn.value = student.group;
  if (statusIn) statusIn.value = student.status;
}

function saveProfile() {
  const student = {
    ...currentStudent,
    name: document.getElementById('editName').value,
    group: document.getElementById('editGroup').value,
    status: document.getElementById('editStatus').value
  };
  currentStudent = student;
  saveStudentProfile();
  alert('Профиль сохранён. Обновите страницу студента, чтобы увидеть изменения.');
  renderAdminTable();
}

function handleAward() {
  const amountEl = document.getElementById('awardAmount');
  const reasonEl = document.getElementById('awardReason');
  if (!amountEl || !reasonEl) return;

  const amount = parseInt(amountEl.value, 10);
  const reason = reasonEl.value.trim();

  if (awardShaburyata(amount, reason)) {
    amountEl.value = '';
    reasonEl.value = '';
    alert(`Начислено ${amount > 0 ? '+' : ''}${amount} Шабурят.\nНовый баланс: ${currentStudent.shaburyata}`);
  }
}

// Init on pages that need it
if (document.getElementById('qrcode') || document.getElementById('shaburyataBalance')) {
  loadStudentProfile();
  if (document.getElementById('qrcode')) {
    generateQR().then(() => startTimer());
  }
}

if (document.getElementById('profilesTable')) {
  // ensure loaded
  const saved = localStorage.getItem('studentProfile');
  if (saved) {
    currentStudent = { ...currentStudent, ...JSON.parse(saved) };
  }
}
