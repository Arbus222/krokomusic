// ========== МУЗИЧНИЙ ПЛЕЄР ==========

let songsList = [];
let currentTrackIndex = 0;
let isPlaying = false;
let shuffleMode = false;
let repeatMode = false;
let shuffledIndices = [];
let currentShuffleIndex = 0;
let listenStats = {};
let currentBannerIndex = 0;
let bannerInterval;
let recentlyPlayed = [];

// Audio visualizer
let audioContext = null;
let analyser = null;
let source = null;
let animationId = null;
let isVisualizerActive = false;

const audio = document.getElementById('audio');

const defaultSongs = [
    { id: 1, title: "gazan67", artist: "gazan", src: "music4.mp3", cover: "gazan67.jpg" },
    { id: 2, title: "Example Song 2", artist: "gazan", src: "music2.mp3", cover: "" },
    { id: 3, title: "Example Song 3", artist: "Artist 3", src: "song3.mp3", cover: "" },
    { id: 4, title: "Example Song 4", artist: "Artist 4", src: "song4.mp3", cover: "" },
    { id: 5, title: "Example Song 5", artist: "Artist 5", src: "song5.mp3", cover: "" }
];

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span><div class="toast-progress"></div>`;

    toast.addEventListener('click', () => dismissToast(toast));
    container.appendChild(toast);

    setTimeout(() => dismissToast(toast), 3000);
}

function dismissToast(toast) {
    if (toast.classList.contains('hiding')) return;
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
}

// ========== RECENTLY PLAYED ==========
function loadRecentlyPlayed() {
    const saved = localStorage.getItem(`kroko_recent_${currentUser.id}`);
    recentlyPlayed = saved ? JSON.parse(saved) : [];
}

function saveRecentlyPlayed() {
    localStorage.setItem(`kroko_recent_${currentUser.id}`, JSON.stringify(recentlyPlayed));
}

function addToRecentlyPlayed(song) {
    recentlyPlayed = recentlyPlayed.filter(s => s.id !== song.id);
    recentlyPlayed.unshift({ ...song });
    if (recentlyPlayed.length > 15) recentlyPlayed = recentlyPlayed.slice(0, 15);
    saveRecentlyPlayed();
    renderRecentlyPlayed();
}

function renderRecentlyPlayed() {
    const container = document.getElementById('recentlyRow');
    if (!container) return;
    const section = document.getElementById('recentlySection');

    if (!recentlyPlayed.length) {
        if (section) section.style.display = 'none';
        return;
    }
    if (section) section.style.display = 'block';

    container.innerHTML = recentlyPlayed.map(song => {
        const idx = songsList.findIndex(s => s.id === song.id);
        const thumbHtml = song.cover && song.cover !== ''
            ? `<img src="${song.cover}" onerror="this.parentElement.innerHTML='🎵'">`
            : '🎵';
        return `
            <div class="recently-item" onclick="playTrack(${idx < 0 ? 0 : idx})">
                <div class="recently-thumb">${thumbHtml}</div>
                <div class="recently-text">
                    <div class="recently-name">${escapeHtml(song.title)}</div>
                    <div class="recently-artist">${escapeHtml(song.artist)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== QUEUE ==========
function renderQueue() {
    const list = document.getElementById('queueList');
    if (!list) return;

    list.innerHTML = songsList.map((song, index) => {
        const isActive = index === currentTrackIndex && isPlaying;
        const thumbHtml = song.cover && song.cover !== ''
            ? `<img src="${song.cover}" onerror="this.parentElement.innerHTML='🎵'">`
            : '🎵';
        return `
            <div class="queue-item ${isActive ? 'active' : ''}" onclick="playTrack(${index})">
                <div class="queue-cover">${thumbHtml}</div>
                <div class="queue-info">
                    <div class="queue-title">${escapeHtml(song.title)}</div>
                    <div class="queue-artist">${escapeHtml(song.artist)}</div>
                </div>
                ${isActive ? '<span style="color:var(--primary-color);font-size:16px;">♪</span>' : `<span style="color:#4b5563;font-size:12px;">${index + 1}</span>`}
            </div>
        `;
    }).join('');

    const activeEl = list.querySelector('.queue-item.active');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
}

function toggleQueue() {
    const panel = document.getElementById('queuePanel');
    const btn = document.getElementById('queueToggleBtn');
    if (!panel) return;
    const isOpen = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    if (btn) btn.classList.toggle('active', !isOpen);
    if (!isOpen) renderQueue();
}

// ========== CONTEXT MENU ==========
let contextMenuSongIndex = -1;

function showContextMenu(e, songIndex) {
    e.preventDefault();
    e.stopPropagation();
    contextMenuSongIndex = songIndex;

    const menu = document.getElementById('contextMenu');
    if (!menu) return;

    const song = songsList[songIndex];
    if (!song) return;

    const isFav = typeof favorites !== 'undefined' && favorites.some(f => f.id === song.id);

    menu.innerHTML = `
        <div class="context-item" onclick="playTrack(${songIndex}); hideContextMenu()">▶ Грати</div>
        <div class="context-item" onclick="contextAddNext(${songIndex}); hideContextMenu()">⏭ Грати наступним</div>
        <div class="context-divider"></div>
        <div class="context-item" onclick="contextToggleFav(${songIndex}); hideContextMenu()">${isFav ? '💔 Видалити з обраного' : '❤️ Додати в обране'}</div>
        <div class="context-item" onclick="contextAddToPlaylist(${songIndex}); hideContextMenu()">📁 Додати в плейлист</div>
        <div class="context-divider"></div>
        <div class="context-item danger" onclick="contextDeleteSong(${songIndex}); hideContextMenu()">🗑️ Видалити трек</div>
    `;

    menu.style.display = 'block';

    const x = e.clientX, y = e.clientY;
    const mw = menu.offsetWidth || 210, mh = menu.offsetHeight || 200;
    menu.style.left = (x + mw > window.innerWidth ? x - mw : x) + 'px';
    menu.style.top  = (y + mh > window.innerHeight ? y - mh : y) + 'px';
}

function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.style.display = 'none';
    contextMenuSongIndex = -1;
}

