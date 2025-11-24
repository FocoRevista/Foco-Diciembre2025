/*
  FOCO Magazine - V10 Ghost Strategy + Shadows
  - Rango: 23 (Fantasma) a 68 (Fantasma).
  - Portada Real (24) tratada como página interna para evitar deformación.
  - Estética 3D restaurada.
*/

const config = {
    // INCLUIMOS LAS FANTASMAS EN EL RANGO
    startPage: 23, endPage: 68, path: 'pages/a-', ext: '.png'
};

let flipbook = $('#flipbook');
let totalFiles = config.endPage - config.startPage + 1; 
let isAnimating = false;
let audioUnlocked = false;

// Tu Ratio Exacto (603 / 796)
const PAGE_RATIO = 0.758; 

$(document).ready(function() {
    
    let images = [];
    for (let i = 0; i < totalFiles; i++) {
        images.push(`${config.path}${config.startPage + i}${config.ext}`);
    }

    preloadImages(images).then(() => {
        initBook(images);
        $('.loader-container').fadeOut(500);
    });

    $(document).on('touchstart click', function() {
        if(!audioUnlocked) { unlockAudio(); audioUnlocked = true; }
    });
});

function initBook(images) {
    images.forEach((src, i) => {
        // DETECCIÓN DE FANTASMAS
        // Si es la primera (a-23) o la última (a-68) del array
        let isGhost = (i === 0 || i === images.length - 1);
        
        // Las fantasmas son 'hard' (para cerrar el libro) pero invisibles (clase ghost)
        // Las reales (incluyendo a-24 portada) son 'page' normales
        let className = isGhost ? 'hard ghost' : 'page';
        
        // Añadir even/odd para las sombras estéticas (solo a las reales)
        if (!isGhost) {
            // i=1 es a-24. En Turn.js, Page 1 es derecha, Page 2 es Izquierda.
            // Como a-23 ocupa la Posición 1 (Derecha), a-24 ocupa la Posición 2 (Izquierda).
            // Par (2, 4...) = Izquierda (Even). Impar (3, 5...) = Derecha (Odd).
            // i coincide con el número de página de Turn.js aproximadamente.
            // Ajuste simple: alternar.
            className += (i % 2 === 0) ? ' odd' : ' even';
        }
        
        flipbook.append(`<div class="${className}" style="background-image:url('${src}')"></div>`);
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
        when: {
            start: function() { isAnimating = true; playSound('flip'); },
            turned: function(e, page) { isAnimating = false; updateUI(page); },
            end: function() { isAnimating = false; }
        }
    });

    // INICIO INTELIGENTE
    // En escritorio, como la Pág 1 es fantasma (derecha) y transparente, 
    // queremos ver inmediatamente el spread [2][3] (Portada Real a la izq, Editorial a la der).
    // Si es móvil, mostramos la 2 directamente.
    if(flipbook.turn('display') === 'double') {
       flipbook.turn('page', 2); 
    } else {
       flipbook.turn('page', 2);
    }

    flipbook.animate({opacity: 1}, 500);
    updateUI(2); 

    // Controles
    $('#prevBtn').click(() => { if (!isAnimating) flipbook.turn('previous'); });
    $('#nextBtn').click(() => { if (!isAnimating) flipbook.turn('next'); });
    $('#restartBtn').click(() => { 
        if (!isAnimating) { 
            playSound('restart'); 
            // Volver a la Portada Real (Página 2), no a la fantasma
            flipbook.turn('page', 2); 
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
        let maxH = h * 0.82;
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
    // page es el índice interno (1 a 46)
    // 1=a-23 (Fantasma), 2=a-24 (Portada Real)... 45=a-67 (Contra Real), 46=a-68 (Fantasma)
    
    let label = "";
    let totalRealPages = totalFiles - 2;

    if (page <= 2) {
        label = "Portada";
    } else if (page >= totalFiles - 1) {
        label = "Contraportada";
    } else {
        // Cálculo para humanos: Si estamos en pag 3 (a-25), es la "1"
        let displayPage = page - 2;
        label = `Página ${displayPage}`;
    }
    
    $('#pageIndicator').text(label);

    // Barra
    let progress = 0;
    if (page > 2) {
        progress = ((page - 2) / (totalFiles - 3)) * 100;
    }
    if (progress > 100) progress = 100;
    $('#progressBar').css('width', `${progress}%`);

    // Botones (Ocultar si estamos en fantasmas o tapas extremas)
    if (page <= 2) $('#prevBtn').hide(); else $('#prevBtn').show();
    
    if (page >= totalFiles - 1) { 
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
