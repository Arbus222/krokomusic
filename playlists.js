// ========== ПЛЕЙЛИСТИ ТА ОБРАНЕ ==========

let customPlaylists = [];
let favorites = [];
let currentEditingPlaylist = null;

function loadPlaylistsData() {
    const savedPlaylists = localStorage.getItem(`kroko_playlists_${currentUser.id}`);
    const savedFavorites = localStorage.getItem(`kroko_favs_${currentUser.id}`);
    
    customPlaylists = (savedPlaylists && savedPlaylists !== 'undefined') ? JSON.parse(savedPlaylists) : [];
    favorites = (savedFavorites && savedFavorites !== 'undefined') ? JSON.parse(savedFavorites) : [];
}

function savePlaylistsData() {
    localStorage.setItem(`kroko_playlists_${currentUser.id}`, JSON.stringify(customPlaylists));
    localStorage.setItem(`kroko_favs_${currentUser.id}`, JSON.stringify(favorites));
}

function renderPlaylists() {
    const container = document.getElementById('playlistsGrid');
    if (!container) return;
    
    if (customPlaylists.length === 0) {
        container.innerHTML = '<div class="empty-message">📁 У вас ще немає плейлистів. Створіть перший!</div>';
        return;
    }
    
    container.innerHTML = customPlaylists.map(playlist => `
        <div class="playlist-card" onclick="openPlaylist(${playlist.id})">
            <div class="playlist-card-header">
                <div class="playlist-cover">📀</div>
                <div class="playlist-actions">
                    <button class="playlist-edit-btn" onclick="event.stopPropagation(); openPlaylist(${playlist.id})">✏️ Редагувати</button>
                    <button class="playlist-delete-btn" onclick="event.stopPropagation(); deletePlaylist(${playlist.id})">🗑️</button>
                </div>
            </div>
            <div class="playlist-name">${escapeHtml(playlist.name)}</div>
            <div class="playlist-count">${playlist.songs.length} пісень</div>
        </div>
    `).join('');
}

function renderFavorites() {
    const container = document.getElementById('favoritesGrid');
    if (!container) return;
    
    if (favorites.length === 0) {
        container.innerHTML = '<div class="empty-message">❤️ У вас ще немає улюблених треків. Натисніть ♡ на треку!</div>';
        return;
    }
    
    container.innerHTML = favorites.map(song => {
        // Перевіряємо чи є картинка
        let coverHtml = '';
        if (song.cover && song.cover !== "") {
            coverHtml = `<img src="${song.cover}" style="width:100%; height:100%; object-fit:cover; border-radius:14px;" onerror="this.style.display='none'; this.parentElement.innerHTML='🎵'">`;
        } else {
            coverHtml = '<div style="font-size: 40px; display:flex; align-items:center; justify-content:center; height:100%;">🎵</div>';
        }
        
        return `
            <div class="song-card" onclick="playTrack(${songsList.findIndex(s => s.id === song.id)})">
                <div class="song-cover" style="overflow:hidden; display:flex; align-items:center; justify-content:center; width:100%; aspect-ratio:1;">
                    ${coverHtml}
                </div>
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
                <button class="remove-fav" onclick="event.stopPropagation(); removeFromFavorites(${song.id})" style="background:rgba(255,255,255,0.1); border:none; color:white; padding:5px 10px; border-radius:8px; margin-top:8px; cursor:pointer;">❌ Видалити</button>
            </div>
        `;
    }).join('');
}

// ВІДКРИТИ ПЛЕЙЛИСТ ДЛЯ РЕДАГУВАННЯ
function openPlaylist(playlistId) {
    const playlist = customPlaylists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    currentEditingPlaylist = playlist;
    
    document.getElementById('editPlaylistTitle').innerText = `Редагувати: ${playlist.name}`;
    document.getElementById('editPlaylistName').value = playlist.name;
    
    renderPlaylistSongs();
    renderAvailableSongs();
    document.getElementById('editPlaylistModal').style.display = 'flex';
}

// ПОКАЗАТИ ПІСНІ В ПЛЕЙЛИСТІ
function renderPlaylistSongs() {
    const container = document.getElementById('playlistSongsList');
    if (!container || !currentEditingPlaylist) return;
    
    if (currentEditingPlaylist.songs.length === 0) {
        container.innerHTML = '<div class="empty-message">Немає пісень у цьому плейлисті</div>';
        return;
    }
    
    container.innerHTML = currentEditingPlaylist.songs.map(song => `
        <div class="playlist-song-item">
            <div>
                <strong>${escapeHtml(song.title)}</strong><br>
                <small>${escapeHtml(song.artist)}</small>
            </div>
            <button class="remove-song-btn" onclick="removeSongFromPlaylist(${song.id})">❌ Видалити</button>
        </div>
    `).join('');
}