function contextToggleFav(index) {
    const song = songsList[index];
    if (!song || typeof favorites === 'undefined') return;
    const idx = favorites.findIndex(f => f.id === song.id);
    if (idx === -1) {
        favorites.push(song);
        showToast(`❤️ Додано в обране: ${song.title}`, 'success');
    } else {
        favorites.splice(idx, 1);
        showToast(`Видалено з обраного`, 'info');
    }
    if (typeof savePlaylistsData === 'function') savePlaylistsData();
    if (typeof renderFavorites === 'function') renderFavorites();
    updateLikeButtons();
}

function contextAddNext(index) {
    showToast('⏭ Буде зіграно наступним', 'info');
}

function contextAddToPlaylist(index) {
    if (typeof customPlaylists === 'undefined' || customPlaylists.length === 0) {
        showToast('Спочатку створіть плейлист', 'warning');
        return;
    }
    showToast(`Оберіть плейлист зі сторінки Плейлисти`, 'info');
}

function contextDeleteSong(index) {
    const song = songsList[index];
    if (!song) return;
    if (!confirm(`Видалити "${song.title}"?`)) return;
    songsList.splice(index, 1);
    localStorage.setItem(`kroko_songs_${currentUser.id}`, JSON.stringify(songsList));
    renderSongs();
    renderQueue();
    showToast(`🗑️ Видалено: ${song.title}`, 'info');
}

function updateLikeButtons() {
    if (!songsList[currentTrackIndex]) return;
    const isFav = typeof favorites !== 'undefined' && favorites.some(f => f.id === songsList[currentTrackIndex].id);
    const btns = ['playerLikeBtn', 'fsLikeBtn'];
    btns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.innerHTML = isFav ? '❤️' : '♡';
            btn.classList.toggle('liked', isFav);
        }
    });
}

