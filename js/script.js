/*
  FOCO Magazine - v15 3D Animation
  - Efecto Flip 3D Realista (Giro en eje Y)
  - Sincronización exacta cambio de imagen
*/

const config = {
    startPage: 24, endPage: 67, path: 'pages/a-', ext: '.png'
};

const state = {
    images: [], currentView: 0, totalViews: 0, isMobile: false, isZoomed: false,
    audioUnlocked: false
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

    const loadPromise = preloadList(state.images);
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(), 4000));
    await Promise.race([loadPromise, timeoutPromise]);

    els.loader.classList.add('hidden');

    const unlockAudioContext = () => {
        if (state.audioUnlocked) return;
        [els.audio, els.restartAudio].forEach(audio => {
            audio.muted = true; 
            audio.play().then(() => {
                audio.pause(); audio.currentTime = 0; audio.muted = false;
            }).catch(e => {});
        });
        state.audioUnlocked = true;
        document.removeEventListener('touchstart', unlockAudioContext);
        document.removeEventListener('click', unlockAudioContext);
    };
    document.addEventListener('touchstart', unlockAudioContext, { passive: true });
    document.addEventListener('click', unlockAudioContext);

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
    let label = state.currentView === 0 ? "Portada" : (state.currentView === state.images.length - 1 ? "Contraportada" : `Página ${state.currentView}`);
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

    let label = state.currentView === 0 ? 'Portada' : (state.currentView === state.totalViews - 1 ? 'Contraportada' : `Págs ${left}-${right}`);
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

// === NUEVA ANIMACIÓN 3D ===
function flip(dir) {
    // Si hay una animación corriendo, evitar doble clic
    if (els.book.classList.contains('flipping-next') || els.book.classList.contains('flipping-prev')) return;
    if (state.isZoomed) toggleZoom();

    let targetView = state.currentView;
    if (dir === 'next') {
        if (state.currentView >= state.totalViews - 1) return;
        targetView++;
    } else {
        if (state.currentView <= 0) return;
        targetView--;
    }

    safePlay(els.audio);

    // 1. Agregamos la clase de animación correspondiente
    const animClass = dir === 'next' ? 'flipping-next' : 'flipping-prev';
    els.book.classList.add(animClass);

    // 2. Esperamos EXACTAMENTE a la mitad de la animación (300ms de 600ms)
    // En este punto el libro está "de lado" (invisible) y podemos cambiar la hoja sin que se note el corte
    setTimeout(() => {
        state.currentView = targetView;
        render();
    }, 300);

    // 3. Al terminar la animación completa, limpiamos las clases
    setTimeout(() => {
        els.book.classList.remove(animClass);
    }, 600);
}

function restartApp() {
    if (state.isZoomed) toggleZoom();
    safePlay(els.restartAudio);
    els.book.classList.add('rewinding');
    setTimeout(() => {
        state.currentView = 0;
        render();
        els.book.classList.remove('rewinding');
    }, 800); // 800ms coincide con la duración CSS
}

function safePlay(audioEl) {
    if (audioEl.readyState >= 2 || state.audioUnlocked) {
        audioEl.currentTime = 0;
        audioEl.play().catch(e => {});
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
    els.book.style.transition = "transform 0.3s ease";
    els.book.style.transform = state.isZoomed ? 'scale(1.6)' : 'scale(1)';
    els.book.style.cursor = state.isZoomed ? 'zoom-out' : 'zoom-in';
    els.zoom.innerHTML = state.isZoomed ? '<span class="material-icons-round">zoom_out</span>' : '<span class="material-icons-round">zoom_in</span>';
}

function toggleFullscreen() {
    if (document.documentElement.requestFullscreen) {
        !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen();
    } else { document.body.classList.toggle('fullscreen-active'); }
}

function setupSwipe() {
    let startX = 0;
    els.book.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive: true});
    els.book.addEventListener('touchend', e => {
        if (state.isZoomed) return;
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? flip('next') : flip('prev');
    });
}

init();
