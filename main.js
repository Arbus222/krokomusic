// ========== ГОЛОВНИЙ ФАЙЛ ==========

function setupTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    if (tabs.length === 0) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            
            if (loginForm) loginForm.classList.remove('active');
            if (registerForm) registerForm.classList.remove('active');
            
            const targetForm = document.getElementById(`${target}Form`);
            if (targetForm) targetForm.classList.add('active');
        });
    });
}

function setupAuthLinks() {
    const links = document.querySelectorAll('.auth-link');
    if (links.length === 0) return;
    
    links.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-tab');
            const tabs = document.querySelectorAll('.auth-tab');
            tabs.forEach(t => t.classList.remove('active'));
            const activeTab = document.querySelector(`.auth-tab[data-tab="${target}"]`);
            if (activeTab) activeTab.classList.add('active');
            
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            
            if (loginForm) loginForm.classList.remove('active');
            if (registerForm) registerForm.classList.remove('active');
            
            const targetForm = document.getElementById(`${target}Form`);
            if (targetForm) targetForm.classList.add('active');
        });
    });
}

function setupColorPicker() {
    const colors = document.querySelectorAll('.avatar-color');
    if (colors.length === 0) return;
    
    colors.forEach(color => {
        color.addEventListener('click', () => {
            colors.forEach(c => c.classList.remove('selected'));
            color.classList.add('selected');
        });
    });
}

function changeTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('kroko_theme', themeName);
    
    if (currentUser) {
        currentUser.theme = themeName;
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) users[userIndex] = currentUser;
        saveUsers(users);
        saveCurrentUser(currentUser);
    }
}

function loadSavedTheme() {
    const savedTheme = currentUser?.theme || localStorage.getItem('kroko_theme') || 'purple';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const activeTheme = document.querySelector(`.theme-color[data-theme="${savedTheme}"]`);
    if (activeTheme) {
        document.querySelectorAll('.theme-color').forEach(t => t.classList.remove('active'));
        activeTheme.classList.add('active');
    }
}

function setupProfileEvents() {
    const saveNameBtn = document.getElementById('saveNameBtn');
    const changeNameInput = document.getElementById('changeNameInput');
    const deleteAccountBtn = document.getElementById('deleteAccountBtnProfile');
    const profileColors = document.querySelectorAll('#profileColors .avatar-color');
    const themeColors = document.querySelectorAll('.theme-color');
    
    if (saveNameBtn) {
        saveNameBtn.onclick = () => {
            const newName = changeNameInput.value.trim();
            if (newName && currentUser) {
                currentUser.name = newName;
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) users[userIndex] = currentUser;
                saveUsers(users);
                saveCurrentUser(currentUser);
                updateWelcomeScreen();
                changeNameInput.value = '';
                alert('✅ Ім\'я змінено!');
            }
        };
    }
    
    if (deleteAccountBtn) deleteAccountBtn.onclick = deleteAccount;
    
    profileColors.forEach(color => {
        color.addEventListener('click', () => {
            profileColors.forEach(c => c.classList.remove('selected'));
            color.classList.add('selected');
            if (currentUser) {
                currentUser.avatarColor = color.getAttribute('data-color');
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) users[userIndex] = currentUser;
                saveUsers(users);
                saveCurrentUser(currentUser);
                updateWelcomeScreen();
            }
        });
    });
    
    if (themeColors.length > 0) {
        themeColors.forEach(theme => {
            theme.addEventListener('click', () => {
                const themeName = theme.getAttribute('data-theme');
                themeColors.forEach(t => t.classList.remove('active'));
                theme.classList.add('active');
                changeTheme(themeName);
            });
        });
    }
    
    loadSavedTheme();
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = ['home', 'profile', 'playlists', 'favorites', 'stats', 'about'];
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            pages.forEach(p => {
                const pageEl = document.getElementById(`${p}Page`);
                if (pageEl) pageEl.style.display = 'none';
            });
            
            const activePage = document.getElementById(`${page}Page`);
            if (activePage) activePage.style.display = 'block';
            
            if (page === 'profile') updateWelcomeScreen();
            if (page === 'playlists') renderPlaylists();
            if (page === 'favorites') renderFavorites();
            if (page === 'stats') renderStats();
        });
    });
}

function setupButtons() {
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnHeader = document.getElementById('logoutBtnHeader');
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    const confirmCreateBtn = document.getElementById('confirmCreateBtn');
    const closeCreateModalBtn = document.getElementById('closeCreateModalBtn');
    const likeBtn = document.getElementById('likeBtn');
    
    const savePlaylistBtn = document.getElementById('savePlaylistBtn');
    const deletePlaylistBtnModal = document.getElementById('deletePlaylistBtnModal');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    
    const exportBtn = document.getElementById('exportPlaylistsBtn');
    const importBtn = document.getElementById('importPlaylistsBtn');
    
    if (registerBtn) registerBtn.onclick = registerUser;
    if (loginBtn) loginBtn.onclick = loginUser;
    if (logoutBtn) logoutBtn.onclick = logout;
    if (logoutBtnHeader) logoutBtnHeader.onclick = logout;
    if (createPlaylistBtn) createPlaylistBtn.onclick = () => {
        document.getElementById('createPlaylistModal').style.display = 'flex';
    };
    if (confirmCreateBtn) confirmCreateBtn.onclick = createPlaylist;
    if (closeCreateModalBtn) closeCreateModalBtn.onclick = closeCreateModal;
    if (likeBtn) likeBtn.onclick = toggleFavorite;
    
    if (savePlaylistBtn) savePlaylistBtn.onclick = savePlaylistChanges;
    if (deletePlaylistBtnModal) deletePlaylistBtnModal.onclick = () => {
        if (currentEditingPlaylist) {
            deletePlaylist(currentEditingPlaylist.id);
        }
    };
    if (closeEditModalBtn) closeEditModalBtn.onclick = closeEditModal;
    
    if (exportBtn) exportBtn.onclick = exportPlaylists;
    if (importBtn) importBtn.onclick = importPlaylists;
    
    console.log('Кнопки налаштовані');
}

function setupLogo() {
    const logoHome = document.getElementById('logoHome');
    if (logoHome) {
        logoHome.onclick = () => {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const homeLink = document.querySelector('.nav-link[data-page="home"]');
            if (homeLink) homeLink.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            const homePage = document.getElementById('homePage');
            if (homePage) homePage.style.display = 'block';
        };
    }
}

function init() {
    users = loadUsers();
    currentUser = loadCurrentUser();
    
    setupTabs();
    setupAuthLinks();
    setupColorPicker();
    setupButtons();
    
    if (currentUser) {
        const authModal = document.getElementById('authModal');
        const app = document.getElementById('app');
        if (authModal) authModal.style.display = 'none';
        if (app) app.style.display = 'block';
        
        loadPlaylistsData();
        initPlayer();
        renderPlaylists();
        renderFavorites();
        renderStats();
        setupNavigation();
        setupProfileEvents();
        setupLogo();
        updateWelcomeScreen();
        loadSavedTheme();
        
        const savedColor = currentUser.avatarColor;
        if (savedColor) {
            const colorElement = document.querySelector(`#profileColors .avatar-color[data-color="${savedColor}"]`);
            if (colorElement) {
                document.querySelectorAll('#profileColors .avatar-color').forEach(c => c.classList.remove('selected'));
                colorElement.classList.add('selected');
            }
        }
    } else {
        const authModal = document.getElementById('authModal');
        const app = document.getElementById('app');
        if (authModal) authModal.style.display = 'flex';
        if (app) app.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', init);