// ========== FULLSCREEN PLAYER ==========
function openFullscreenPlayer() {
    const fs = document.getElementById('fullscreenPlayer');
    if (!fs) return;
    fs.classList.add('open');
    syncFullscreenPlayer();
}

function closeFullscreenPlayer() {
    const fs = document.getElementById('fullscreenPlayer');
    if (fs) fs.classList.remove('open');
}

function syncFullscreenPlayer() {
    if (!songsList[currentTrackIndex]) return;
    const song = songsList[currentTrackIndex];

    const cover = document.getElementById('fsCoverEl');
    const title = document.getElementById('fsTitleEl');
    const artist = document.getElementById('fsArtistEl');
    const likeBtn = document.getElementById('fsLikeBtn');
    const playBtn = document.getElementById('fsPlayBtn');

    if (cover) {
        if (song.cover && song.cover !== '') {
            cover.innerHTML = `<img src="${song.cover}" onerror="this.parentElement.innerHTML='🎵'">`;
        } else {
            cover.innerHTML = '🎵';
        }
        cover.classList.toggle('playing', isPlaying);
    }
    if (title)  title.textContent  = song.title;
    if (artist) artist.textContent = song.artist;
    if (playBtn) playBtn.innerHTML = isPlaying ? '⏸' : '▶';
    updateLikeButtons();

    const fsShuffleBtn = document.getElementById('fsShuffleBtn');
    const fsRepeatBtn  = document.getElementById('fsRepeatBtn');
    if (fsShuffleBtn) fsShuffleBtn.classList.toggle('active', shuffleMode);
    if (fsRepeatBtn)  fsRepeatBtn.classList.toggle('active', repeatMode);
}

function setupFullscreenPlayer() {
    const dragHandle = document.getElementById('fsDragHandle');
    const artworkBtn = document.getElementById('playerArtwork');
    if (dragHandle) dragHandle.addEventListener('click', closeFullscreenPlayer);
    if (artworkBtn) artworkBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) openFullscreenPlayer();
    });

    const fsPlay   = document.getElementById('fsPlayBtn');
    const fsNext   = document.getElementById('fsNextBtn');
    const fsPrev   = document.getElementById('fsPrevBtn');
    const fsShuffle = document.getElementById('fsShuffleBtn');
    const fsRepeat  = document.getElementById('fsRepeatBtn');
    const fsLike   = document.getElementById('fsLikeBtn');

    if (fsPlay)    fsPlay.addEventListener('click', () => { togglePlayPause(); syncFullscreenPlayer(); });
    if (fsNext)    fsNext.addEventListener('click', () => { nextTrack(); syncFullscreenPlayer(); });
    if (fsPrev)    fsPrev.addEventListener('click', () => { prevTrack(); syncFullscreenPlayer(); });
    if (fsShuffle) fsShuffle.addEventListener('click', () => { toggleShuffle(); syncFullscreenPlayer(); });
    if (fsRepeat)  fsRepeat.addEventListener('click', () => { toggleRepeat(); syncFullscreenPlayer(); });
    if (fsLike)    fsLike.addEventListener('click', () => { toggleFavoriteCurrentTrack(); });

    const fsProgress = document.getElementById('fsProgressSlider');
    if (fsProgress) {
        fsProgress.addEventListener('input', (e) => {
            audio.currentTime = (e.target.value / 100) * audio.duration;
        });
    }

    const fsVol = document.getElementById('fsVolumeSlider');
    const fsVolFill = document.getElementById('fsVolFill');
    const mainVol = document.getElementById('volumeSlider');
    if (fsVol) {
        fsVol.value = mainVol ? mainVol.value : 0.7;
        fsVol.addEventListener('input', (e) => {
            audio.volume = e.target.value;
            if (fsVolFill) fsVolFill.style.width = (e.target.value * 100) + '%';
            if (mainVol) { mainVol.value = e.target.value; document.getElementById('volumeFill').style.width = (e.target.value * 100) + '%'; }
        });
    }

    let startY = 0;
    const fs = document.getElementById('fullscreenPlayer');
    if (fs) {
        fs.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
        fs.addEventListener('touchend', (e) => {
            const dy = e.changedTouches[0].clientY - startY;
            if (dy > 80) closeFullscreenPlayer();
        }, { passive: true });
    }
}

