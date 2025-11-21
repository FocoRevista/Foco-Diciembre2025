/*
  FOCO Magazine - Motor Flipbook Optimizado
  - Detección automática Móvil vs Escritorio
  - Corrección de rutas y sombras
*/

// CONFIGURACIÓN
const config = {
    startPage: 24,
    endPage: 67,
    path: 'pages/a-', // Prefijo de imagen
    ext: '.png'
};

// ESTADO
let state = {
    currentPage: 0, // Índice actual (0 a N)
    totalPages: (config.endPage - config.startPage) + 1,
    isMobile: false,
    isZoomed: false,
    images: []
};

// ELEMENTOS DOM
const dom = {
    book: document.getElementById('book'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageIndicator: document.getElementById('pageIndicator'),
    zoomBtn: document.getElementById('zoomBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    audio: document.getElementById('pageSound')
};

// --- INICIALIZACIÓN ---

function init() {
    // Generar lista de imágenes
    for (let i = 0; i < state.totalPages; i++) {
        state.images.push(`${config.path}${config.startPage + i}${config.ext}`);
    }

    // Detectar dispositivo inicial
    checkMode();
    
    // Render inicial
    renderBook();

    // Event Listeners
    window.addEventListener('resize', () => {
        const wasMobile = state.isMobile;
        checkMode();
        // Si cambió de modo, re-renderizar para ajustar layout
        if (wasMobile !== state.isMobile) renderBook();
    });

    dom.nextBtn.onclick = () => changePage('next');
    dom.prevBtn.onclick = () => changePage('prev');
    
    // Zoom
    dom.zoomBtn.onclick = toggleZoom;
    
    // Fullscreen
    dom.fullscreenBtn.onclick = toggleFullscreen;

    // Teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') changePage('next');
        if (e.key === 'ArrowLeft') changePage('prev');
    });

    // Swipe
    setupSwipe();
}

// Detectar si estamos en móvil (< 768px)
function checkMode() {
    state.isMobile = window.innerWidth < 768;
}

// --- RENDERIZADO ---

function renderBook() {
    dom.book.innerHTML = ''; // Limpiar
    
    const sheet = document.createElement('div');
    sheet.className = 'sheet';

    if (state.isMobile) {
        // --- MODO MÓVIL (1 PÁGINA) ---
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-side';
        
        const img = document.createElement('img');
        img.src = state.images[state.currentPage];
        
        pageDiv.appendChild(img);
        sheet.appendChild(pageDiv);
        
        dom.pageIndicator.textContent = `Página ${state.currentPage + 1} de ${state.totalPages}`;
        
    } else {
        // --- MODO ESCRITORIO (2 PÁGINAS / SPREAD) ---
        // Asegurarnos que en escritorio siempre empezamos en par para el lado izquierdo
        // Si currentPage es impar, restamos 1 para mostrar el spread correcto
        let leftIndex = state.currentPage % 2 === 0 ? state.currentPage : state.currentPage - 1;
        
        // Ajuste especial: Si estamos en portada (índice 0), a veces se quiere sola a la derecha
        // Pero para simplificar, mantendremos lógica 0-1, 2-3...
        
        // Lado Izquierdo
        const leftDiv = document.createElement('div');
        leftDiv.className = 'page-side left-page';
        if (state.images[leftIndex]) {
            const lImg = document.createElement('img');
            lImg.src = state.images[leftIndex];
            leftDiv.appendChild(lImg);
        }

        // Lado Derecho
        const rightDiv = document.createElement('div');
        rightDiv.className = 'page-side right-page';
        if (state.images[leftIndex + 1]) {
            const rImg = document.createElement('img');
            rImg.src = state.images[leftIndex + 1];
            rightDiv.appendChild(rImg);
        }

        sheet.appendChild(leftDiv);
        sheet.appendChild(rightDiv);

        dom.pageIndicator.textContent = `${leftIndex + 1}-${leftIndex + 2} de ${state.totalPages}`;
    }

    dom.book.appendChild(sheet);
    updateControls();
}

// --- LÓGICA DE CAMBIO DE PÁGINA ---

function changePage(dir) {
    const increment = state.isMobile ? 1 : 2;
    
    if (dir === 'next') {
        if (state.currentPage + increment >= state.totalPages) return; // Fin del libro
        state.currentPage += increment;
    } else {
        if (state.currentPage - increment < 0) {
            state.currentPage = 0; // Tope al inicio
        } else {
            state.currentPage -= increment;
        }
    }

    playSound();
    
    // Animación simple de opacidad para transición suave (Flip 3D complejo requiere más lógica)
    dom.book.style.opacity = '0';
    dom.book.style.transform = 'scale(0.95)'; // Pequeño efecto de retroceso
    
    setTimeout(() => {
        renderBook();
        dom.book.style.opacity = '1';
        dom.book.style.transform = state.isZoomed ? 'scale(1.5)' : 'scale(1)';
    }, 200);
}

function updateControls() {
    const increment = state.isMobile ? 1 : 2;
    dom.prevBtn.style.opacity = state.currentPage === 0 ? '0.3' : '1';
    dom.prevBtn.style.pointerEvents = state.currentPage === 0 ? 'none' : 'all';
    
    const isEnd = state.currentPage + increment >= state.totalPages;
    dom.nextBtn.style.opacity = isEnd ? '0.3' : '1';
    dom.nextBtn.style.pointerEvents = isEnd ? 'none' : 'all';
}

// --- UTILIDADES ---

function playSound() {
    // Reinicia el audio si ya se está reproduciendo para sonidos rápidos
    dom.audio.currentTime = 0;
    dom.audio.play().catch(e => console.log("Interacción requerida para audio"));
}

function toggleZoom() {
    state.isZoomed = !state.isZoomed;
    dom.book.style.transform = state.isZoomed ? 'scale(1.5)' : 'scale(1)';
    dom.book.style.cursor = state.isZoomed ? 'zoom-out' : 'default';
    dom.zoomBtn.innerHTML = state.isZoomed ? '<span class="material-icons-round">zoom_out</span>' : '<span class="material-icons-round">zoom_in</span>';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
        document.exitFullscreen();
    }
}

function setupSwipe() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    dom.book.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    dom.book.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) changePage('next');
        if (touchEndX > touchStartX + 50) changePage('prev');
    }
}

// Arrancar
init();
