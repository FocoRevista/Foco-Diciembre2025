/*
  FOCO Magazine - v12 Final Desktop Zoom Fix
  - Agregado: Posibilidad de arrastrar (Pan) al hacer zoom en PC
  - Mantiene todas las correcciones de audio y móvil anteriores
*/

const config = {
    startPage: 24, endPage: 67, path: 'pages/a-', ext: '.png'
};

const state = {
    images: [], currentView: 0, totalViews: 0, isMobile: false, isZoomed: false,
    audioUnlocked: false,
    // Variables para arrastrar (Pan)
    panX: 0, panY: 0, isDragging: false, startX: 0, startY: 0
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

    await preloadList(state.images);

    els.loader.classList.add('hidden');

    // Lógica de Unlock Audio al primer toque (Swipe Fix)
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
    setupDrag(); // Iniciamos la lógica de arrastrar
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

// --- NUEVA LÓGICA DE ARRASTRAR (DRAG) ---
function setupDrag() {
    // Cuando presionas el clic
    els.book.addEventListener('mousedown', e => {
        if (!state.isZoomed) return; // Solo funciona si hay zoom
        state.isDragging = true;
        state.startX = e.clientX - state.panX;
        state.startY = e.clientY - state.panY;
        els.book.style.cursor = 'grabbing';
        e.preventDefault(); // Evita seleccionar imagen
    });

    // Cuando mueves el mouse
    window.addEventListener('mousemove', e => {
        if (!state.isDragging || !state.isZoomed) return;
        e.preventDefault();
        state.panX = e.clientX - state.startX;
        state.panY = e.clientY - state.startY;
        updateTransform();
    });

    // Cuando sueltas el clic
    window.addEventListener('mouseup', () => {
        if (state.isDragging) {
            state.isDragging = false;
            if (state.isZoomed) els.book.style.cursor = 'grab';
        }
    });
}

function updateTransform() {
    // Aplica movimiento + escala
    if (state.isZoomed) {
        els.book.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(1.6)`;
    } else {
        els.book.style.transform = `translate(0px, 0px) scale(1)`;
    }
}

// -----------------------------------------

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

function flip(dir) {
    // Si está con zoom, al cambiar de página quitamos el zoom y reseteamos posición
    if (state.isZoomed) toggleZoom();

    if (dir === 'next') { if (state.currentView >= state.totalViews - 1) return; state.currentView++; }
    else { if (state.currentView <= 0) return; state.currentView--; }
    
    safePlay(els.audio);
    
    // Animación simple
    els.book.style.transition = "transform 0.3s, opacity 0.3s";
    els.book.style.opacity = '0.8';
    els.book.style.transform = 'scale(0.98)'; 
    
    setTimeout(() => {
        render();
        els.book.style.opacity = '1';
        els.book.style.transform = 'scale(1)';
    }, 150);
}

function restartApp() {
    if (state.isZoomed) toggleZoom();
    safePlay(els.restartAudio);
    els.book.classList.add('rewinding');
    setTimeout(() => {
        state.currentView = 0;
        render();
        els.book.classList.remove('rewinding');
    }, 500);
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
    
    if (state.isZoomed) {
        // Entrar en Zoom
        state.panX = 0;
        state.panY = 0;
        els.book.style.transition = "transform 0.3s ease"; // Animación suave entrada
        updateTransform();
        els.book.style.cursor = 'grab';
        els.zoom.innerHTML = '<span class="material-icons-round">zoom_out</span>';
        
        // Quitamos transición después de entrar para que el drag sea rápido
        setTimeout(() => { els.book.style.transition = "none"; }, 300);
        
    } else {
        // Salir del Zoom
        state.panX = 0;
        state.panY = 0;
        els.book.style.transition = "transform 0.3s ease"; // Animación suave salida
        updateTransform();
        els.book.style.cursor = 'default';
        els.zoom.innerHTML = '<span class="material-icons-round">zoom_in</span>';
    }
}

function toggleFullscreen() {
    if (document.documentElement.requestFullscreen) {
        !document.fullscreenElement ? document.documentElement