// ========== AUDIO VISUALIZER ==========
function initAudioContext() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        isVisualizerActive = true;
    } catch(e) {
        isVisualizerActive = false;
    }
}

function startVisualizer() {
    const waveAnimation = document.getElementById('waveAnimation');
    if (!waveAnimation) return;
    waveAnimation.style.display = 'flex';
    if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    if (!analyser) initAudioContext();
    waveAnimation.classList.add('active');
    if (!isVisualizerActive) return;
    const bars = waveAnimation.querySelectorAll('span');
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    function animate() {
        if (!isPlaying) { if (animationId) cancelAnimationFrame(animationId); animationId = null; return; }
        if (analyser && bars.length) {
            analyser.getByteFrequencyData(dataArray);
            for (let i = 0; i < bars.length; i++) {
                let h = Math.max(8, Math.min(35, (dataArray[i * 8] || 0) / 4));
                bars[i].style.height = h + 'px';
            }
        }
        animationId = requestAnimationFrame(animate);
    }
    if (!animationId) animate();
}

function stopVisualizer() {
    const wa = document.getElementById('waveAnimation');
    if (!wa) return;
    wa.classList.remove('active');
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    wa.querySelectorAll('span').forEach(b => b.style.height = '8px');
}

function hideVisualizer() {
    const wa = document.getElementById('waveAnimation');
    if (wa) { wa.style.display = 'none'; wa.classList.remove('active'); }
}

// ========== STATS ==========
function loadListenStats() {
    const saved = localStorage.getItem(`kroko_listens_${currentUser.id}`);
    listenStats = saved ? JSON.parse(saved) : {};
}

function saveListenStats() {
    localStorage.setItem(`kroko_listens_${currentUser.id}`, JSON.stringify(listenStats));
}

function incrementPlayCount(songId) {
    if (!listenStats[songId]) listenStats[songId] = 0;
    listenStats[songId]++;
    saveListenStats();
}

function renderStats() {
    const container = document.getElementById('statsGrid');
    if (!container) return;
    const sorted = Object.entries(listenStats).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) {
        container.innerHTML = '<div class="empty-message">📊 Немає даних про прослуховування</div>';
        return;
    }
    container.innerHTML = sorted.map(([songId, count]) => {
        const song = songsList.find(s => s.id == songId);
        if (!song) return '';
        const coverHtml = song.cover && song.cover !== ''
            ? `<img src="${song.cover}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" onerror="this.style.display='none';this.parentElement.innerHTML='🎵'">`
            : '<div style="font-size:24px;">🎵</div>';
        return `
            <div class="stat-card" onclick="playTrack(${songsList.findIndex(s => s.id == songId)})">
                <div style="width:50px;height:50px;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);flex-shrink:0;">${coverHtml}</div>
                <div class="stat-info"><div class="stat-title">${escapeHtml(song.title)}</div><div class="stat-artist">${escapeHtml(song.artist)}</div></div>
                <div class="stat-count">${count} 🎧</div>
            </div>`;
    }).join('');
}

