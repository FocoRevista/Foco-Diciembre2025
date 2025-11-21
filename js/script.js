/*
  FOCO Magazine - v3 Final
  - Precarga agresiva (carga todo antes de mostrar)
  - Eliminación de bugs visuales
*/

const config = {
    startPage: 24, 
    endPage: 67,
    path: 'pages/a-',
    ext: '.png'
};

const state = {
    images: [],
    currentView: 0,
    totalViews: 0,
    isMobile: false,
    isZoomed: false,
    loadedImages: 0 // Contador interno
};

const els = {
    book: document.getElementById('book'),
    prev: document.getElementById('prevBtn'),
    next: document.getElementById('nextBtn'),
    indicator: document.getElementById('pageIndicator'),
    audio: document.getElementById('pageSound'),
    zoom: document.getElementById('zoomBtn'),
    full: document.getElementById('fullscreenBtn'),
    loader: document.getElementById('loader') // Referencia al loader
};

// --- INICIO ---

async function init() {
    // 1. Generar lista de rutas
    const totalFiles = config.endPage - config.startPage + 1;
    for (let i = 0; i < totalFiles; i++) {
        state.images.push(`${config.path}${config.startPage + i}${config.ext}`);
    }

    // 2. PRECARGA MASIVA
    // Esto pausa la app hasta que todas las imagenes se descarguen
    await preloadAllImages();

    // 3. Iniciar App
    els.loader.classList.add('hidden'); // Ocultar loader
    
    checkMode();
    window.addEventListener('resize', () => {
        const wasMobile = state.isMobile;
        checkMode();
        if (wasMobile !== state.isMobile) calculateViews();
    });

    calculateViews();
    render();

    // Eventos
    els.next.onclick = () => flip('next');
    els.prev.onclick = () => flip('prev');
    els.zoom.onclick = toggleZoom;
    els.full.onclick = toggleFullscreen;
    
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') flip('next');
        if (e.key === 'ArrowLeft') flip('prev');
    });

    setupSwipe();
}

// Función para forzar la descarga de todo
function preloadAllImages() {
    return Promise.all(
        state.images.map(src => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = resolve;
                img.onerror = resolve; // Si falla una, seguimos igual
            });
        })
    );
}

function checkMode() {
    state.isMobile = window.innerWidth < 768;
}

function calculateViews() {
    if (state.isMobile) {
        state.totalViews = state.images.length;
    } else {
        state.totalViews = Math.ceil(state.images.length / 2) + 1;
    }
    if (state.currentView >= state.totalViews) state.currentView = 0;
    render();
}

// --- RENDERIZADO ---

function render() {
    els.book.innerHTML = '';
    if (state.isMobile) renderMobile();
    else renderDesktop();
    updateControls();
}

function renderMobile() {
    const imgIndex = state.currentView;
    const page = createPage(state.images[imgIndex], 'single');
    els.book.appendChild(page);
    els.indicator.textContent = `${imgIndex + 1} / ${state.images.length}`;
}

function renderDesktop() {
    let leftImgIdx, rightImgIdx;

    if (state.currentView === 0) {
        leftImgIdx = -1; 
        rightImgIdx = 0;
    } else if (state.currentView === state.totalViews - 1 && state.images.length % 2 === 0) {
        leftImgIdx = (state.currentView * 2) - 1;
        rightImgIdx = -1; 
    } else {
        leftImgIdx = (state.currentView * 2) - 1;
        rightImgIdx = leftImgIdx + 1;
    }

    const leftPage = createPage(state.images[leftImgIdx], 'left-page');
    const rightPage = createPage(state.images[rightImgIdx], 'right-page');
    
    if (leftImgIdx >= 0) addSpine(leftPage, 'left');
    if (rightImgIdx >= 0 && rightImgIdx < state.images.length) addSpine(rightPage, 'right');

    els.book.appendChild(leftPage);
    els.book.appendChild(rightPage);

    // Textos indicador
    let label = '';
    if (state.currentView === 0) label = 'Portada';
    else if (state.currentView === state.totalViews - 1) label = 'Contraportada';
    else label = `Págs ${leftImgIdx+24}-${rightImgIdx+24}`;
    els.indicator.textContent = label;
}

function createPage(src, className) {
    const wrapper = document.createElement('div');
    wrapper.className = `page-wrapper ${className}`;
    
    if (src && src.indexOf('undefined') === -1) {
        const img = document.createElement('img');
        img.src = src;
        // Ya no usamos loading=lazy porque precargamos todo al inicio
        wrapper.appendChild(img);
    }
    return wrapper;
}

function addSpine(el, side) {
    const spine = document.createElement('div');
    spine.className = 'shadow-spine';
    el.appendChild(spine);
}

// --- ACCIONES ---

function flip(dir) {
    if (dir === 'next') {
        if (state.currentView >= state.totalViews - 1) return;
        state.currentView++;
    } else {
        if (state.currentView <= 0) return;
        state.currentView--;
    }
    
    playSound();
    
    els.book.style.transform = 'scale(0.98)';
    els.book.style.opacity = '0.9';
    
    setTimeout(() => {
        render();
        els.book.style.transform = state.isZoomed ? 'scale(1.6)' : 'scale(1)';
        els.book.style.opacity = '1';
    }, 100); // Super rápido
}

function updateControls() {
    els.prev.disabled = state.currentView === 0;
    els.next.disabled = state.currentView >= state.totalViews - 1;
    els.prev.style.opacity = els.prev.disabled ? '0' : '1';
    els.next.style.opacity = els.next.disabled ? '0' : '1';
}

function playSound() {
    els.audio.currentTime = 0;
    els.audio.play().catch(() => {});
}

function toggleZoom() {
    state.isZoomed = !state.isZoomed;
    els.book.style.transform = state.isZoomed ? 'scale(1.6)' : 'scale(1)';
    els.book.style.cursor = state.isZoomed ? 'grab' : 'default';
    els.zoom.innerHTML = state.isZoomed 
        ? '<span class="material-icons-round">zoom_out</span>' 
        : '<span class="material-icons-round">zoom_in</span>';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

function setupSwipe() {
    let startX = 0;
    els.book.addEventListener('touchstart', e => startX = e.touches[0].clientX);
    els.book.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) flip('next');
            else flip('prev');
        }
    });
}

init();