// ПОКАЗАТИ ДОСТУПНІ ПІСНІ ДЛЯ ДОДАВАННЯ
function renderAvailableSongs() {
    const container = document.getElementById('availableSongsList');
    if (!container || !currentEditingPlaylist) return;
    
    const playlistSongIds = currentEditingPlaylist.songs.map(s => s.id);
    const availableSongs = songsList.filter(song => !playlistSongIds.includes(song.id));
    
    if (availableSongs.length === 0) {
        container.innerHTML = '<div class="empty-message">Всі пісні вже в плейлисті</div>';
        return;
    }
    
    container.innerHTML = availableSongs.map(song => `
        <div class="available-song-item">
            <div>
                <strong>${escapeHtml(song.title)}</strong><br>
                <small>${escapeHtml(song.artist)}</small>
            </div>
            <button class="add-song-btn" onclick="addSongToPlaylist(${song.id})">+ Додати</button>
        </div>
    `).join('');
}

// ДОДАТИ ПІСНЮ В ПЛЕЙЛИСТ
function addSongToPlaylist(songId) {
    const song = songsList.find(s => s.id === songId);
    if (song && currentEditingPlaylist) {
        currentEditingPlaylist.songs.push(song);
        savePlaylistsData();
        renderPlaylistSongs();
        renderAvailableSongs();
        renderPlaylists();
    }
}

// ВИДАЛИТИ ПІСНЮ З ПЛЕЙЛИСТА
function removeSongFromPlaylist(songId) {
    if (currentEditingPlaylist) {
        currentEditingPlaylist.songs = currentEditingPlaylist.songs.filter(s => s.id !== songId);
        savePlaylistsData();
        renderPlaylistSongs();
        renderAvailableSongs();
        renderPlaylists();
    }
}

function savePlaylistChanges() {
    console.log('savePlaylistChanges викликано');
    
    if (!currentEditingPlaylist) {
        console.log('currentEditingPlaylist немає');
        return;
    }
    
    const newName = document.getElementById('editPlaylistName').value.trim();
    console.log('Нова назва:', newName);
    
    if (newName) {
        currentEditingPlaylist.name = newName;
        savePlaylistsData();
        renderPlaylists();
        console.log('Назву збережено');
    }
    
    closeEditModal();
}

// ВИДАЛИТИ ПЛЕЙЛИСТ
function deletePlaylist(playlistId) {
    console.log('deletePlaylist викликано для:', playlistId);
    
    if (confirm('Ви впевнені, що хочете видалити цей плейлист?')) {
        customPlaylists = customPlaylists.filter(p => p.id !== playlistId);
        savePlaylistsData();
        renderPlaylists();
        closeEditModal();
        console.log('Плейлист видалено');
    }
}

// СТВОРИТИ ПЛЕЙЛИСТ
function createPlaylist() {
    const name = document.getElementById('playlistName').value.trim();
    if (!name) {
        alert('Введіть назву плейлиста!');
        return;
    }
    
    customPlaylists.push({
        id: Date.now(),
        name: name,
        songs: []
    });
    savePlaylistsData();
    renderPlaylists();
    closeCreateModal();
    document.getElementById('playlistName').value = '';
}

function toggleFavorite() {
    if (!songsList[currentTrackIndex]) return;
    
    const currentSong = songsList[currentTrackIndex];
    const index = favorites.findIndex(f => f.id === currentSong.id);
    
    if (index === -1) {
        favorites.push(currentSong);
    } else {
        favorites.splice(index, 1);
    }
    
    savePlaylistsData();
    renderFavorites();
    updateLikeButton();
}

function updateLikeButton() {
    const likeBtn = document.getElementById('likeBtn');
    if (!likeBtn || !songsList[currentTrackIndex]) return;
    
    const isFav = favorites.some(f => f.id === songsList[currentTrackIndex].id);
    likeBtn.innerHTML = isFav ? '❤️' : '♡';
}

function removeFromFavorites(songId) {
    favorites = favorites.filter(f => f.id !== songId);
    savePlaylistsData();
    renderFavorites();
    updateLikeButton();
}

function closeCreateModal() {
    document.getElementById('createPlaylistModal').style.display = 'none';
}

function closeEditModal() {
    console.log('closeEditModal викликано');
    document.getElementById('editPlaylistModal').style.display = 'none';
    currentEditingPlaylist = null;
}

// Глобальні функції
window.openPlaylist = openPlaylist;
window.deletePlaylist = deletePlaylist;
window.addSongToPlaylist = addSongToPlaylist;
window.removeSongFromPlaylist = removeSongFromPlaylist;
window.removeFromFavorites = removeFromFavorites;
window.savePlaylistChanges = savePlaylistChanges;



// ========== ЕКСПОРТ ПЛЕЙЛИСТІВ ==========
function exportPlaylists() {
    if (customPlaylists.length === 0) {
        alert('📁 Немає плейлистів для експорту!');
        return;
    }
    
    const data = JSON.stringify(customPlaylists, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playlists_${currentUser.name}_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Плейлисти експортовано!');
}

// ========== ІМПОРТ ПЛЕЙЛИСТІВ ==========
function importPlaylists() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (Array.isArray(imported)) {
                    customPlaylists.push(...imported);
                    savePlaylistsData();
                    renderPlaylists();
                    alert(`✅ Імпортовано ${imported.length} плейлистів!`);
                } else {
                    alert('❌ Невірний формат файлу');
                }
            } catch(err) {
                alert('❌ Помилка читання файлу');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}