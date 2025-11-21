/*
  FOCO Magazine - v8 Final Loader Automático
  - Loader visual sin interacción requerida
  - Tiempo mínimo de carga para elegancia
  - Carga optimizada en background
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

    // --- ESTRATEGIA DE CARGA ---
    // 1. Promesa de tiempo mínimo (2.5 segundos) para que se vea el logo y el mensaje
    const minimumTime = new Promise(resolve => setTimeout(resolve, 2500));

    // 2. Promesa de carga real (Primeras 6 imágenes críticas)
    const criticalImages = state.images.slice(0, 6);
    const loadingTask = preloadList(criticalImages);

    // Esperamos a que AMBAS se cumplan (tiempo + carga)
    await Promise.all([minimumTime, loadingTask]);

    // --- DESBLOQUEO UI ---
    els.loader.classList.add('hidden'); // Fade out elegante
    
    // Cargar el resto en segundo plano
    preloadList(state.images.slice(6));

    // Iniciar lógica
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

    // Truco para intentar activar audio en primer toque
    const unlockAudio = () => {
        if(!state.audioUnlocked) {
            els.audio.play().then(()=> { els.audio.pause(); els.audio.currentTime=0; }).catch(()=>{});
            els.restartAudio.play().then(()=> { els.restartAudio.pause(); els.restartAudio.currentTime=0; }).catch(()=>{});
            state.audioUnlocked = true;
        }
    };
    document.addEventListener('click', unlockAudio, {once:true});
    document.addEventListener('touchstart', unlockAudio, {once:true, passive:true});
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

// --- RENDER ---

function render() {
    els.book.innerHTML = '';
    state.isMobile ? renderMobile() : renderDesktop();
    updateControls();
}

function renderMobile() {
    els.book.appendChild(createPage(state.images[state.currentView], 'single'));
    els.indicator.textContent = `${state.currentView + 1} / ${state.images.length}`;
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

    let label = state.currentView === 0 ? 'Portada' : (state.currentView === state.totalViews - 1 ? 'Contraportada' : `Págs ${left+24}-${right+24}`);
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
    
    // Intento de reproducir sonido
    if(state.audioUnlocked) {
        els.audio.currentTime = 0;
        els.audio.play().catch(()=>{});
    }
    
    els.book.style.transform = 'scale(0.98)'; els.book.style.opacity = '0.8';
    setTimeout(() => {
        render();
        els.book.style.transform = state.isZoomed ? 'scale(1.6)' : 'scale(1)';
        els.book.style.opacity = '1';
    }, 150);
}

function restartApp() {
    if(state.audioUnlocked) {
        els.restartAudio.currentTime = 0;
        els.restartAudio.play().catch(()=>{});
    }
    els.book.classList.add('rewinding');
    setTimeout(() => {
        state.currentView = 0;
        render();
        els.book.classList.remove('rewinding');
    }, 500);
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
    els.book.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
    els.book.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? flip('next') : flip('prev');
    });
}

init();