// ========== SHUFFLE / REPEAT ==========
function toggleShuffle() {
    shuffleMode = !shuffleMode;
    const btn = document.getElementById('shuffleBtn');
    if (btn) btn.classList.toggle('active', shuffleMode);
    if (shuffleMode && songsList.length > 0) {
        shuffledIndices = Array.from({ length: songsList.length }, (_, i) => i);
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }
        currentShuffleIndex = shuffledIndices.findIndex(i => i === currentTrackIndex);
        if (currentShuffleIndex === -1) currentShuffleIndex = 0;
    }
    showToast(shuffleMode ? '🔀 Перемішування увімкнено' : 'Перемішування вимкнено', 'info');
}

function toggleRepeat() {
    repeatMode = !repeatMode;
    const btn = document.getElementById('repeatBtn');
    if (btn) btn.classList.toggle('active', repeatMode);
    showToast(repeatMode ? '🔁 Повтор увімкнено' : 'Повтор вимкнено', 'info');
}

function getNextTrackIndex() {
    if (repeatMode) return currentTrackIndex;
    if (shuffleMode) { currentShuffleIndex = (currentShuffleIndex + 1) % shuffledIndices.length; return shuffledIndices[currentShuffleIndex]; }
    return (currentTrackIndex + 1) % songsList.length;
}

function getPrevTrackIndex() {
    if (shuffleMode) { currentShuffleIndex = (currentShuffleIndex - 1 + shuffledIndices.length) % shuffledIndices.length; return shuffledIndices[currentShuffleIndex]; }
    return (currentTrackIndex - 1 + songsList.length) % songsList.length;
}

// ========== PLAYER CORE ==========
function initPlayer() {
    loadListenStats();
    loadRecentlyPlayed();
    const savedSongs = localStorage.getItem(`kroko_songs_${currentUser.id}`);
    if (savedSongs && savedSongs !== 'undefined') {
        try { songsList = JSON.parse(savedSongs); } catch(e) { songsList = defaultSongs; }
    } else {
        songsList = defaultSongs;
        localStorage.setItem(`kroko_songs_${currentUser.id}`, JSON.stringify(songsList));
    }
    renderSongs();
    renderStats();
    renderRecentlyPlayed();
    if (songsList.length > 0) loadTrack(0);
    setupPlayerEvents();
    setupHotkeys();
    setupSearch();
    setupDragAndDrop();
    initBanner();
    setupFullscreenPlayer();
    setupPlayerSwipe();
}

function loadTrack(index) {
    if (index < 0 || index >= songsList.length) return;
    currentTrackIndex = index;
    const song = songsList[index];

    const currentTitle  = document.getElementById('currentTitle');
    const currentArtist = document.getElementById('currentArtist');
    const playerTitle   = document.getElementById('playerTitle');
    const playerArtist  = document.getElementById('playerArtist');
    const heroArtwork   = document.getElementById('heroArtwork');
    const playerArtwork = document.getElementById('playerArtwork');

    if (currentTitle)  currentTitle.innerText  = song.title;
    if (currentArtist) currentArtist.innerText = song.artist;
    if (playerTitle)   playerTitle.innerText   = song.title;
    if (playerArtist)  playerArtist.innerText  = song.artist;

    const imgHtml = song.cover && song.cover !== ''
        ? `<img src="${song.cover}" onerror="this.parentElement.innerHTML='🎵'">`
        : null;

    if (heroArtwork)   heroArtwork.innerHTML   = imgHtml || '🎵';
    if (playerArtwork) playerArtwork.innerHTML = imgHtml || '🎵';

    audio.src = song.src;
    audio.load();

    const ppBtn = document.getElementById('playPauseBtn');
    if (ppBtn) ppBtn.innerHTML = '▶';
    isPlaying = false;
    hideVisualizer();
    updateLikeButtons();
    syncFullscreenPlayer();
    renderQueue();
}

function playTrack(index) {
    if (index < 0 || index >= songsList.length) return;
    loadTrack(index);
    audio.play().catch(() => {});
    isPlaying = true;
    const ppBtn = document.getElementById('playPauseBtn');
    if (ppBtn) ppBtn.innerHTML = '⏸';
    const song = songsList[index];
    if (song) {
        incrementPlayCount(song.id);
        renderStats();
        addToRecentlyPlayed(song);
    }
    initAudioContext();
    startVisualizer();
    syncFullscreenPlayer();
    renderQueue();
}

