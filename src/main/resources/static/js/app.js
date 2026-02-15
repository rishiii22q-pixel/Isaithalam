/* ============================================
   APP.JS – Main Application Logic
   ============================================ */
(function () {
    'use strict';

    // ---- Color palette for covers ----
    const COVER_COLORS = [
        ['#8b5cf6', '#ec4899'], ['#06b6d4', '#8b5cf6'], ['#f59e0b', '#ef4444'],
        ['#10b981', '#3b82f6'], ['#ec4899', '#f97316'], ['#6366f1', '#06b6d4'],
        ['#14b8a6', '#a855f7'], ['#f43f5e', '#8b5cf6'], ['#84cc16', '#22d3ee'],
        ['#e879f9', '#fb923c'], ['#38bdf8', '#818cf8'], ['#fbbf24', '#f472b6'],
        ['#34d399', '#60a5fa'], ['#c084fc', '#fb7185'], ['#2dd4bf', '#a78bfa'],
        ['#f87171', '#fbbf24']
    ];

    const COVER_ICONS = ['🎵', '🎸', '🎹', '🎷', '🎺', '🥁', '🎻', '🎤', '🎧', '🎶', '🎼', '🎙️', '🪗', '🪕', '🪘', '🎚️'];

    function getCoverHTML(songId) {
        const idx = ((songId || 1) - 1) % COVER_COLORS.length;
        const [c1, c2] = COVER_COLORS[idx];
        const icon = COVER_ICONS[idx];
        return `<div style="width:100%;height:100%;background:linear-gradient(135deg,${c1},${c2});display:flex;align-items:center;justify-content:center;font-size:48px;">${icon}</div>`;
    }

    function getCoverSmallHTML(songId) {
        const idx = ((songId || 1) - 1) % COVER_COLORS.length;
        const [c1, c2] = COVER_COLORS[idx];
        const icon = COVER_ICONS[idx];
        return `<div style="width:100%;height:100%;background:linear-gradient(135deg,${c1},${c2});display:flex;align-items:center;justify-content:center;font-size:20px;">${icon}</div>`;
    }

    function formatDuration(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function formatPlays(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
    }

    // ---- Toast notifications ----
    window.showToast = function (message, icon = '✓') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>${icon}</span> ${message}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('leaving');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // ---- Global state ----
    window.appState = {
        songs: [],
        playlists: [],
        currentPage: 'home'
    };

    // ---- API calls ----
    async function fetchJSON(url) {
        try {
            const res = await fetch(url);
            return await res.json();
        } catch (e) {
            console.error('Fetch error:', e);
            return null;
        }
    }

    // ---- Song card HTML ----
    function songCardHTML(song) {
        return `
        <div class="song-card" data-song-id="${song.id}" onclick="window.playSong(${song.id})">
            <div class="song-card-cover">
                ${getCoverHTML(song.id)}
                <div class="song-card-play">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                ${song.videoUrl ? '<span class="song-card-badge">Video</span>' : ''}
            </div>
            <div class="song-card-title">${song.title}</div>
            <div class="song-card-artist">${song.artistName}</div>
        </div>`;
    }

    // ---- Song list item HTML ----
    function songListItemHTML(song, idx) {
        return `
        <div class="song-list-item" data-song-id="${song.id}" onclick="window.playSong(${song.id})">
            <span class="song-list-num">${idx + 1}</span>
            <span class="song-list-play-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </span>
            <div class="song-list-cover">${getCoverSmallHTML(song.id)}</div>
            <div class="song-list-info">
                <div class="song-list-title">${song.title}</div>
                <div class="song-list-artist">${song.artistName}</div>
            </div>
            <div class="song-list-album">${song.albumName || ''}</div>
            <div class="song-list-duration">${formatDuration(song.duration)}</div>
            <div class="song-list-actions">
                <button class="song-list-action-btn ${song.liked ? 'liked' : ''}" onclick="event.stopPropagation(); window.toggleLike(${song.id})" title="Like">
                    <svg viewBox="0 0 24 24" fill="${song.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                </button>
            </div>
        </div>`;
    }

    // ---- Playlist card HTML ----
    function playlistCardHTML(playlist) {
        const songCount = playlist.songs ? playlist.songs.length : 0;
        const firstSongId = playlist.songs && playlist.songs.length > 0 ? playlist.songs[0].id : 1;
        return `
        <div class="song-card" onclick="window.location.href='/playlist/${playlist.id}'">
            <div class="song-card-cover">
                ${getCoverHTML(firstSongId)}
                <div class="song-card-play">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
            </div>
            <div class="song-card-title">${playlist.name}</div>
            <div class="song-card-artist">${songCount} songs</div>
        </div>`;
    }

    // ---- Load Home Page ----
    async function loadHomePage() {
        const songs = await fetchJSON('/api/songs');
        const trending = await fetchJSON('/api/songs/trending');
        const featured = await fetchJSON('/api/songs/featured');
        const playlists = await fetchJSON('/api/playlists');

        if (songs) window.appState.songs = songs;
        if (playlists) window.appState.playlists = playlists;

        // Hero banner with featured song
        if (featured && featured.length > 0) {
            const hero = featured[0];
            const heroTitle = document.getElementById('heroTitle');
            const heroDesc = document.getElementById('heroDesc');
            const heroPlayBtn = document.getElementById('heroPlayBtn');

            if (heroTitle) heroTitle.textContent = hero.title;
            if (heroDesc) heroDesc.textContent = `${hero.artistName} · ${hero.albumName} · ${formatPlays(hero.plays)} plays`;
            if (heroPlayBtn) {
                heroPlayBtn.onclick = () => window.playSong(hero.id);
            }
        }

        // Trending
        const trendingGrid = document.getElementById('trendingGrid');
        if (trendingGrid && trending) {
            trendingGrid.innerHTML = trending.map(s => songCardHTML(s)).join('');
        }

        // Featured
        const featuredGrid = document.getElementById('featuredGrid');
        if (featuredGrid && featured) {
            featuredGrid.innerHTML = featured.map(s => songCardHTML(s)).join('');
        }

        // All songs
        const allGrid = document.getElementById('allSongsGrid');
        if (allGrid && songs) {
            allGrid.innerHTML = songs.map(s => songCardHTML(s)).join('');
        }

        // Playlists
        const playlistsGrid = document.getElementById('playlistsGrid');
        if (playlistsGrid && playlists) {
            playlistsGrid.innerHTML = playlists.map(p => playlistCardHTML(p)).join('');
        }

        // Sidebar playlists
        loadSidebarPlaylists(playlists);
    }

    // ---- Load Search Page ----
    async function loadSearchPage() {
        const genres = await fetchJSON('/api/songs/genres');
        const songs = await fetchJSON('/api/songs');

        if (songs) window.appState.songs = songs;

        // Genre chips
        const genreChips = document.getElementById('genreChips');
        if (genreChips && genres) {
            const chipHTML = '<button class="genre-chip active" data-genre="all">All</button>' +
                genres.map(g => `<button class="genre-chip" data-genre="${g}">${g}</button>`).join('');
            genreChips.innerHTML = chipHTML;

            genreChips.addEventListener('click', async (e) => {
                const chip = e.target.closest('.genre-chip');
                if (!chip) return;
                genreChips.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const genre = chip.dataset.genre;
                if (genre === 'all') {
                    showBrowse(songs);
                } else {
                    const genreSongs = await fetchJSON(`/api/songs/genre/${genre}`);
                    showBrowse(genreSongs || []);
                }
            });
        }

        // Show browse grid initially
        showBrowse(songs);

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let debounce;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounce);
                debounce = setTimeout(async () => {
                    const q = searchInput.value.trim();
                    if (q.length > 0) {
                        const results = await fetchJSON(`/api/songs/search?q=${encodeURIComponent(q)}`);
                        showSearchResults(results || [], q);
                    } else {
                        document.getElementById('searchResultsSection').style.display = 'none';
                        document.getElementById('browseSection').style.display = 'block';
                    }
                }, 300);
            });
        }

        // Sidebar
        const playlists = await fetchJSON('/api/playlists');
        loadSidebarPlaylists(playlists);
    }

    function showBrowse(songs) {
        const browseGrid = document.getElementById('browseGrid');
        if (browseGrid) {
            browseGrid.innerHTML = songs.map(s => songCardHTML(s)).join('');
        }
    }

    function showSearchResults(songs, query) {
        const section = document.getElementById('searchResultsSection');
        const title = document.getElementById('searchResultsTitle');
        const results = document.getElementById('searchResults');
        const browse = document.getElementById('browseSection');

        if (section && results) {
            section.style.display = 'block';
            if (browse) browse.style.display = 'none';
            title.textContent = `Results for "${query}"`;
            if (songs.length === 0) {
                results.innerHTML = '<p style="color:var(--text-muted);padding:24px;text-align:center;">No results found. Try a different search.</p>';
            } else {
                // Update global state so player can find these songs
                window.appState.songs = songs;
                results.innerHTML = songs.map((s, i) => songListItemHTML(s, i)).join('');
            }
        }
    }

    // ---- Load Playlist Page ----
    async function loadPlaylistPage() {
        const pathParts = window.location.pathname.split('/');
        const playlistId = pathParts[pathParts.length - 1];

        const playlist = await fetchJSON(`/api/playlists/${playlistId}`);
        if (!playlist) return;

        const nameEl = document.getElementById('playlistName');
        const descEl = document.getElementById('playlistDesc');
        const metaEl = document.getElementById('playlistMeta');
        const songsEl = document.getElementById('playlistSongs');
        const playAllBtn = document.getElementById('playAllBtn');

        if (nameEl) nameEl.textContent = playlist.name;
        if (descEl) descEl.textContent = playlist.description || '';
        if (metaEl) metaEl.textContent = `${playlist.songs ? playlist.songs.length : 0} songs`;

        if (songsEl && playlist.songs) {
            songsEl.innerHTML = playlist.songs.map((s, i) => songListItemHTML(s, i)).join('');
            window.appState.songs = playlist.songs;
        }

        if (playAllBtn && playlist.songs && playlist.songs.length > 0) {
            playAllBtn.onclick = () => {
                window.playerQueue = playlist.songs;
                window.playSong(playlist.songs[0].id);
            };
        }

        // Sidebar
        const playlists = await fetchJSON('/api/playlists');
        loadSidebarPlaylists(playlists);
    }

    // ---- Sidebar playlists ----
    function loadSidebarPlaylists(playlists) {
        const container = document.getElementById('sidebarPlaylists');
        if (!container || !playlists) return;
        container.innerHTML = playlists.map(p => `
            <div class="playlist-item" onclick="window.location.href='/playlist/${p.id}'">
                <div class="playlist-item-img">📀</div>
                <div>
                    <div style="font-size:13px;font-weight:500;">${p.name}</div>
                    <div style="font-size:11px;color:var(--text-muted);">${p.songs ? p.songs.length : 0} songs</div>
                </div>
            </div>
        `).join('');
    }

    // ---- Like toggle ----
    window.toggleLike = async function (songId) {
        try {
            const res = await fetch(`/api/songs/${songId}/like`, { method: 'PUT' });
            const data = await res.json();
            showToast(data.liked ? 'Added to Liked Songs' : 'Removed from Liked Songs', data.liked ? '❤️' : '💔');
        } catch (e) {
            console.error('Like error:', e);
        }
    };

    // ---- User menu ----
    const userAvatar = document.getElementById('userAvatar');
    const userMenu = document.getElementById('userMenu');
    if (userAvatar && userMenu) {
        // Set user initial
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const user = JSON.parse(stored);
                userAvatar.textContent = (user.name || 'U')[0].toUpperCase();
            }
        } catch (e) { }

        userAvatar.addEventListener('click', () => {
            userMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header-user')) {
                userMenu.classList.remove('active');
            }
        });
    }

    // Logout
    const logoutItem = document.getElementById('logoutItem');
    if (logoutItem) {
        logoutItem.addEventListener('click', async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('user');
            window.location.href = '/login';
        });
    }

    // ---- Mobile sidebar ----
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
        });

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
            });
        }
    }

    // ---- Header search redirect ----
    const headerSearchInput = document.getElementById('headerSearchInput');
    if (headerSearchInput) {
        headerSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const q = headerSearchInput.value.trim();
                if (q) {
                    window.location.href = `/search?q=${encodeURIComponent(q)}`;
                }
            }
        });
    }

    // ---- Create playlist modal ----
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    const playlistModal = document.getElementById('playlistModal');
    const cancelPlaylist = document.getElementById('cancelPlaylist');
    const confirmCreatePlaylist = document.getElementById('confirmCreatePlaylist');

    if (createPlaylistBtn && playlistModal) {
        createPlaylistBtn.addEventListener('click', () => {
            playlistModal.classList.add('active');
        });

        if (cancelPlaylist) {
            cancelPlaylist.addEventListener('click', () => {
                playlistModal.classList.remove('active');
            });
        }

        if (confirmCreatePlaylist) {
            confirmCreatePlaylist.addEventListener('click', async () => {
                const name = document.getElementById('playlistNameInput').value.trim() || 'My Playlist';
                const description = document.getElementById('playlistDescInput').value.trim();

                try {
                    const res = await fetch('/api/playlists', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, description, userId: '1' })
                    });
                    if (res.ok) {
                        showToast('Playlist created!', '✨');
                        playlistModal.classList.remove('active');
                        // Reload playlists
                        const playlists = await fetchJSON('/api/playlists');
                        loadSidebarPlaylists(playlists);
                        const playlistsGrid = document.getElementById('playlistsGrid');
                        if (playlistsGrid && playlists) {
                            playlistsGrid.innerHTML = playlists.map(p => playlistCardHTML(p)).join('');
                        }
                    }
                } catch (e) {
                    console.error('Create playlist error:', e);
                }
            });
        }

        playlistModal.addEventListener('click', (e) => {
            if (e.target === playlistModal) playlistModal.classList.remove('active');
        });
    }

    // ---- Liked Songs nav ----
    const navLiked = document.getElementById('navLiked');
    if (navLiked) {
        navLiked.addEventListener('click', async () => {
            const liked = await fetchJSON('/api/songs/liked');
            if (liked && liked.length > 0) {
                window.playerQueue = liked;
                window.playSong(liked[0].id);
                showToast(`Playing ${liked.length} liked songs`, '❤️');
            } else {
                showToast('No liked songs yet', '💔');
            }
        });
    }

    // ---- Initialize based on current page ----
    const path = window.location.pathname;
    if (path === '/home' || path === '/home/') {
        loadHomePage();
    } else if (path === '/search' || path.startsWith('/search')) {
        loadSearchPage();
        // Pre-fill search from query param
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = q;
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    } else if (path.startsWith('/playlist/')) {
        loadPlaylistPage();
    }
})();
