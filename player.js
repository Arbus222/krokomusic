// ========== МУЗИЧНИЙ ПЛЕЄР ==========

let songsList = [];
let currentTrackIndex = 0;
let isPlaying = false;
let shuffleMode = false;
let shuffledIndices = [];
let currentShuffleIndex = 0;
let listenStats = {};
let currentBannerIndex = 0;
let bannerInterval;

const audio = document.getElementById('audio');

const defaultSongs = [
    { id: 1, title: "gazan67", artist: "gazan", src: "music4.mp3", cover: "gazan67.jpg" },
    { id: 2, title: "Example Song 2", artist: "Artist 2", src: "song2.mp3", cover: "" },
    { id: 3, title: "Example Song 3", artist: "Artist 3", src: "song3.mp3", cover: "" },
    { id: 4, title: "Example Song 4", artist: "Artist 4", src: "song3.mp3", cover: "" },
    { id: 5, title: "Example Song 5", artist: "Artist 5", src: "song3.mp3", cover: "" }
];

function loadListenStats() {
    const saved = localStorage.getItem(`kroko_listens_${currentUser.id}`);
    listenStats = saved ? JSON.parse(saved) : {};
}

function saveListenStats() {
    localStorage.setItem(`kroko_listens_${currentUser.id}`, JSON.stringify(listenStats));
}

function incrementPlayCount(songId) {
    listenStats[songId] = (listenStats[songId] || 0) + 1;
    saveListenStats();
}

function renderStats() {
    const container = document.getElementById('statsGrid');
    if (!container) return;
    
    const sorted = Object.entries(listenStats).sort((a,b) => b[1] - a[1]);
    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-message">📊 Немає даних про прослуховування</div>';
        return;
    }
    
    container.innerHTML = sorted.map(([songId, count]) => {
        const song = songsList.find(s => s.id == songId);
        if (!song) return '';
        
        const coverHtml = song.cover && song.cover !== "" 
            ? `<img src="${song.cover}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" onerror="this.style.display='none'; this.parentElement.innerHTML='🎵'">` 
            : '<div style="font-size: 24px;">🎵</div>';
        
        return `
            <div class="stat-card" onclick="playTrack(${songsList.findIndex(s => s.id == songId)})" style="cursor:pointer;">
                <div class="stat-cover" style="width:50px;height:50px;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);">
                    ${coverHtml}
                </div>
                <div class="stat-info">
                    <div class="stat-title">${escapeHtml(song.title)}</div>
                    <div class="stat-artist">${escapeHtml(song.artist)}</div>
                </div>
                <div class="stat-count">${count} 🎧</div>
            </div>
        `;
    }).join('');
}

function toggleShuffle() {
    shuffleMode = !shuffleMode;
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.classList.toggle('active', shuffleMode);
        shuffleBtn.style.color = shuffleMode ? 'var(--primary-color)' : 'white';
    }
    if (shuffleMode && songsList.length > 0) {
        shuffledIndices = Array.from({length: songsList.length}, (_, i) => i);
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }
        currentShuffleIndex = shuffledIndices.findIndex(i => i === currentTrackIndex);
        if (currentShuffleIndex === -1) currentShuffleIndex = 0;
    }
}

function getNextTrackIndex() {
    if (shuffleMode) {
        currentShuffleIndex = (currentShuffleIndex + 1) % shuffledIndices.length;
        return shuffledIndices[currentShuffleIndex];
    } else {
        return (currentTrackIndex + 1) % songsList.length;
    }
}

function getPrevTrackIndex() {
    if (shuffleMode) {
        currentShuffleIndex = (currentShuffleIndex - 1 + shuffledIndices.length) % shuffledIndices.length;
        return shuffledIndices[currentShuffleIndex];
    } else {
        return (currentTrackIndex - 1 + songsList.length) % songsList.length;
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query === '') {
            renderSongs();
            return;
        }
        
        const filtered = songsList.filter(song => 
            song.title.toLowerCase().includes(query) || 
            song.artist.toLowerCase().includes(query)
        );
        
        const container = document.getElementById('songsGrid');
        if (!container) return;
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-message">🔍 Нічого не знайдено</div>';
            return;
        }
        
        container.innerHTML = filtered.map((song, index) => {
            const originalIndex = songsList.findIndex(s => s.id === song.id);
            const coverHtml = song.cover && song.cover !== "" 
                ? `<img src="${song.cover}" alt="cover" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%2394a3b8\'%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' font-size=\'20\'%3E🎵%3C/text%3E%3C/svg%3E'">` 
                : '<div style="font-size: 40px;">🎵</div>';
            
            return `
                <div class="song-card" onclick="playTrack(${originalIndex})">
                    <div class="song-cover">${coverHtml}</div>
                    <div class="song-title">${escapeHtml(song.title)}</div>
                    <div class="song-artist">${escapeHtml(song.artist)}</div>
                </div>
            `;
        }).join('');
    });
}