function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
        const ppBtn = document.getElementById('playPauseBtn');
        if (ppBtn) ppBtn.innerHTML = '▶';
        stopVisualizer();
    } else {
        audio.play().catch(() => {});
        const ppBtn = document.getElementById('playPauseBtn');
        if (ppBtn) ppBtn.innerHTML = '⏸';
        startVisualizer();
    }
    isPlaying = !isPlaying;
    syncFullscreenPlayer();
}

function toggleFavoriteCurrentTrack() {
    if (!songsList[currentTrackIndex] || typeof favorites === 'undefined') return;
    const song = songsList[currentTrackIndex];
    const idx = favorites.findIndex(f => f.id === song.id);
    if (idx === -1) {
        favorites.push(song);
        showToast(`❤️ Додано: ${song.title}`, 'success');
    } else {
        favorites.splice(idx, 1);
        showToast('Видалено з обраного', 'info');
    }
    if (typeof savePlaylistsData === 'function') savePlaylistsData();
    if (typeof renderFavorites === 'function') renderFavorites();
    updateLikeButtons();
}

function nextTrack() { playTrack(getNextTrackIndex()); }
function prevTrack() { playTrack(getPrevTrackIndex()); }

function setupPlayerEvents() {
    const playPauseBtn  = document.getElementById('playPauseBtn');
    const nextBtn       = document.getElementById('nextBtn');
    const prevBtn       = document.getElementById('prevBtn');
    const heroPlayBtn   = document.getElementById('heroPlayBtn');
    const progressSlider = document.getElementById('progressSlider');
    const volumeSlider  = document.getElementById('volumeSlider');
    const volumeFill    = document.getElementById('volumeFill');
    const speedSelect   = document.getElementById('speedSelect');
    const shuffleBtn    = document.getElementById('shuffleBtn');
    const repeatBtn     = document.getElementById('repeatBtn');
    const likeBtn       = document.getElementById('playerLikeBtn');
    const queueToggle   = document.getElementById('queueToggleBtn');

    if (playPauseBtn) playPauseBtn.onclick  = togglePlayPause;
    if (nextBtn)      nextBtn.onclick        = nextTrack;
    if (prevBtn)      prevBtn.onclick        = prevTrack;
    if (heroPlayBtn)  heroPlayBtn.onclick    = togglePlayPause;
    if (shuffleBtn)   shuffleBtn.onclick     = toggleShuffle;
    if (repeatBtn)    repeatBtn.onclick      = toggleRepeat;
    if (likeBtn)      likeBtn.onclick        = toggleFavoriteCurrentTrack;
    if (queueToggle)  queueToggle.onclick    = toggleQueue;

    if (audio) {
        audio.ontimeupdate = () => {
            if (!audio.duration) return;
            const pct = (audio.currentTime / audio.duration) * 100;
            const progressFill = document.getElementById('progressFill');
            const currentTimeSpan = document.getElementById('currentTime');
            const durationSpan    = document.getElementById('duration');
            const fsProgress      = document.getElementById('fsProgressSlider');
            const fsProgressFill  = document.getElementById('fsProgressFill');
            const fsCurrent       = document.getElementById('fsCurrentTime');
            const fsDuration      = document.getElementById('fsDuration');

            if (progressSlider) progressSlider.value = pct;
            if (progressFill) progressFill.style.width = pct + '%';
            if (currentTimeSpan) currentTimeSpan.innerText = formatTime(audio.currentTime);
            if (durationSpan)    durationSpan.innerText    = formatTime(audio.duration);

            if (fsProgress) fsProgress.value = pct;
            if (fsProgressFill) fsProgressFill.style.width = pct + '%';
            if (fsCurrent) fsCurrent.textContent = formatTime(audio.currentTime);
            if (fsDuration) fsDuration.textContent = formatTime(audio.duration);
        };

        audio.onended = () => { stopVisualizer(); nextTrack(); };
        audio.addEventListener('play',  () => { isPlaying = true; startVisualizer(); syncFullscreenPlayer(); });
        audio.addEventListener('pause', () => { isPlaying = false; stopVisualizer(); syncFullscreenPlayer(); });
    }

    if (progressSlider) {
        progressSlider.oninput = (e) => { audio.currentTime = (e.target.value / 100) * audio.duration; };
    }

    if (volumeSlider) {
        volumeSlider.oninput = (e) => {
            audio.volume = e.target.value;
            if (volumeFill) volumeFill.style.width = (e.target.value * 100) + '%';
            const fsVolFill = document.getElementById('fsVolFill');
            const fsVol     = document.getElementById('fsVolumeSlider');
            if (fsVolFill) fsVolFill.style.width = (e.target.value * 100) + '%';
            if (fsVol) fsVol.value = e.target.value;
        };
    }

    if (speedSelect) {
        speedSelect.onchange = (e) => { audio.playbackRate = parseFloat(e.target.value); };
    }
}

