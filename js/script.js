/*
  FOCO Magazine - V8 Ghost Pages Strategy
  - Rango: a-23 (Fantasma) a a-68 (Fantasma)
  - Portada Real: a-24 (Página 2 en el sistema)
  - Contraportada Real: a-67 (Penúltima)
  - Contador ajustado para ignorar fantasmas
*/

const config = {
    // INCLUIMOS LAS FANTASMAS
    startPage: 23, endPage: 68, path: 'pages/a-', ext: '.png'
};

let flipbook = $('#flipbook');
let totalFiles = config.endPage - config.startPage + 1; // Total de imágenes (incluyendo fantasmas)
let isAnimating = false;
let audioUnlocked = false;

// Ratio: 603 / 796 = 0.758
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
        // a-23 (i=0) y a-68 (i=last) son 'hard' (transparentes)
        // El resto son 'page' (internas con sombra 3D)
        let className = (i === 0 || i === images.length - 1) ? 'hard' : 'page';
        
        // Añadir even/odd solo a las páginas internas para las sombras
        if (className === 'page') {
            // Ajuste: como empezamos en 0 (a-23), la a-24 es i=1 (impar/odd).
            // En Turn.js, página 2 (a-24) cae a la izquierda en doble vista si la 1 está sola.
            className += (i % 2 === 0) ? ' even' : ' odd';
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

    // Si empezamos en la página 1 (Fantasma), saltar a la 2 (Portada Real) inmediatamente
    if(flipbook.turn('page') === 1) {
        flipbook.turn('page', 2);
    }

    flipbook.animate({opacity: 1}, 500);
    updateUI(2); // UI inicial basada en la portada real

    // Controles
    $('#prevBtn').click(() => { if (!isAnimating) flipbook.turn('previous'); });
    $('#nextBtn').click(() => { if (!isAnimating) flipbook.turn('next'); });
    $('#restartBtn').click(() => { 
        if (!isAnimating) { 
            playSound('restart'); 
            // Volver a la página 2 (Portada Real), no a la 1 (Fantasma)
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
        let maxH = h * 0.82; // Espacio para barra progreso
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
    // page es el número interno de Turn.js (1 a 46)
    // 1 = a-23 (Fantasma)
    // 2 = a-24 (Portada Real)
    // ...
    // 45 = a-67 (Contraportada Real)
    // 46 = a-68 (Fantasma)

    let totalRealPages = totalFiles - 2; // Quitamos las 2 fantasmas
    let displayPage = 0;
    let label = "";

    if (page <= 2) {
        label = "Portada";
    } else if (page >= totalFiles - 1) {
        label = "Contraportada";
    } else {
        // Cálculo: Si estamos en pag 3 (a-25), queremos que diga "Pág 1"
        // 3 - 2 = 1. Correcto.
        // Si estamos en pag 4 (a-26), queremos "Pág 2".
        // 4 - 2 = 2. Correcto.
        displayPage = page - 2;
        label = `Página ${displayPage}`;
    }
    
    $('#pageIndicator').text(label);

    // Barra de Progreso (0% en portada, 100% en contraportada)
    // Rango útil: de 2 a 45.
    let progress = 0;
    if (page > 2) {
        progress = ((page - 2) / (totalFiles - 3)) * 100;
    }
    if (progress > 100) progress = 100;
    $('#progressBar').css('width', `${progress}%`);

    // Botones
    // Ocultar 'prev' si estamos en portada real (pag 2) o antes
    if (page <= 2) $('#prevBtn').hide(); else $('#prevBtn').show();
    
    // Mostrar reiniciar si estamos en contraportada real (pag 45) o después
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