function setupDragAndDrop() {
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        document.body.style.opacity = '0.9';
    });
    
    document.body.addEventListener('dragleave', (e) => {
        e.preventDefault();
        document.body.style.opacity = '1';
    });
    
    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        document.body.style.opacity = '1';
        
        const files = e.dataTransfer.files;
        for (let file of files) {
            if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                const newSong = {
                    id: Date.now() + Math.random(),
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: "Невідомий виконавець",
                    src: url,
                    cover: ""
                };
                songsList.push(newSong);
                localStorage.setItem(`kroko_songs_${currentUser.id}`, JSON.stringify(songsList));
                renderSongs();
                alert(`✅ Додано: ${newSong.title}`);
            }
        }
    });
}

function setupBannerButtons() {
    const bannerBtns = document.querySelectorAll('.banner-btn-new');
    if (!bannerBtns.length) return;
    
    bannerBtns.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (index === 0) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                const homeLink = document.querySelector('.nav-link[data-page="home"]');
                if (homeLink) homeLink.classList.add('active');
                document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
                const homePage = document.getElementById('homePage');
                if (homePage) homePage.style.display = 'block';
            } 
            else if (index === 1) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                const playlistsLink = document.querySelector('.nav-link[data-page="playlists"]');
                if (playlistsLink) playlistsLink.classList.add('active');
                document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
                const playlistsPage = document.getElementById('playlistsPage');
                if (playlistsPage) playlistsPage.style.display = 'block';
                renderPlaylists();
                
                setTimeout(() => {
                    const createBtn = document.getElementById('createPlaylistBtn');
                    if (createBtn) createBtn.click();
                }, 300);
            }
            else if (index === 2) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                const favoritesLink = document.querySelector('.nav-link[data-page="favorites"]');
                if (favoritesLink) favoritesLink.classList.add('active');
                document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
                const favoritesPage = document.getElementById('favoritesPage');
                if (favoritesPage) favoritesPage.style.display = 'block';
                renderFavorites();
            }
        });
    });
}

function initBanner() {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelector('.banner-dots');
    const prevBtn = document.getElementById('bannerPrev');
    const nextBtn = document.getElementById('bannerNext');
    
    if (!slides.length) return;
    
    if (dots) {
        dots.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('banner-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToBannerSlide(i));
            dots.appendChild(dot);
        });
    }
    
    function goToBannerSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            if (dots && dots.children[i]) {
                dots.children[i].classList.toggle('active', i === index);
            }
        });
        currentBannerIndex = index;
    }
    
    function nextBannerSlide() {
        let nextIndex = (currentBannerIndex + 1) % slides.length;
        goToBannerSlide(nextIndex);
    }
    
    function prevBannerSlide() {
        let prevIndex = (currentBannerIndex - 1 + slides.length) % slides.length;
        goToBannerSlide(prevIndex);
    }
    
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            prevBannerSlide();
        };
    }
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            nextBannerSlide();
        };
    }
    
    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(nextBannerSlide, 7000);
    
    setupBannerButtons();
}

function initPlayer() {
    loadListenStats();
    const savedSongs = localStorage.getItem(`kroko_songs_${currentUser.id}`);
    if (savedSongs && savedSongs !== 'undefined') {
        try {
            songsList = JSON.parse(savedSongs);
        } catch(e) {
            songsList = defaultSongs;
        }
    } else {
        songsList = defaultSongs;
        localStorage.setItem(`kroko_songs_${currentUser.id}`, JSON.stringify(songsList));
    }
    
    renderSongs();
    renderStats();
    if (songsList.length > 0) {
        loadTrack(0);
    }
    setupPlayerEvents();
    setupHotkeys();
    setupSearch();
    setupDragAndDrop();
    initBanner();
}