function setupHotkeys() {
    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if (e.code === 'Space') { e.preventDefault(); togglePlayPause(); }
        else if (e.code === 'ArrowLeft')  { e.preventDefault(); prevTrack(); }
        else if (e.code === 'ArrowRight') { e.preventDefault(); nextTrack(); }
        else if (e.code === 'ArrowUp')    { e.preventDefault(); const v = document.getElementById('volumeSlider'); if (v) { v.value = Math.min(1, parseFloat(v.value) + 0.1); v.dispatchEvent(new Event('input')); } }
        else if (e.code === 'ArrowDown')  { e.preventDefault(); const v = document.getElementById('volumeSlider'); if (v) { v.value = Math.max(0, parseFloat(v.value) - 0.1); v.dispatchEvent(new Event('input')); } }
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) { renderSongs(); return; }
        const filtered = songsList.filter(s => s.title.toLowerCase().includes(query) || s.artist.toLowerCase().includes(query));
        const container = document.getElementById('songsGrid');
        if (!container) return;
        if (!filtered.length) { container.innerHTML = '<div class="empty-message">🔍 Нічого не знайдено</div>'; return; }
        container.innerHTML = filtered.map(song => {
            const idx = songsList.findIndex(s => s.id === song.id);
            const coverHtml = song.cover && song.cover !== ''
                ? `<img src="${song.cover}" onerror="this.parentElement.innerHTML='🎵'">`
                : '<div style="font-size:40px;display:flex;align-items:center;justify-content:height:100%;">🎵</div>';
            return `<div class="song-card" onclick="playTrack(${idx})" oncontextmenu="showContextMenu(event,${idx})"><div class="song-cover">${coverHtml}</div><div class="song-title">${escapeHtml(song.title)}</div><div class="song-artist">${escapeHtml(song.artist)}</div></div>`;
        }).join('');
    });
}

