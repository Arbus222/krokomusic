function setupTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    if (!tabs.length) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.getElementById('loginForm').classList.remove('active');
            document.getElementById('registerForm').classList.remove('active');
            document.getElementById(`${target}Form`).classList.add('active');
        });
    });
}

function setupAuthLinks() {
    const links = document.querySelectorAll('.auth-link');
    if (!links.length) return;
    
    links.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.dataset.tab;
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`.auth-tab[data-tab="${target}"]`).classList.add('active');
            document.getElementById('loginForm').classList.remove('active');
            document.getElementById('registerForm').classList.remove('active');
            document.getElementById(`${target}Form`).classList.add('active');
        });
    });
}

function setupColorPicker() {
    const colors = document.querySelectorAll('.avatar-color');
    if (!colors.length) return;
    
    colors.forEach(color => {
        color.addEventListener('click', () => {
            colors.forEach(c => c.classList.remove('selected'));
            color.classList.add('selected');
        });
    });
}

function navigateToPage(page) {
    const pages = ['home', 'profile', 'playlists', 'favorites', 'stats', 'about'];

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');

    pages.forEach(p => {
        const el = document.getElementById(`${p}Page`);
        if (el) el.style.display = 'none';
    });

    const activePage = document.getElementById(`${page}Page`);
    if (activePage) activePage.style.display = 'block';

    if (page === 'playlists') renderPlaylists();
    if (page === 'favorites') renderFavorites();
    if (page === 'stats') renderStats();
    if (page === 'profile') {
        updateWelcomeScreen();
        setupProfileSettings();
    }
}

// ===== PROFILE AVATAR COLOR & THEME FIX =====
function setupProfileSettings() {
    // Avatar color picker in profile
    const profileColors = document.querySelectorAll('#profileColors .avatar-color');
    profileColors.forEach(color => {
        // Mark current color as selected
        if (currentUser && color.getAttribute('data-color') === currentUser.avatarColor) {
            profileColors.forEach(c => c.classList.remove('selected'));
            color.classList.add('selected');
        }
        color.onclick = () => {
            profileColors.forEach(c => c.classList.remove('selected'));
            color.classList.add('selected');

            const newColor = color.getAttribute('data-color');
            currentUser.avatarColor = newColor;

            // Update users array
            const idx = users.findIndex(u => u.id === currentUser.id);
            if (idx !== -1) users[idx].avatarColor = newColor;
            if (typeof saveUsers === 'function') saveUsers(users);
            if (typeof saveCurrentUser === 'function') saveCurrentUser(currentUser);

            // Apply immediately
            updateWelcomeScreen();
        };
    });

    // Theme color picker in profile
    const themeColorBtns = document.querySelectorAll('#themeColors .theme-color');
    const savedTheme = currentUser.theme || 'purple';

    themeColorBtns.forEach(btn => {
        // Mark active
        if (btn.getAttribute('data-theme') === savedTheme) {
            themeColorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        btn.onclick = () => {
            themeColorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const theme = btn.getAttribute('data-theme');
            currentUser.theme = theme;

            // Update users array
            const idx = users.findIndex(u => u.id === currentUser.id);
            if (idx !== -1) users[idx].theme = theme;
            if (typeof saveUsers === 'function') saveUsers(users);
            if (typeof saveCurrentUser === 'function') saveCurrentUser(currentUser);

            // Apply theme immediately
            applyTheme(theme);
        };
    });

    // Save name button
    const saveNameBtn = document.getElementById('saveNameBtn');
    if (saveNameBtn) {
        saveNameBtn.onclick = () => {
            const newName = document.getElementById('changeNameInput').value.trim();
            if (!newName) { alert('Введіть ім\'я!'); return; }
            currentUser.name = newName;
            const idx = users.findIndex(u => u.id === currentUser.id);
            if (idx !== -1) users[idx].name = newName;
            if (typeof saveUsers === 'function') saveUsers(users);
            if (typeof saveCurrentUser === 'function') saveCurrentUser(currentUser);
            updateWelcomeScreen();
            alert('✅ Ім\'я збережено!');
        };
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function setupButtons() {
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtnProfile');
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    const confirmCreateBtn = document.getElementById('confirmCreateBtn');
    const closeCreateModalBtn = document.getElementById('closeCreateModalBtn');
    const likeBtn = document.getElementById('likeBtn');
    const savePlaylistBtn = document.getElementById('savePlaylistBtn');
    const deletePlaylistBtnModal = document.getElementById('deletePlaylistBtnModal');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const exportBtn = document.getElementById('exportPlaylistsBtn');
    const importBtn = document.getElementById('importPlaylistsBtn');
    const logoutBtnProfile = document.getElementById('logoutBtnProfile');

    if (registerBtn) registerBtn.onclick = registerUser;
    if (loginBtn) loginBtn.onclick = loginUser;
    if (logoutBtnProfile) logoutBtnProfile.onclick = logout;
    if (deleteAccountBtn) deleteAccountBtn.onclick = deleteAccount;
    if (createPlaylistBtn) createPlaylistBtn.onclick = () => {
        document.getElementById('createPlaylistModal').style.display = 'flex';
    };
    if (confirmCreateBtn) confirmCreateBtn.onclick = createPlaylist;
    if (closeCreateModalBtn) closeCreateModalBtn.onclick = closeCreateModal;
    if (likeBtn) likeBtn.onclick = toggleFavorite;
    if (savePlaylistBtn) savePlaylistBtn.onclick = savePlaylistChanges;
    if (deletePlaylistBtnModal) deletePlaylistBtnModal.onclick = () => {
        if (currentEditingPlaylist) deletePlaylist(currentEditingPlaylist.id);
    };
    if (closeEditModalBtn) closeEditModalBtn.onclick = closeEditModal;
    if (exportBtn) exportBtn.onclick = exportPlaylists;
    if (importBtn) importBtn.onclick = importPlaylists;
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateToPage(page);
        });
    });
}

function setupLogo() {
    const logoHome = document.getElementById('logoHome');
    if (logoHome) {
        logoHome.onclick = () => navigateToPage('home');
    }
}

function setupAvatarClick() {
    const userInfoBtn = document.getElementById('userInfoBtn');
    if (userInfoBtn) {
        userInfoBtn.onclick = () => navigateToPage('profile');
    }
}

function init() {
    if (typeof loadUsers === 'function') users = loadUsers();
    if (typeof loadCurrentUser === 'function') currentUser = loadCurrentUser();

    setupTabs();
    setupAuthLinks();
    setupColorPicker();
    setupButtons();

    if (currentUser) {
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('app').style.display = 'block';

        // Apply saved theme on load
        applyTheme(currentUser.theme || 'purple');

        if (typeof loadPlaylistsData === 'function') loadPlaylistsData();
        if (typeof initPlayer === 'function') initPlayer();
        if (typeof renderPlaylists === 'function') renderPlaylists();
        if (typeof renderFavorites === 'function') renderFavorites();
        if (typeof renderStats === 'function') renderStats();

        setupNavigation();
        setupLogo();
        setupAvatarClick();
        updateWelcomeScreen();

    } else {
        document.getElementById('authModal').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', init);