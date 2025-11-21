/*
  FOCO Magazine - v11 Ultimate Mobile Fix
  - Solución definitiva de audio en Swipe (Unlock Audio Context)
  - Carga automática
*/

const config = {
    startPage: 24, endPage: 67, path: 'pages/a-', ext: '.png'
};

const state = {
    images: [], currentView: 0, totalViews: 0, isMobile: false, isZoomed: false,
    audioUnlocked: false // Control de estado de audio
};

const els = {
    book: document.getElementById('book'),
    prev: document.getElementById('prevBtn'),
    next: document.getElementById('nextBtn'),
    restart: document.getElementById('restartBtn'),
    indicator: document.getElementById('pageIndicator'),
    audio: document.getElementById('pageSound'),
    restartAudio: document.getElementById('restartSound'),
    zoom: document.getElementById('zoomBtn'),
    full: document.getElementById('fullscreenBtn'),
    loader: document.getElementById('loader')
};

// --- INICIO ---

async function init() {
    const totalFiles = config.endPage - config.startPage + 1;
    for (let i = 0; i < totalFiles; i++) {
        state.images.push(`${config.path}${config.startPage + i}${config.ext}`);
    }

    // Carga TOTAL
    await preloadList(state.images);

    // Ocultamos loader
    els.loader.classList.add('hidden');

    // Inicialización Lógica
    checkMode();
    window.addEventListener('resize', () => {
        const wasMobile = state.isMobile;
        checkMode();
        if (wasMobile !== state.isMobile) calculateViews();
    });
    calculateViews();
    render();
    setupSwipe();
    setupControls();

    // --- TRUCO MAESTRO DE AUDIO ---
    // Agregamos un listener global que se ejecuta UNA sola vez al primer toque
    // Esto "despierta" el motor de audio de Safari/Chrome
    const unlockAudioContext = () => {
        if (state.audioUnlocked) return;
        
        // Reproducir y pausar inmediatamente ambos audios para desbloquearlos
        [els.audio, els.restartAudio].forEach(audio => {
            audio.muted = true; // Silencio para que no suene feo
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = false; // Quitamos silencio para cuando se necesite real
            }).catch(e => console.log("Audio unlock blocked", e));
        });

        state.audioUnlocked = true;
        // Limpiamos listeners
        document.removeEventListener('touchstart', unlockAudioContext);
        document.removeEventListener('click', unlockAudioContext);
    };

    // Escuchamos el primer toque en CUALQUIER parte de la pantalla
    document.addEventListener('touchstart', unlockAudioContext, { passive: true });
    document.addEventListener('click', unlockAudioContext);
}

function setupControls() {
    els.next.onclick = () => flip('next');
    els.prev.onclick = () => flip('prev');
    els.restart.onclick = restartApp;
    els.zoom.onclick = toggleZoom;
    els.full.onclick = toggleFullscreen;
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') flip('next');
        if (e.key === 'ArrowLeft') flip('prev');
    });
}

function preloadList(list) {
    return Promise.all(list.map(src => new Promise(resolve => {
        const img = new Image(); img.src = src; img.onload = resolve; img.onerror = resolve;
    })));
}

function checkMode() { state.isMobile = window.innerWidth < 768; }

function calculateViews() {
    state.totalViews = state.isMobile ? state.images.length : Math.ceil(state.images.length / 2) + 1;
    if (state.currentView >= state.totalViews) state.currentView = 0;
    render();
}

function render() {
    els.book.innerHTML = '';
    state.isMobile ? renderMobile() : renderDesktop();
    updateControls();
}

function renderMobile() {
    els.book.appendChild(createPage(state.images[state.currentView], 'single'));
    
    let label = "";
    if (state.currentView === 0) label = "Portada";
    else if (state.currentView === state.images.length - 1) label = "Contraportada";
    else label = `Página ${state.currentView}`;
    els.indicator.textContent = label;
}

function renderDesktop() {
    let left, right;
    if (state.currentView === 0) { left = -1; right = 0; }
    else if (state.currentView === state.totalViews - 1 && state.images.length % 2 === 0) {
        left = (state.currentView * 2) - 1; right = -1; 
    } else { left = (state.currentView * 2) - 1; right = left + 1; }

    const lPage = createPage(state.images[left], 'left-page');
    const rPage = createPage(state.images[right], 'right-page');
    if (left >= 0) addSpine(lPage, 'left');
    if (right >= 0 && right < state.images.length) addSpine(rPage, 'right');
    els.book.append(lPage, rPage);

    let label = '';
    if (state.currentView === 0) label = 'Portada';
    else if (state.currentView === state.totalViews - 1) label = 'Contraportada';
    else label = `Págs ${left}-${right}`;
    els.indicator.textContent = label;
}

function createPage(src, className) {
    const wrapper = document.createElement('div'); wrapper.className = `page-wrapper ${className}`;
    if (src) { const img = document.createElement('img'); img.src = src; wrapper.appendChild(img); }
    return wrapper;
}

function addSpine(el, side) {
    const spine = document.createElement('div'); spine.className = 'shadow-spine'; el.appendChild(spine);
}

// --- ACCIONES ---

function flip(dir) {
    if (dir === 'next') { if (state.currentView >= state.totalViews - 1) return; state.currentView++; }
    else { if (state.currentView <= 0) return; state.currentView--; }
    
    // Reproducir sonido seguro
    safePlay(els.audio);
    
    els.book.style.transform = 'scale(0.98)'; els.book.style.opacity = '0.8';
    setTimeout(() => {
        render();
        els.book.style.transform = state.isZoomed ? 'scale(1.6)' : 'scale(1)';
        els.book.style.opacity = '1';
    }, 150);
}

function restartApp() {
    safePlay(els.restartAudio);
    els.book.classList.add('rewinding');
    setTimeout(() => {
        state.currentView = 0;
        render();
        els.book.classList.remove('rewinding');
    }, 500);
}

// Helper para reproducir sin errores
function safePlay(audioEl) {
    if (audioEl.readyState >= 2 || state.audioUnlocked) {
        audioEl.currentTime = 0;
        audioEl.play().catch(e => {
            // Ignorar errores de autoplay bloqueado, es normal si el usuario no ha tocado
        });
    }
}

function updateControls() {
    const isLastPage = state.currentView >= state.totalViews - 1;
    els.prev.disabled = state.currentView === 0;
    els.next.style.display = isLastPage ? 'none' : 'flex';
    els.restart.style.display = isLastPage ? 'flex' : 'none';
    els.prev.style.opacity = els.prev.disabled ? '0' : '1';
}

function toggleZoom() {
    state.isZoomed = !state.isZoomed;
    els.book.style.transform = state.isZoomed ? 'scale(1.6)' : 'scale(1)';
    els.book.style.cursor = state.isZoomed ? 'grab' : 'default';
    els.zoom.innerHTML = state.isZoomed ? '<span class="material-icons-round">zoom_out</span>' : '<span class="material-icons-round">zoom_in</span>';
}

function toggleFullscreen() {
    if (document.documentElement.requestFullscreen) {
        !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen();
    } else { document.body.classList.toggle('fullscreen-active'); }
}

function setupSwipe() {
    let startX = 0;
    els.book.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        // NO llamamos nada aquí para no bloquear el thread
    }, {passive: true});
    
    els.book.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? flip('next') : flip('prev');
        }
    });
}

init();