function setupDragAndDrop() {
    const dropOverlay = document.createElement('div');
    dropOverlay.id = 'dropOverlay';
    dropOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(124,58,237,0.2);border:3px dashed var(--primary-color);border-radius:16px;display:none;align-items:center;justify-content:center;z-index:10000;font-size:32px;backdrop-filter:blur(4px);';
    dropOverlay.innerHTML = '<div style="text-align:center;"><div style="font-size:48px;margin-bottom:16px;">🎵</div><div style="font-size:18px;font-weight:700;">Відпусти щоб додати треки</div></div>';
    document.body.appendChild(dropOverlay);

    let dragCounter = 0;
    document.body.addEventListener('dragenter', () => { dragCounter++; dropOverlay.style.display = 'flex'; });
    document.body.addEventListener('dragleave', () => { dragCounter--; if (dragCounter <= 0) { dragCounter = 0; dropOverlay.style.display = 'none'; } });
    document.body.addEventListener('dragover', (e) => e.preventDefault());
    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        dropOverlay.style.display = 'none';
        const files = e.dataTransfer.files;
        let added = 0;
        for (let file of files) {
            if (file.type.startsWith('audio/')) {
                songsList.push({ id: Date.now() + Math.random(), title: file.name.replace(/\.[^/.]+$/, ""), artist: "Невідомий виконавець", src: URL.createObjectURL(file), cover: "" });
                added++;
            }
        }
        if (added) {
            localStorage.setItem(`kroko_songs_${currentUser.id}`, JSON.stringify(songsList));
            renderSongs();
            showToast(`✅ Додано треків: ${added}`, 'success');
        }
    });
}

function initBanner() {
    const slides = document.querySelectorAll('.banner-slide');
    const dots   = document.querySelector('.banner-dots');
    const prevBtn = document.getElementById('bannerPrev');
    const nextBtn = document.getElementById('bannerNext');
    if (!slides.length) return;

    if (dots) {
        dots.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('banner-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToBanner(i));
            dots.appendChild(dot);
        });
    }

    function goToBanner(index) {
        slides.forEach((s, i) => s.classList.toggle('active', i === index));
        if (dots) Array.from(dots.children).forEach((d, i) => d.classList.toggle('active', i === index));
        currentBannerIndex = index;
    }

    if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); goToBanner((currentBannerIndex - 1 + slides.length) % slides.length); };
    if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); goToBanner((currentBannerIndex + 1) % slides.length); };

    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(() => goToBanner((currentBannerIndex + 1) % slides.length), 7000);
    setupBannerButtons();
}

function setupBannerButtons() {
    document.querySelectorAll('.banner-btn-new').forEach((btn, i) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (i === 0) { if (typeof navigateToPage === 'function') navigateToPage('home'); }
            else if (i === 1) { if (typeof navigateToPage === 'function') { navigateToPage('playlists'); setTimeout(() => { const cb = document.getElementById('createPlaylistBtn'); if (cb) cb.click(); }, 300); } }
            else if (i === 2) { if (typeof navigateToPage === 'function') navigateToPage('favorites'); }
        });
    });
}

function formatTime(s) {
    if (isNaN(s)) return "0:00";
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' + sec : sec}`;
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

function renderSongs() {
    const container = document.getElementById('songsGrid');
    if (!container) return;

    if (!songsList.length) {
        container.innerHTML = '<div class="empty-message">🎵 Немає треків. Перетягніть MP3 файли сюди!</div>';
        return;
    }

    container.innerHTML = songsList.map((song, index) => {
        const coverHtml = song.cover && song.cover !== ''
            ? `<img src="${song.cover}" onerror="this.parentElement.innerHTML='🎵'">`
            : '<div style="font-size:40px;display:flex;align-items:center;justify-content:center;height:100%;">🎵</div>';
        return `
            <div class="song-card" 
                 onclick="playTrack(${index})" 
                 oncontextmenu="showContextMenu(event,${index})">
                <div class="song-cover">${coverHtml}</div>
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>`;
    }).join('');
}

function setupPlayerSwipe() {
    const playerEl = document.querySelector('.player');
    if (!playerEl) return;
    let startX = 0, startY = 0;

    playerEl.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    playerEl.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) nextTrack();
            else prevTrack();
        } else if (dy < -60 && Math.abs(dy) > Math.abs(dx)) {
            openFullscreenPlayer();
        }
    }, { passive: true });
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('contextMenu');
    if (menu && !menu.contains(e.target)) hideContextMenu();
});

window.playTrack = playTrack;
window.showContextMenu = showContextMenu;
window.hideContextMenu = hideContextMenu;
window.toggleQueue = toggleQueue;