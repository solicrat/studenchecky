<<<<<<< HEAD
// Local "database" in localStorage
const DB_KEY = 'studentAppDB';

function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seed = {
      users: [
        {
          id: 'admin1',
          login: 'admin',
          password: 'admin123',
          role: 'admin',
          name: 'Администратор'
        },
        {
          id: 'st001',
          login: 'maslov',
          password: '123456',
          role: 'student',
          name: 'Маслов Максим',
          group: '2ИП-7-25',
          specialty: '09.02.07 Информационные системы и программирование',
          status: 'active',
          avatar: null,
          description: 'Студент 2 курса, учусь на программиста.',
          stacks: ['JavaScript', 'C++', 'Python'],
          bonuses: 150,
          bonusHistory: [
            { date: '2026-11-20', amount: 50, reason: 'ИТ.Спорт — посещение секции' },
            { date: '2026-11-22', amount: 100, reason: 'Активность на паре' }
          ]
        }
      ]
    };
    localStorage.setItem(DB_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getCurrentUser() {
  const id = sessionStorage.getItem('currentUserId');
  if (!id) return null;
  const db = getDB();
  return db.users.find(u => u.id === id) || null;
}

function requireAuth(role = null) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  if (role && user.role !== role) {
    alert('Доступ запрещён');
    window.location.href = user.role === 'admin' ? 'admin.html' : 'student.html';
    return null;
  }
  return user;
}

function logout() {
  sessionStorage.removeItem('currentUserId');
  window.location.href = 'login.html';
}

// Login
function doLogin() {
  const login = document.getElementById('login').value.trim();
  const password = document.getElementById('password').value;
  const err = document.getElementById('error');
  const db = getDB();
  const user = db.users.find(u => u.login === login && u.password === password);
  if (!user) {
    err.textContent = 'Неверный логин или пароль';
    return;
  }
  sessionStorage.setItem('currentUserId', user.id);
  if (user.role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'student.html';
  }
}

// Student main page
let qrInterval = null;
let qrSeconds = 60;

function generateUniqueQR(user) {
  const nonce = Math.random().toString(36).slice(2, 10);
  const qrText = `STUDENT:${user.id}:${Date.now()}:${nonce}:${user.group}`;
  const container = document.getElementById('qrcode');
  if (!container) return;
  container.innerHTML = '';
  new QRCode(container, {
    text: qrText,
    width: 200,
    height: 200,
    colorDark: '#000',
    colorLight: '#fff',
    correctLevel: QRCode.CorrectLevel.M
  });
  qrSeconds = 60;
  updateQRTimer();
}

function updateQRTimer() {
  const el = document.getElementById('qrTimer');
  if (el) el.textContent = `Обновление через: ${qrSeconds} сек`;
}

function loadStudentPage() {
  const user = requireAuth('student');
  if (!user) return;
  document.getElementById('studentName').textContent = user.name;
  document.getElementById('studentGroup').textContent = `Группа: ${user.group}`;
  document.getElementById('studentSpecialty').textContent = `Специальность: ${user.specialty || 'Не указана'}`;
  document.getElementById('studentStatus').textContent = user.status === 'active' ? 'Статус: Активен' : 'Статус: Неактивен';
  document.getElementById('studentBonuses').textContent = user.bonuses || 0;
  document.getElementById('studentDesc').textContent = user.description || 'Описание не указано';
  
  const stacksEl = document.getElementById('studentStacks');
  stacksEl.innerHTML = '';
  if (user.stacks && user.stacks.length) {
    user.stacks.forEach(s => {
      stacksEl.innerHTML += `<span class="stack-tag">${s}</span>`;
    });
  } else {
    stacksEl.innerHTML = '<span style="color:var(--text-muted);">Стеки не указаны</span>';
  }

  const avatarEl = document.getElementById('avatar');
  if (user.avatar) {
    avatarEl.innerHTML = `<img src="${user.avatar}" alt="">`;
  } else {
    const initials = user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    avatarEl.textContent = initials;
  }

  generateUniqueQR(user);

  if (qrInterval) clearInterval(qrInterval);
  qrInterval = setInterval(() => {
    qrSeconds--;
    updateQRTimer();
    if (qrSeconds <= 0) {
      const freshUser = getCurrentUser();
      if (freshUser) generateUniqueQR(freshUser);
=======
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
>>>>>>> 07250a6b1f8867be25bbcbd4bec46aea1b53dbbc
    }
  }, 1000);
}

<<<<<<< HEAD
// Profile page
function loadProfilePage() {
  const user = requireAuth('student');
  if (!user) return;
  document.getElementById('editName').value = user.name;
  document.getElementById('editDesc').value = user.description || '';
  document.getElementById('editStacks').value = (user.stacks || []).join(', ');
  const avatarPreview = document.getElementById('avatarPreview');
  if (user.avatar) {
    avatarPreview.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    avatarPreview.textContent = user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  }
}

