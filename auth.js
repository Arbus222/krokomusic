let currentUser = null;
let users = [];

function getSelectedAvatarColor() {
    const selected = document.querySelector('.avatar-color.selected');
    return selected ? selected.getAttribute('data-color') : '#7c3aed';
}

function registerUser() {
    const name     = document.getElementById('regName').value.trim();
    const login    = document.getElementById('regLogin').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm  = document.getElementById('regConfirm').value;

    if (!name || !login || !email || !password) {
        showToast('❌ Заповніть всі поля!', 'error'); return;
    }
    if (password !== confirm) {
        showToast('❌ Паролі не співпадають!', 'error'); return;
    }
    if (password.length < 4) {
        showToast('❌ Пароль має бути не менше 4 символів!', 'error'); return;
    }
    if (users.find(u => u.login === login)) {
        showToast('❌ Логін вже існує!', 'error'); return;
    }
    if (users.find(u => u.email === email)) {
        showToast('❌ Email вже існує!', 'error'); return;
    }

    const newUser = {
        id: Date.now(), name, login, email, password,
        avatarColor: getSelectedAvatarColor(),
        avatarPhoto: null,
        theme: 'purple'
    };

    users.push(newUser);
    if (typeof saveUsers === 'function') saveUsers(users);
    currentUser = newUser;
    if (typeof saveCurrentUser === 'function') saveCurrentUser(currentUser);
    showToast('✅ Реєстрація успішна!', 'success');
    setTimeout(() => location.reload(), 800);
}

function loginUser() {
    const loginInput = document.getElementById('loginInput').value.trim();
    const password   = document.getElementById('passwordInput').value;

    if (!loginInput || !password) {
        showToast('❌ Введіть логін/email та пароль!', 'error'); return;
    }
    const user = users.find(u => (u.login === loginInput || u.email === loginInput) && u.password === password);
    if (user) {
        currentUser = user;
        if (typeof saveCurrentUser === 'function') saveCurrentUser(currentUser);
        showToast('✅ Вхід виконано!', 'success');
        setTimeout(() => location.reload(), 600);
    } else {
        showToast('❌ Невірний логін/email або пароль!', 'error');
    }
}

function logout() {
    if (confirm('Вийти з акаунту?')) {
        if (typeof removeCurrentUser === 'function') removeCurrentUser();
        location.reload();
    }
}

function deleteAccount() {
    if (confirm('❗ Видалити акаунт? Всі дані будуть втрачені!')) {
        users = users.filter(u => u.id !== currentUser.id);
        if (typeof saveUsers === 'function') saveUsers(users);
        if (typeof clearUserData === 'function') clearUserData(currentUser.id);
        if (typeof removeCurrentUser === 'function') removeCurrentUser();
        showToast('Акаунт видалено', 'info');
        setTimeout(() => location.reload(), 600);
    }
}

function updateWelcomeScreen() {
    if (!currentUser) return;

    const userAvatar    = document.getElementById('userAvatar');
    const userName      = document.getElementById('userName');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName   = document.getElementById('profileName');
    const profileLogin  = document.getElementById('profileLogin');
    const profileEmail  = document.getElementById('profileEmail');

    const letter = currentUser.name.charAt(0).toUpperCase();

    // Top bar avatar
    if (userAvatar) {
        userAvatar.style.background = currentUser.avatarPhoto ? 'transparent' : currentUser.avatarColor;
        userAvatar.innerHTML = currentUser.avatarPhoto
            ? `<img src="${currentUser.avatarPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : letter;
    }
    if (userName) userName.innerText = currentUser.name;

    // Profile avatar
    if (profileAvatar) {
        profileAvatar.style.background = currentUser.avatarPhoto ? 'transparent' : currentUser.avatarColor;
        profileAvatar.innerHTML = currentUser.avatarPhoto
            ? `<img src="${currentUser.avatarPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : letter;
    }
    if (profileName)  profileName.innerText  = currentUser.name;
    if (profileLogin) profileLogin.innerText  = '@' + currentUser.login;
    if (profileEmail) profileEmail.innerText  = currentUser.email;
}

// Show toast even before player.js runs (auth modal context)
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${message}</span><div class="toast-progress"></div>`;
    toast.addEventListener('click', () => { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 300); });
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 300); }, 3000);
}