/*
  FOCO Magazine - V11 "Perfect Spread"
  - Layout forzado: [Ghost Left | Cover Right] usando Dummy Page 1.
  - Estética recuperada.
  - Pixel Ratio Exacto.
*/

const config = {
    startPage: 23, endPage: 68, path: 'pages/a-', ext: '.png'
};

let flipbook = $('#flipbook');
// Total de imágenes reales (23 a 68)
let totalRealImages = config.endPage - config.startPage + 1;
let isAnimating = false;
let audioUnlocked = false;

// 603 / 796 = 0.758
const PAGE_RATIO = 0.758; 

$(document).ready(function() {
    
    // 1. Construir Array de Imágenes
    let images = [];
    
    // A) PRIMER ELEMENTO: DUMMY (Para forzar el spread correcto)
    images.push('dummy_start'); 

    // B) RESTO DE IMÁGENES (23 a 68)
    for (let i = 0; i < totalRealImages; i++) {
        images.push(`${config.path}${config.startPage + i}${config.ext}`);
    }

    // 2. Precarga (Solo las reales)
    let realImagesToLoad = images.filter(img => img !== 'dummy_start');
    
    preloadImages(realImagesToLoad).then(() => {
        initBook(images);
        $('.loader-container').fadeOut(500);
    });

    $(document).on('touchstart click', function() {
        if(!audioUnlocked) { unlockAudio(); audioUnlocked = true; }
    });
});

function initBook(images) {
    images.forEach((src, i) => {
        // i=0 es el dummy. i=1 es a-23. i=2 es a-24.
        
        if (src === 'dummy_start') {
            // PÁGINA 1: INVISIBLE (Ocupa el slot derecho inicial)
            flipbook.append(`<div class="ignore"></div>`);
        } else {
            // DETECTAR SI ES FANTASMA VISUAL (a-23 y a-68)
            // src termina en a-23.png o a-68.png
            let isGhost = src.includes('a-23') || src.includes('a-68');
            
            let className = isGhost ? 'ghost' : 'page';
            
            // Añadir clases para sombras (Even/Odd)
            // En este array modificado:
            // i=1 (a-23) -> Pág 2 (Turn.js) -> Izquierda (Even)
            // i=2 (a-24) -> Pág 3 (Turn.js) -> Derecha (Odd)
            // Coincide: Índice par del array = Odd Page. Índice impar = Even Page.
            if (!isGhost) {
                className += (i % 2 === 0) ? ' odd' : ' even';
            }

            flipbook.append(`<div class="${className}" style="background-image:url('${src}')"></div>`);
        }
    });

    let size = calculateExactSize();

    flipbook.turn({
        width: size.width,
        height: size.height,
        display: size.display,
        autoCenter: true,
        gradients: true,
        acceleration: true,
        elevation: 50,
        duration: 1000,
        page: 2, // <--- INICIAR EN PÁGINA 2 (Donde está a-23 | a-24)
        when: {
            start: function() { isAnimating = true; playSound('flip'); },
            turned: function(e, page) { isAnimating = false; updateUI(page); },
            end: function() { isAnimating = false; }
        }
    });

    flipbook.animate({opacity: 1}, 500);
    updateUI(2); 

    // Controles
    $('#prevBtn').click(() => { if (!isAnimating) flipbook.turn('previous'); });
    $('#nextBtn').click(() => { if (!isAnimating) flipbook.turn('next'); });
    $('#restartBtn').click(() => { 
        if (!isAnimating) { 
            playSound('restart'); 
            flipbook.turn('page', 2); // Volver al inicio visual (Pág 2)
        } 
    });
    
    $(document).keydown(e => {
        if (!isAnimating) {
            if (e.keyCode == 37) flipbook.turn('previous');
            if (e.keyCode == 39) flipbook.turn('next');
        }
    });

    $(window).resize(() => {
        let newSize = calculateExactSize();
        flipbook.turn('size', newSize.width, newSize.height);
        flipbook.turn('display', newSize.display);
    });
}

function calculateExactSize() {
    let w = $('.book-viewport').width();
    let h = $('.book-viewport').height();
    let isMobile = w < 768;
    let maxW = w * 0.96;
    
    let finalW, finalH;

    if (isMobile) {
        let maxH = h * 0.85;
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
    // Ajuste de lógica visual debido al Dummy en Pág 1
    // Pág 1 = Dummy
    // Pág 2 = a-23 (Fantasma)
    // Pág 3 = a-24 (Portada Real) -> Queremos que esta sea la "Portada"
    
    let totalPagesInTurn = flipbook.turn('pages');
    let label = "";
    let percentage = 0;

    if (page <= 3) {
        label = "Portada";
        percentage = 0;
    } else if (page >= totalPagesInTurn - 1) {
        label = "Contraportada";
        percentage = 100;
    } else {
        // Cálculo: Pág 4 (a-25) debería ser "Pág 1".
        // 4 - 3 = 1.
        let displayPage = page - 3;
        label = `Página ${displayPage}`;
        
        // Progreso
        let totalContentPages = totalPagesInTurn - 4; // Quitamos dummy, 23, 24, y las finales
        percentage = (displayPage / totalContentPages) * 100;
    }
    
    $('#pageIndicator').text(label);
    if(percentage > 100) percentage = 100;
    $('#progressBar').css('width', `${percentage}%`);

    // Botones
    // Bloquear retroceso si estamos en el spread inicial (2-3)
    if (page <= 3) $('#prevBtn').hide(); else $('#prevBtn').show();
    
    // Mostrar restart al final
    if (page >= totalPagesInTurn - 1) { 
        $('#nextBtn').hide(); $('#restartBtn').css('display', 'flex'); 
    } else { 
        $('#nextBtn').show(); $('#restartBtn').hide(); 
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
