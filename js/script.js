/*
  FOCO Magazine - V13 Final + Zoom & Fullscreen
  - Incluye lógica de "Páginas Fantasma" (Ghost Pages).
  - Incluye Zoom libre (Pan & Zoom) sin romper Turn.js.
  - Pantalla completa nativa.
*/

const config = {
    startPage: 23, endPage: 68, path: 'pages/a-', ext: '.png'
};

let flipbook = $('#flipbook');
let totalRealImages = config.endPage - config.startPage + 1;
let isAnimating = false;
let audioUnlocked = false;

// Variables para el Zoom
let zoomLevel = 1;
let isZoomed = false;
let panX = 0, panY = 0;
let startX = 0, startY = 0;
let isDragging = false;

// Ratio Exacto
const PAGE_RATIO = 0.758; 

$(document).ready(function() {
    
    let images = [];
    images.push('dummy_start'); 

    for (let i = 0; i < totalRealImages; i++) {
        images.push(`${config.path}${config.startPage + i}${config.ext}`);
    }

    let realImagesToLoad = images.filter(img => img !== 'dummy_start');
    
    preloadImages(realImagesToLoad).then(() => {
        initBook(images);
        $('.loader-container').fadeOut(500);
    });

    $(document).on('touchstart click', function() {
        if(!audioUnlocked) { unlockAudio(); audioUnlocked = true; }
    });

    // --- NUEVOS EVENTOS ZOOM Y FULLSCREEN ---
    $('#btnFull').click(toggleFullscreen);
    $('#btnZoom').click(toggleZoom);

    // Eventos de arrastre (Pan) para el Zoom
    let viewport = document.getElementById('viewport');
    
    viewport.addEventListener('mousedown', startDrag);
    viewport.addEventListener('mousemove', doDrag);
    viewport.addEventListener('mouseup', endDrag);
    viewport.addEventListener('mouseleave', endDrag);
    
    viewport.addEventListener('touchstart', startDrag, {passive: false});
    viewport.addEventListener('touchmove', doDrag, {passive: false});
    viewport.addEventListener('touchend', endDrag);
});

function initBook(images) {
    images.forEach((src, i) => {
        if (src === 'dummy_start') {
            flipbook.append(`<div class="ignore"></div>`);
        } else {
            let isGhost = src.includes('a-23') || src.includes('a-68');
            let className = isGhost ? 'ghost' : 'page';
            if (!isGhost) {
                className += (i % 2 === 0) ? ' odd' : ' even';
            }
            flipbook.append(`<div class="${className}" style="background-image:url('${src}')"></div>`);
        }
    });

    let size = calculateExactSize();
    let isMobile = $(window).width() < 768;
    let startPage = isMobile ? 3 : 2;

    flipbook.turn({
        width: size.width,
        height: size.height,
        display: size.display,
        autoCenter: true,
        gradients: true,
        acceleration: true,
        elevation: 50,
        duration: 1000,
        page: startPage,
        when: {
            start: function() { isAnimating = true; playSound('flip'); },
            turned: function(e, page) { isAnimating = false; updateUI(page); },
            end: function() { isAnimating = false; }
        }
    });

    flipbook.animate({opacity: 1}, 500);
    updateUI(startPage); 

    $('#prevBtn').click(() => { if (!isAnimating && !isZoomed) flipbook.turn('previous'); });
    $('#nextBtn').click(() => { if (!isAnimating && !isZoomed) flipbook.turn('next'); });
    $('#restartBtn').click(() => { 
        if (!isAnimating && !isZoomed) { 
            playSound('restart'); 
            let restartPage = $(window).width() < 768 ? 3 : 2;
            flipbook.turn('page', restartPage); 
        } 
    });
    
    $(document).keydown(e => {
        if (!isAnimating && !isZoomed) {
            if (e.keyCode == 37) flipbook.turn('previous');
            if (e.keyCode == 39) flipbook.turn('next');
        }
    });

    $(window).resize(() => {
        if(isZoomed) resetZoom(); // Resetear zoom al cambiar tamaño
        let newSize = calculateExactSize();
        flipbook.turn('size', newSize.width, newSize.height);
        flipbook.turn('display', newSize.display);
    });
}

// --- FUNCIONES ZOOM Y FULLSCREEN ---

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => {});
        $('#btnFull span').text('fullscreen_exit');
    } else {
        document.exitFullscreen();
        $('#btnFull span').text('fullscreen');
    }
}

function toggleZoom() {
    if (isZoomed) {
        resetZoom();
    } else {
        applyZoom();
    }
}

function applyZoom() {
    isZoomed = true;
    zoomLevel = 2.5; // Nivel de aumento
    panX = 0;
    panY = 0;
    
    // Desactivar flip de Turn.js para que no interfiera
    flipbook.turn('disable', true);
    
    // Ocultar flechas de navegación para limpiar vista
    $('.nav-btn').fadeOut();
    
    // Cambiar icono
    $('#btnZoom span').text('zoom_out');
    
    // Aplicar transformación CSS
    updateTransform();
    
    // Cursor manita
    $('#viewport').css('cursor', 'grab');
}

