/* ============================================
   PLAYER.JS – Music Player Engine
   ============================================ */
(function () {
    'use strict';

    // ---- Audio engine ----
    let audio = new Audio();
    audio.volume = 0.7;
    // NOTE: Do NOT set crossOrigin='anonymous' here.
    // External audio hosts (SoundHelix) don't send CORS headers,
    // so the browser would block playback entirely.

    let isPlaying = false;
    let currentSong = null;
    let shuffle = false;
    let repeat = false;
    window.playerQueue = [];

    // ---- Cover colors (synced with app.js) ----
    const COVER_COLORS = [
        ['#8b5cf6', '#ec4899'], ['#06b6d4', '#8b5cf6'], ['#f59e0b', '#ef4444'],
        ['#10b981', '#3b82f6'], ['#ec4899', '#f97316'], ['#6366f1', '#06b6d4'],
        ['#14b8a6', '#a855f7'], ['#f43f5e', '#8b5cf6'], ['#84cc16', '#22d3ee'],
        ['#e879f9', '#fb923c'], ['#38bdf8', '#818cf8'], ['#fbbf24', '#f472b6'],
        ['#34d399', '#60a5fa'], ['#c084fc', '#fb7185'], ['#2dd4bf', '#a78bfa'],
        ['#f87171', '#fbbf24']
    ];
    const COVER_ICONS = ['🎵', '🎸', '🎹', '🎷', '🎺', '🥁', '🎻', '🎤', '🎧', '🎶', '🎼', '🎙️', '🪗', '🪕', '🪘', '🎚️'];

    function getCoverBg(songId) {
        const idx = ((songId || 1) - 1) % COVER_COLORS.length;
        const [c1, c2] = COVER_COLORS[idx];
        return `linear-gradient(135deg,${c1},${c2})`;
    }
    function getCoverIcon(songId) {
        const idx = ((songId || 1) - 1) % COVER_ICONS.length;
        return COVER_ICONS[idx];
    }

    // ---- Format time ----
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ---- Get DOM elements (safe) ----
    function $(id) { return document.getElementById(id); }

    // ---- Play a song by ID ----
    // ---- Play a song by ID ----
    window.playSong = async function (songId) {
        try {
            let song = null;

            console.log('Playing song request:', songId, typeof songId);
            console.log('Current queue:', window.playerQueue?.length);
            console.log('App state songs:', window.appState?.songs?.length);

            // 1. Try to find in current queue or app state first (avoids backend 404 for external songs)
            if (window.playerQueue && window.playerQueue.length > 0) {
                song = window.playerQueue.find(s => s.id == songId); // Loose equality
                if (song) console.log('Found in queue:', song);
            }

            if (!song && window.appState?.songs) {
                song = window.appState.songs.find(s => s.id == songId); // Loose equality
                if (song) console.log('Found in appState:', song);
                else {
                    console.log('Not found in appState. Available IDs:', window.appState.songs.map(s => s.id));
                }
            }

            // 2. If not found client-side, fetch from backend (only works for local DB songs)
            if (!song) {
                const res = await fetch(`/api/songs/${songId}`);
                if (res.ok) {
                    song = await res.json();
                }
            }

            if (!song) {
                console.error('Song not found:', songId);
                return;
            }

            currentSong = song;

            // Build queue if not set
            if (!window.playerQueue || window.playerQueue.length === 0) {
                window.playerQueue = window.appState?.songs || [];
            }

            // Update audio source
            audio.src = song.audioUrl;
            audio.load();
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    isPlaying = true;
                    updatePlayerUI();
                    updatePlayIcons();
                }).catch(e => {
                    console.warn('Audio play prevented:', e);
                    // Auto-play was blocked; user must interact.
                    // Still update UI to show the song info.
                    isPlaying = false;
                    updatePlayerUI();
                    updatePlayIcons();
                });
            }

            // Increment play count
            fetch(`/api/songs/${songId}/play`, { method: 'PUT' });

            // Show bottom player
            const bottomPlayer = $('bottomPlayer');
            if (bottomPlayer) bottomPlayer.classList.add('active');

            // Update MediaSession API
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: song.title,
                    artist: song.artistName,
                    album: song.albumName || ''
                });
                navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
                navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
                navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
                navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
            }

        } catch (e) {
            console.error('Play song error:', e);
        }
    };

    // ---- Update player UI ----
    function updatePlayerUI() {
        if (!currentSong) return;

        // Bottom player
        const coverImg = $('playerCoverImg');
        const cover = document.querySelector('.player-cover');
        if (cover) {
            cover.style.background = getCoverBg(currentSong.id);
            if (coverImg) coverImg.style.display = 'none';
            cover.innerHTML = `<div style="width:100%;height:100%;background:${getCoverBg(currentSong.id)};display:flex;align-items:center;justify-content:center;font-size:24px;">${getCoverIcon(currentSong.id)}</div>`;
        }

        const title = $('playerTitle');
        const artist = $('playerArtist');
        if (title) title.textContent = currentSong.title;
        if (artist) artist.textContent = currentSong.artistName;

        // Expanded player
        const expArt = $('expandedArt');
        const expArtImg = $('expandedArtImg');
        if (expArt) {
            expArt.innerHTML = `<div style="width:100%;height:100%;background:${getCoverBg(currentSong.id)};display:flex;align-items:center;justify-content:center;font-size:80px;border-radius:var(--radius-xl);">${getCoverIcon(currentSong.id)}</div>`;
            if (isPlaying) expArt.classList.add('playing');
            else expArt.classList.remove('playing');
        }

        const expTitle = $('expandedTitle');
        const expArtist = $('expandedArtist');
        if (expTitle) expTitle.textContent = currentSong.title;
        if (expArtist) expArtist.textContent = currentSong.artistName;

        // Video
        const videoContainer = $('videoContainer');
        const videoPlayer = $('videoPlayer');
        if (videoContainer && videoPlayer) {
            if (currentSong.videoUrl) {
                videoContainer.classList.add('active');
                videoPlayer.src = currentSong.videoUrl;
            } else {
                videoContainer.classList.remove('active');
                videoPlayer.src = '';
            }
        }

        // Like button
        const likeBtn = $('playerLikeBtn');
        if (likeBtn) {
            if (currentSong.liked) likeBtn.classList.add('liked');
            else likeBtn.classList.remove('liked');
        }
    }

    // ---- Update play/pause icons ----
    function updatePlayIcons() {
        const playIconSvg = isPlaying
            ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
            : '<polygon points="5 3 19 12 5 21 5 3"/>';

        const playBtn = $('playIcon');
        if (playBtn) playBtn.innerHTML = playIconSvg;

        const expPlayIcon = $('expPlayIcon');
        if (expPlayIcon) expPlayIcon.innerHTML = playIconSvg;

        // Expanded art animation
        const expArt = $('expandedArt');
        if (expArt) {
            if (isPlaying) expArt.classList.add('playing');
            else expArt.classList.remove('playing');
        }
    }

    // ---- Toggle play/pause ----
    function togglePlayPause() {
        if (!currentSong) {
            // Play first song in queue
            if (window.appState?.songs?.length > 0) {
                window.playSong(window.appState.songs[0].id);
            }
            return;
        }

        if (isPlaying) {
            audio.pause();
            isPlaying = false;
        } else {
            audio.play().catch(console.log);
            isPlaying = true;
        }
        updatePlayIcons();
    }

    // ---- Next / Previous ----
    function getQueueIndex() {
        if (!currentSong || !window.playerQueue?.length) return -1;
        return window.playerQueue.findIndex(s => s.id === currentSong.id);
    }

    function playNext() {
        const queue = window.playerQueue;
        if (!queue || queue.length === 0) return;

        if (shuffle) {
            const randomIdx = Math.floor(Math.random() * queue.length);
            window.playSong(queue[randomIdx].id);
            return;
        }

        let idx = getQueueIndex();
        idx = (idx + 1) % queue.length;
        window.playSong(queue[idx].id);
    }

    function playPrev() {
        const queue = window.playerQueue;
        if (!queue || queue.length === 0) return;

        // If more than 3 seconds in, restart current
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }

        let idx = getQueueIndex();
        idx = (idx - 1 + queue.length) % queue.length;
        window.playSong(queue[idx].id);
    }

    // ---- Progress update ----
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;

        const fill = $('progressFill');
        if (fill) fill.style.width = pct + '%';

        const cur = $('currentTime');
        if (cur) cur.textContent = formatTime(audio.currentTime);

        const tot = $('totalTime');
        if (tot) tot.textContent = formatTime(audio.duration);

        // Expanded player
        const expFill = $('expProgressFill');
        if (expFill) expFill.style.width = pct + '%';

        const expCur = $('expCurrentTime');
        if (expCur) expCur.textContent = formatTime(audio.currentTime);

        const expTot = $('expTotalTime');
        if (expTot) expTot.textContent = formatTime(audio.duration);
    });

    // ---- Song ended ----
    audio.addEventListener('ended', () => {
        if (repeat) {
            audio.currentTime = 0;
            audio.play().catch(console.log);
        } else {
            playNext();
        }
    });

    // ---- Progress bar click/seek ----
    function setupProgressBar(barId, fillId) {
        const bar = $(barId);
        if (!bar) return;

        bar.addEventListener('click', (e) => {
            if (!audio.duration) return;
            const rect = bar.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audio.currentTime = pct * audio.duration;
        });
    }

    setupProgressBar('progressBar', 'progressFill');
    setupProgressBar('expProgressBar', 'expProgressFill');

    // ---- Volume ----
    const volumeSlider = $('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('click', (e) => {
            const rect = volumeSlider.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audio.volume = Math.max(0, Math.min(1, pct));
            const fill = $('volumeFill');
            if (fill) fill.style.width = (pct * 100) + '%';
        });
    }

    const volumeBtn = $('volumeBtn');
    if (volumeBtn) {
        let prevVolume = 0.7;
        volumeBtn.addEventListener('click', () => {
            if (audio.volume > 0) {
                prevVolume = audio.volume;
                audio.volume = 0;
                const fill = $('volumeFill');
                if (fill) fill.style.width = '0%';
            } else {
                audio.volume = prevVolume;
                const fill = $('volumeFill');
                if (fill) fill.style.width = (prevVolume * 100) + '%';
            }
        });
    }

    // ---- Button event listeners ----
    // Play/Pause
    const playPauseBtn = $('playPauseBtn');
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);

    const expPlayPauseBtn = $('expPlayPauseBtn');
    if (expPlayPauseBtn) expPlayPauseBtn.addEventListener('click', togglePlayPause);

    // Next
    const nextBtn = $('nextBtn');
    if (nextBtn) nextBtn.addEventListener('click', playNext);

    const expNextBtn = $('expNextBtn');
    if (expNextBtn) expNextBtn.addEventListener('click', playNext);

    // Prev
    const prevBtn = $('prevBtn');
    if (prevBtn) prevBtn.addEventListener('click', playPrev);

    const expPrevBtn = $('expPrevBtn');
    if (expPrevBtn) expPrevBtn.addEventListener('click', playPrev);

    // Shuffle
    function toggleShuffle() {
        shuffle = !shuffle;
        const btn = $('shuffleBtn');
        const expBtn = $('expShuffleBtn');
        if (btn) btn.classList.toggle('active', shuffle);
        if (expBtn) expBtn.classList.toggle('active', shuffle);
        if (window.showToast) window.showToast(shuffle ? 'Shuffle on' : 'Shuffle off', '🔀');
    }

    const shuffleBtn = $('shuffleBtn');
    if (shuffleBtn) shuffleBtn.addEventListener('click', toggleShuffle);

    const expShuffleBtn = $('expShuffleBtn');
    if (expShuffleBtn) expShuffleBtn.addEventListener('click', toggleShuffle);

    // Repeat
    function toggleRepeat() {
        repeat = !repeat;
        const btn = $('repeatBtn');
        const expBtn = $('expRepeatBtn');
        if (btn) btn.classList.toggle('active', repeat);
        if (expBtn) expBtn.classList.toggle('active', repeat);
        if (window.showToast) window.showToast(repeat ? 'Repeat on' : 'Repeat off', '🔁');
    }

    const repeatBtn = $('repeatBtn');
    if (repeatBtn) repeatBtn.addEventListener('click', toggleRepeat);

    const expRepeatBtn = $('expRepeatBtn');
    if (expRepeatBtn) expRepeatBtn.addEventListener('click', toggleRepeat);

    // Like
    const playerLikeBtn = $('playerLikeBtn');
    if (playerLikeBtn) {
        playerLikeBtn.addEventListener('click', () => {
            if (currentSong) {
                window.toggleLike(currentSong.id);
                currentSong.liked = !currentSong.liked;
                playerLikeBtn.classList.toggle('liked');
            }
        });
    }

    // ---- Expanded player ----
    const expandBtn = $('expandBtn');
    const expandedPlayer = $('expandedPlayer');
    const expandedClose = $('expandedClose');

    if (expandBtn && expandedPlayer) {
        expandBtn.addEventListener('click', () => {
            expandedPlayer.classList.add('active');
            document.body.style.overflow = 'hidden';
            startVisualizer();
        });
    }

    if (expandedClose) {
        expandedClose.addEventListener('click', () => {
            if (expandedPlayer) expandedPlayer.classList.remove('active');
            document.body.style.overflow = '';
            stopVisualizer();
        });
    }

    // ---- Audio Visualizer ----
    let audioContext, analyser, source, animId;
    let visualizerStarted = false;
    let visualizerAvailable = true;

    function startVisualizer() {
        const canvas = $('visualizerCanvas');
        if (!canvas || visualizerStarted || !visualizerAvailable) return;

        try {
            audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
            if (!source) {
                try {
                    source = audioContext.createMediaElementSource(audio);
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 128;
                    source.connect(analyser);
                    analyser.connect(audioContext.destination);
                } catch (srcErr) {
                    // MediaElementSource requires crossOrigin on the Audio element,
                    // but that breaks playback from servers without CORS headers.
                    // Fall back to a simulated visualizer instead.
                    console.log('Real visualizer not available (CORS), using simulated bars.');
                    visualizerAvailable = false;
                    startFakeVisualizer(canvas);
                    return;
                }
            }

            visualizerStarted = true;
            const ctx = canvas.getContext('2d');
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function draw() {
                animId = requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);

                const w = canvas.width = canvas.offsetWidth * 2;
                const h = canvas.height = canvas.offsetHeight * 2;
                ctx.clearRect(0, 0, w, h);

                const barWidth = (w / bufferLength) * 1.5;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * h;
                    const hue = (i / bufferLength) * 120 + 250;
                    ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
                    ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
                    x += barWidth;
                }
            }

            draw();
        } catch (e) {
            console.log('Visualizer not available:', e);
            startFakeVisualizer(canvas);
        }
    }

    // Simulated visualizer when CORS prevents real audio analysis
    function startFakeVisualizer(canvas) {
        if (!canvas) return;
        visualizerStarted = true;
        const ctx = canvas.getContext('2d');
        const bars = 64;
        const heights = new Float32Array(bars).fill(0);

        function draw() {
            animId = requestAnimationFrame(draw);
            const w = canvas.width = canvas.offsetWidth * 2;
            const h = canvas.height = canvas.offsetHeight * 2;
            ctx.clearRect(0, 0, w, h);

            const barWidth = (w / bars) * 1.5;
            let x = 0;
            const now = performance.now() / 1000;

            for (let i = 0; i < bars; i++) {
                // Generate lively simulated bars based on sine waves
                const target = isPlaying
                    ? (Math.sin(now * 3 + i * 0.4) * 0.3 + Math.sin(now * 7 + i * 0.7) * 0.2 + 0.5) * h * 0.7
                    : 0;
                heights[i] += (target - heights[i]) * 0.15;
                const hue = (i / bars) * 120 + 250;
                ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
                ctx.fillRect(x, h - heights[i], barWidth - 1, heights[i]);
                x += barWidth;
            }
        }
        draw();
    }

    function stopVisualizer() {
        if (animId) cancelAnimationFrame(animId);
        visualizerStarted = false;
    }

    // ---- Keyboard shortcuts ----
    document.addEventListener('keydown', (e) => {
        // Don't trigger if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                togglePlayPause();
                break;
            case 'ArrowRight':
                if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
                break;
            case 'ArrowLeft':
                audio.currentTime = Math.max(0, audio.currentTime - 10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                audio.volume = Math.min(1, audio.volume + 0.1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                audio.volume = Math.max(0, audio.volume - 0.1);
                break;
            case 'KeyN':
                playNext();
                break;
            case 'KeyP':
                playPrev();
                break;
            case 'KeyM':
                audio.muted = !audio.muted;
                break;
        }
    });

})();