function saveProfile() {
  const user = getCurrentUser();
  if (!user) return;
  const db = getDB();
  const idx = db.users.findIndex(u => u.id === user.id);
  db.users[idx].description = document.getElementById('editDesc').value.trim();
  db.users[idx].stacks = document.getElementById('editStacks').value.split(',').map(s => s.trim()).filter(Boolean);
  saveDB(db);
  document.getElementById('msg').textContent = 'Профиль сохранён';
  setTimeout(() => location.reload(), 800);
}

function uploadAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const user = getCurrentUser();
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === user.id);
    db.users[idx].avatar = e.target.result;
    saveDB(db);
    document.getElementById('avatarPreview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
    document.getElementById('msg').textContent = 'Аватарка обновлена';
  };
  reader.readAsDataURL(file);
}

// Bonuses page
function loadBonusesPage() {
  const user = requireAuth('student');
  if (!user) return;
  document.getElementById('bonusAmount').textContent = user.bonuses || 0;
  const hist = document.getElementById('history');
  hist.innerHTML = '';
  (user.bonusHistory || []).slice().reverse().forEach(h => {
    hist.innerHTML += `<div class="history-item" style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
      <span>+${h.amount} шабурята — ${h.reason}</span>
      <span style="color:var(--text-muted); white-space:nowrap;">${h.date}</span>
    </div>`;
  });
}

// Admin page
function loadAdminPage() {
  const user = requireAuth('admin');
  if (!user) return;
  renderStudentsTable();
}

function renderStudentsTable() {
  const db = getDB();
  const tbody = document.querySelector('#studentsTable tbody');
  tbody.innerHTML = '';
  db.users.filter(u => u.role === 'student').forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.login}</td>
        <td>${s.group}</td>
        <td>${s.bonuses || 0}</td>
        <td>
          <button class="btn small" onclick="editStudent('${s.id}')">Изменить</button>
          <button class="btn small success" onclick="giveBonus('${s.id}')">+Шабурята</button>
        </td>
      </tr>`;
  });
}

function addStudent() {
  const login = document.getElementById('newLogin').value.trim();
  const password = document.getElementById('newPassword').value;
  const name = document.getElementById('newName').value.trim();
  const group = document.getElementById('newGroup').value.trim();
  const specialty = document.getElementById('newSpecialty').value.trim();
  if (!login || !password || !name || !group || !specialty) { alert('Заполни все поля, включая группу и специальность'); return; }
  const db = getDB();
  if (db.users.some(u => u.login === login)) { alert('Логин уже занят'); return; }
  db.users.push({
    id: 'st' + Date.now(),
    login, password, role: 'student',
    name, group, specialty, status: 'active',
    avatar: null, description: '', stacks: [],
    bonuses: 0, bonusHistory: []
  });
  saveDB(db);
  document.getElementById('newLogin').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('newName').value = '';
  document.getElementById('newGroup').value = '';
  document.getElementById('newSpecialty').value = '';
  renderStudentsTable();
  alert('Студент добавлен');
}

function editStudent(id) {
  const db = getDB();
  const s = db.users.find(u => u.id === id);
  if (!s) return;
  const newLogin = prompt('Новый логин:', s.login);
  if (newLogin === null) return;
  const newPass = prompt('Новый пароль (оставь пустым чтобы не менять):', '');
  const newGroup = prompt('Новая группа:', s.group);
  const newSpecialty = prompt('Новая специальность:', s.specialty || '');
  if (newLogin.trim()) s.login = newLogin.trim();
  if (newPass && newPass.trim()) s.password = newPass.trim();
  if (newGroup && newGroup.trim()) s.group = newGroup.trim();
  if (newSpecialty && newSpecialty.trim()) s.specialty = newSpecialty.trim();
  saveDB(db);
  renderStudentsTable();
  alert('Обновлено');
}

function giveBonus(id) {
  const amount = prompt('Сколько шабурята начислить?', '50');
  if (!amount || isNaN(amount)) return;
  const reason = prompt('Причина:', 'От администратора') || 'От администратора';
  const db = getDB();
  const s = db.users.find(u => u.id === id);
  if (!s) return;
  s.bonuses = (s.bonuses || 0) + Number(amount);
  if (!s.bonusHistory) s.bonusHistory = [];
  s.bonusHistory.push({
    date: new Date().toISOString().slice(0,10),
    amount: Number(amount),
    reason
  });
  saveDB(db);
  renderStudentsTable();
  alert(`Начислено ${amount} шабурята`);
}
=======
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
>>>>>>> 07250a6b1f8867be25bbcbd4bec46aea1b53dbbc