function renderSongs() {
    const container = document.getElementById('songsGrid');
    if (!container) return;
    
    container.innerHTML = songsList.map((song, index) => {
        const coverHtml = song.cover && song.cover !== "" 
            ? `<img src="${song.cover}" alt="cover" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%2394a3b8\'%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' font-size=\'20\'%3E🎵%3C/text%3E%3C/svg%3E'">` 
            : '<div style="font-size: 40px;">🎵</div>';
        
        return `
            <div class="song-card" onclick="playTrack(${index})">
                <div class="song-cover">
                    ${coverHtml}
                </div>
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>
        `;
    }).join('');
}

function loadTrack(index) {
    if (index < 0 || index >= songsList.length) return;
    
    currentTrackIndex = index;
    const song = songsList[index];
    
    const currentTitle = document.getElementById('currentTitle');
    const currentArtist = document.getElementById('currentArtist');
    const playerTitle = document.getElementById('playerTitle');
    const playerArtist = document.getElementById('playerArtist');
    const heroArtwork = document.getElementById('heroArtwork');
    const playerArtwork = document.getElementById('playerArtwork');
    
    if (currentTitle) currentTitle.innerText = song.title;
    if (currentArtist) currentArtist.innerText = song.artist;
    if (playerTitle) playerTitle.innerText = song.title;
    if (playerArtist) playerArtist.innerText = song.artist;
    
    if (song.cover && song.cover !== "") {
        if (heroArtwork) heroArtwork.innerHTML = `<img src="${song.cover}" style="width:100%;height:100%;object-fit:cover;">`;
        if (playerArtwork) playerArtwork.innerHTML = `<img src="${song.cover}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        if (heroArtwork) heroArtwork.innerHTML = '🎵';
        if (playerArtwork) playerArtwork.innerHTML = '🎵';
    }
    
    audio.src = song.src;
    audio.load();
    
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    isPlaying = false;
}

function playTrack(index) {
    loadTrack(index);
    audio.play();
    isPlaying = true;
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) playPauseBtn.innerHTML = '⏸';
    
    const song = songsList[index];
    if (song) {
        incrementPlayCount(song.id);
        renderStats();
    }
}

function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    } else {
        audio.play();
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) playPauseBtn.innerHTML = '⏸';
    }
    isPlaying = !isPlaying;
}

function nextTrack() {
    const nextIndex = getNextTrackIndex();
    playTrack(nextIndex);
}

function prevTrack() {
    const prevIndex = getPrevTrackIndex();
    playTrack(prevIndex);
}

function setupPlayerEvents() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    const progressSlider = document.getElementById('progressSlider');
    const progressFill = document.getElementById('progressFill');
    const currentTimeSpan = document.getElementById('currentTime');
    const durationSpan = document.getElementById('duration');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeFill = document.getElementById('volumeFill');
    const speedSelect = document.getElementById('speedSelect');
    const shuffleBtn = document.getElementById('shuffleBtn');
    
    if (playPauseBtn) playPauseBtn.onclick = togglePlayPause;
    if (nextBtn) nextBtn.onclick = nextTrack;
    if (prevBtn) prevBtn.onclick = prevTrack;
    if (heroPlayBtn) heroPlayBtn.onclick = togglePlayPause;
    if (shuffleBtn) shuffleBtn.onclick = toggleShuffle;
    
    if (audio) {
        audio.ontimeupdate = () => {
            if (audio.duration) {
                const percent = (audio.currentTime / audio.duration) * 100;
                if (progressSlider) progressSlider.value = percent;
                if (progressFill) progressFill.style.width = percent + '%';
                if (currentTimeSpan) currentTimeSpan.innerText = formatTime(audio.currentTime);
                if (durationSpan) durationSpan.innerText = formatTime(audio.duration);
            }
        };
    }
    
    if (progressSlider) {
        progressSlider.oninput = (e) => {
            audio.currentTime = (e.target.value / 100) * audio.duration;
        };
    }
    
    if (volumeSlider) {
        volumeSlider.oninput = (e) => {
            audio.volume = e.target.value;
            if (volumeFill) volumeFill.style.width = (e.target.value * 100) + '%';
        };
    }
    
    if (speedSelect) {
        speedSelect.onchange = (e) => {
            audio.playbackRate = parseFloat(e.target.value);
        };
    }
    
    if (audio) {
        audio.onended = () => {
            nextTrack();
        };
    }
}

function setupHotkeys() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            prevTrack();
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            nextTrack();
        }
    });
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.playTrack = playTrack;