/*
  FOCO Magazine - Motor 3D Optimizado v2
  - Corrección Portada (hoja sola al inicio)
  - Corrección Contraportada (hoja sola al final)
  - Animación CSS 3D
  - Móvil sin deformaciones
*/

const config = {
    startPage: 24, // Nombre del archivo a-24.png
    endPage: 67,   // Nombre del archivo a-67.png
    path: 'pages/a-',
    ext: '.png'
};

// Estado global
const state = {
    images: [],       // Array con rutas de todas las imágenes
    currentView: 0,   // "Spread" actual (0 = Portada)
    totalViews: 0,
    isMobile: false,
    isZoomed: false
};

// Elementos
const els = {
    book: document.getElementById('book'),
    prev: document.getElementById('prevBtn'),
    next: document.getElementById('nextBtn'),
    indicator: document.getElementById('pageIndicator'),
    audio: document.getElementById('pageSound'),
    zoom: document.getElementById('zoomBtn'),
    full: document.getElementById('fullscreenBtn')
};

// --- INICIALIZACIÓN ---

function init() {
    // 1. Generar array de imágenes
    const totalFiles = config.endPage - config.startPage + 1;
    for (let i = 0; i < totalFiles; i++) {
        state.images.push(`${config.path}${config.startPage + i}${config.ext}`);
    }

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

function checkMode() {
    state.isMobile = window.innerWidth < 768;
}

// Calcula cuántas "Vistas" (Spreads) tiene la revista
function calculateViews() {
    if (state.isMobile) {
        // En móvil: 1 vista = 1 página
        state.totalViews = state.images.length;
    } else {
        // En escritorio:
        // Vista 0: [null, Portada]
        // Vista 1: [P1, P2]
        // ...
        // Vista Final: [Contraportada, null]
        
        // Fórmula: Portada (1) + Cuerpo + Contraportada (1)
        // Resto de páginas: images.length - 2
        // Spreads centrales: Math.ceil((len - 2) / 2)
        // Total = 1 (portada) + spreads + 1 (contra)
        
        // Simplificación lógica visual:
        // Portada es índice 0 en array images.
        // Queremos ver images[0] a la derecha.
        state.totalViews = Math.ceil(state.images.length / 2) + 1;
    }
    
    // Resetear si se sale de rango al cambiar tamaño
    if (state.currentView >= state.totalViews) state.currentView = 0;
    render();
}

// --- RENDERIZADO ---

function render() {
    els.book.innerHTML = ''; // Limpiar DOM
    
    if (state.isMobile) {
        renderMobile();
    } else {
        renderDesktop();
    }
    
    updateControls();
}

function renderMobile() {
    // Render simple: Una sola imagen centrada
    const imgIndex = state.currentView;
    const page = createPage(state.images[imgIndex], 'single');
    els.book.appendChild(page);
    els.indicator.textContent = `${imgIndex + 1} / ${state.images.length}`;
}

function renderDesktop() {
    // Lógica de "Spreads"
    // View 0 -> Izq: Nada, Der: Portada (img 0)
    // View 1 -> Izq: img 1, Der: img 2
    // View N -> ...
    
    let leftImgIdx, rightImgIdx;

    if (state.currentView === 0) {
        // PORTADA
        leftImgIdx = -1; // Vacío
        rightImgIdx = 0;
    } else if (state.currentView === state.totalViews - 1 && state.images.length % 2 === 0) {
        // CONTRAPORTADA (si es par)
        // La lógica matemática ajusta:
        leftImgIdx = (state.currentView * 2) - 1;
        rightImgIdx = -1; 
    } else {
        // PÁGINAS INTERNAS
        leftImgIdx = (state.currentView * 2) - 1;
        rightImgIdx = leftImgIdx + 1;
    }

    // Crear estructura
    const leftPage = createPage(state.images[leftImgIdx], 'left-page');
    const rightPage = createPage(state.images[rightImgIdx], 'right-page');
    
    // Añadir sombras de lomo si hay página
    if (leftImgIdx >= 0) addSpine(leftPage, 'left');
    if (rightImgIdx >= 0 && rightImgIdx < state.images.length) addSpine(rightPage, 'right');

    els.book.appendChild(leftPage);
    els.book.appendChild(rightPage);

    // Indicador
    let label = '';
    if (state.currentView === 0) label = 'Portada';
    else if (state.currentView === state.totalViews - 1) label = 'Contraportada';
    else label = `Págs ${leftImgIdx+24}-${rightImgIdx+24}`; // Ajustado al nombre del archivo real
    els.indicator.textContent = label;
}

function createPage(src, className) {
    const wrapper = document.createElement('div');
    wrapper.className = `page-wrapper ${className}`;
    
    if (src && src.indexOf('undefined') === -1) {
        const img = document.createElement('img');
        img.src = src;
        img.loading = "lazy"; // Lazy loading nativo para rendimiento
        wrapper.appendChild(img);
    } else {
        wrapper.style.background = 'transparent'; // Lados vacíos transparentes
    }
    return wrapper;
}

function addSpine(el, side) {
    const spine = document.createElement('div');
    spine.className = 'shadow-spine';
    el.appendChild(spine);
}

// --- NAVEGACIÓN & ANIMACIÓN ---

function flip(dir) {
    if (dir === 'next') {
        if (state.currentView >= state.totalViews - 1) return;
        state.currentView++;
    } else {
        if (state.currentView <= 0) return;
        state.currentView--;
    }
    
    playSound();
    
    // Animación rápida
    els.book.style.transform = 'scale(0.98)'; // Pequeño rebote
    els.book.style.opacity = '0.8';
    
    setTimeout(() => {
        render();
        els.book.style.transform = state.isZoomed ? 'scale(1.6)' : 'scale(1)';
        els.book.style.opacity = '1';
    }, 150); // 150ms es mucho más rápido que antes
}

function updateControls() {
    els.prev.disabled = state.currentView === 0;
    els.next.disabled = state.currentView >= state.totalViews - 1;
    els.prev.style.opacity = els.prev.disabled ? '0' : '1';
    els.next.style.opacity = els.next.disabled ? '0' : '1';
}

// --- EXTRAS ---

function playSound() {
    els.audio.currentTime = 0;
    els.audio.play().catch(() => {});
}

function toggleZoom() {
    state.isZoomed = !state.isZoomed;
    els.book.style.transform = state.isZoomed ? 'scale(1.6)' : 'scale(1)';
    els.book.style.cursor = state.isZoomed ? 'grab' : 'default';
    
    // Icon change
    els.zoom.innerHTML = state.isZoomed 
        ? '<span class="material-icons-round">zoom_out</span>' 
        : '<span class="material-icons-round">zoom_in</span>';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Swipe para móvil
function setupSwipe() {
    let startX = 0;
    els.book.addEventListener('touchstart', e => startX = e.touches[0].clientX);
    els.book.addEventListener('touchend', e => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (Math.abs(diff) > 50) { // Umbral de 50px
            if (diff > 0) flip('next');
            else flip('prev');
        }
    });
}

// Iniciar
init();
