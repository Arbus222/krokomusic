// ========== РОБОТА З LOCALSTORAGE ==========

const STORAGE_KEYS = {
    USERS: 'kroko_users',
    CURRENT_USER: 'kroko_current_user'
};

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function loadUsers() {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!users || users === 'undefined' || users === 'null') {
        return [];
    }
    try {
        return JSON.parse(users);
    } catch(e) {
        return [];
    }
}

function saveCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

function loadCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!user || user === 'undefined' || user === 'null') {
        return null;
    }
    try {
        return JSON.parse(user);
    } catch(e) {
        return null;
    }
}

function removeCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

function clearUserData(userId) {
    localStorage.removeItem(`kroko_songs_${userId}`);
    localStorage.removeItem(`kroko_playlists_${userId}`);
    localStorage.removeItem(`kroko_favs_${userId}`);
    localStorage.removeItem(`kroko_listens_${userId}`);
}