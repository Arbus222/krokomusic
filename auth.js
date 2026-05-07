// ========== ЛОГІКА АВТОРИЗАЦІЇ ==========

let currentUser = null;
let users = [];

function getSelectedAvatarColor() {
    const selected = document.querySelector('.avatar-color.selected');
    return selected ? selected.getAttribute('data-color') : '#7c3aed';
}

function registerUser() {
    const name = document.getElementById('regName').value.trim();
    const login = document.getElementById('regLogin').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    
    if (!name || !login || !email || !password) {
        alert('❌ Заповніть всі поля!');
        return;
    }
    if (password !== confirm) {
        alert('❌ Паролі не співпадають!');
        return;
    }
    if (password.length < 4) {
        alert('❌ Пароль має бути не менше 4 символів!');
        return;
    }
    if (users.find(u => u.login === login)) {
        alert('❌ Логін вже існує!');
        return;
    }
    if (users.find(u => u.email === email)) {
        alert('❌ Email вже існує!');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name: name,
        login: login,
        email: email,
        password: password,
        avatarColor: getSelectedAvatarColor()
    };
    
    users.push(newUser);
    saveUsers(users);
    currentUser = newUser;
    saveCurrentUser(currentUser);
    
    alert('✅ Реєстрація успішна!');
    location.reload();
}

function loginUser() {
    const loginInput = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    
    if (!loginInput || !password) {
        alert('❌ Введіть логін/email та пароль!');
        return;
    }
    
    const user = users.find(u => (u.login === loginInput || u.email === loginInput) && u.password === password);
    
    if (user) {
        currentUser = user;
        saveCurrentUser(currentUser);
        alert('✅ Вхід виконано!');
        location.reload();
    } else {
        alert('❌ Невірний логін/email або пароль!');
    }
}

function logout() {
    if (confirm('Вийти?')) {
        removeCurrentUser();
        location.reload();
    }
}

function deleteAccount() {
    if (confirm('Видалити акаунт?')) {
        users = users.filter(u => u.id !== currentUser.id);
        saveUsers(users);
        clearUserData(currentUser.id);
        removeCurrentUser();
        alert('✅ Акаунт видалено!');
        location.reload();
    }
}

function updateWelcomeScreen() {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileLogin = document.getElementById('profileLogin');
    const profileEmail = document.getElementById('profileEmail');
    
    if (userAvatar && currentUser) {
        userAvatar.style.background = currentUser.avatarColor;
        userAvatar.innerText = currentUser.name.charAt(0).toUpperCase();
    }
    if (userName && currentUser) userName.innerText = currentUser.name;
    if (profileAvatar && currentUser) {
        profileAvatar.style.background = currentUser.avatarColor;
        profileAvatar.innerText = currentUser.name.charAt(0).toUpperCase();
    }
    if (profileName && currentUser) profileName.innerText = currentUser.name;
    if (profileLogin && currentUser) profileLogin.innerText = '@' + currentUser.login;
    if (profileEmail && currentUser) profileEmail.innerText = currentUser.email;
}

function checkAuthAndRender() {
    const authModal = document.getElementById('authModal');
    const app = document.getElementById('app');
    
    if (currentUser) {
        if (authModal) authModal.style.display = 'none';
        if (app) app.style.display = 'block';
        updateWelcomeScreen();
        if (typeof initPlayer === 'function') {
            initPlayer();
        }
    } else {
        if (authModal) authModal.style.display = 'flex';
        if (app) app.style.display = 'none';
    }
}