function resetZoom() {
    isZoomed = false;
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    
    // Reactivar Turn.js
    flipbook.turn('disable', false);
    
    // Mostrar flechas según corresponda
    updateUI(flipbook.turn('page'));
    
    // Cambiar icono
    $('#btnZoom span').text('zoom_in');
    
    // Reset CSS
    flipbook.css('transform', `scale(1) translate(0px, 0px)`);
    $('#viewport').css('cursor', 'default');
}

// --- LÓGICA DE ARRASTRE (PAN) ---
function startDrag(e) {
    if (!isZoomed) return;
    isDragging = true;
    
    // Obtener coordenadas X/Y (mouse o touch)
    startX = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;
    startY = (e.type === 'touchstart') ? e.touches[0].clientY : e.clientY;
    
    // Ajustar por el desplazamiento actual
    startX -= panX;
    startY -= panY;
    
    $('#viewport').css('cursor', 'grabbing');
}

function doDrag(e) {
    if (!isDragging || !isZoomed) return;
    e.preventDefault(); // Evitar scroll nativo del navegador
    
    let x = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
    let y = (e.type === 'touchmove') ? e.touches[0].clientY : e.clientY;
    
    panX = x - startX;
    panY = y - startY;
    
    updateTransform();
}

function endDrag() {
    isDragging = false;
    if (isZoomed) $('#viewport').css('cursor', 'grab');
}

function updateTransform() {
    // Aplicamos el zoom y el desplazamiento al contenedor del libro
    flipbook.css('transform', `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`);
}

// --- FIN FUNCIONES ZOOM ---

function calculateExactSize() {
    let w = $('.book-viewport').width();
    let h = $('.book-viewport').height();
    let isMobile = w < 768;
    let maxW = w * 0.96;
    
    let finalW, finalH;

    if (isMobile) {
        let maxH = h * 0.90; 
        finalH = maxH;
        finalW = finalH * PAGE_RATIO;
        if (finalW > maxW) { finalW = maxW; finalH = finalW / PAGE_RATIO; }
        return { width: finalW, height: finalH, display: 'single' };
    } else {
        let maxH = h * 0.96;
        let spreadRatio = PAGE_RATIO * 2;
        finalH = maxH;
        finalW = finalH * spreadRatio;
        if (finalW > maxW) { finalW = maxW; finalH = finalW / spreadRatio; }
        return { width: finalW, height: finalH, display: 'double' };
    }
}

function updateUI(page) {
    let totalPagesInTurn = flipbook.turn('pages');
    let label = "";
    let percentage = 0;
    let coverThreshold = 3; 

    if (page <= coverThreshold) {
        label = "Portada";
        percentage = 0;
    } else if (page >= totalPagesInTurn - 1) {
        label = "Contraportada";
        percentage = 100;
    } else {
        let displayPage = page - 3; 
        label = `Página ${displayPage}`;
        let totalContentPages = totalPagesInTurn - 5; 
        percentage = (displayPage / totalContentPages) * 100;
    }
    
    $('#pageIndicator').text(label);
    if(percentage > 100) percentage = 100;
    $('#progressBar').css('width', `${percentage}%`);

    if(!isZoomed) { // Solo mostrar botones si NO hay zoom
        if (page <= coverThreshold) $('#prevBtn').hide(); else $('#prevBtn').show();
        if (page >= totalPagesInTurn - 1) { 
            $('#nextBtn').hide(); $('#restartBtn').css('display', 'flex'); 
        } else { 
            $('#nextBtn').show(); $('#restartBtn').hide(); 
        }
    }
}

function preloadImages(urls) {
    let loaded = 0;
    return new Promise(resolve => {
        if (urls.length === 0) resolve();
        urls.forEach(src => {
            let img = new Image();
            img.src = src;
            img.onload = img.onerror = () => {
                loaded++; if (loaded === urls.length) resolve();
            };
        });
        setTimeout(resolve, 6000); 
    });
}

function unlockAudio() {
    let a1 = document.getElementById('pageSound');
    let a2 = document.getElementById('restartSound');
    if(a1) { a1.muted = true; a1.play().catch(()=>{}); a1.pause(); a1.currentTime=0; a1.muted=false; }
    if(a2) { a2.muted = true; a2.play().catch(()=>{}); a2.pause(); a2.currentTime=0; a2.muted=false; }
}

function playSound(type) {
    let id = type === 'restart' ? 'restartSound' : 'pageSound';
    let audio = document.getElementById(id);
    if (audio) { audio.currentTime = 0; audio.play().catch(()=>{}); }
}
