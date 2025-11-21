/*
  FOCO Magazine - V6 Progress Bar & Cover Fix
  - Portadas forzadas a 'contain' vía CSS.
  - Barra de progreso minimalista en móvil.
  - Cálculo de espacio móvil ajustado.
*/

const config = {
    startPage: 24, endPage: 67, path: 'pages/a-', ext: '.png'
};

let flipbook = $('#flipbook');
let totalPages = config.endPage - config.startPage + 1;
let isAnimating = false;
let audioUnlocked = false;

// Relación de aspecto exacta de tus imágenes
const PAGE_RATIO = 0.758; 

$(document).ready(function() {
    let images = [];
    for (let i = 0; i < totalPages; i++) {
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
        // Asignamos 'hard' a la primera y última
        let className = (i === 0 || i === images.length - 1) ? 'hard' : 'page';
        if(i > 0 && i < images.length - 1) className += (i % 2 === 0) ? ' odd' : ' even';
        
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

    flipbook.animate({opacity: 1}, 500);
    updateUI(1); // Primera actualización

    // Controles
    $('#prevBtn').click(() => { if (!isAnimating) flipbook.turn('previous'); });
    $('#nextBtn').click(() => { if (!isAnimating) flipbook.turn('next'); });
    $('#restartBtn').click(() => { if (!isAnimating) { playSound('restart'); flipbook.turn('page', 1); } });
    
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
    let viewportW = $('.book-viewport').width();
    let viewportH = $('.book-viewport').height();
    let isMobile = viewportW < 768;
    
    let maxW = viewportW * 0.96; // Margen lateral seguro

    let finalW, finalH;

    if (isMobile) {
        // MÓVIL: Usamos menos altura para dejar espacio a la barra de progreso
        let mobileMaxH = viewportH * 0.82; // Dejamos ~18% de espacio abajo
        
        finalH = mobileMaxH;
        finalW = finalH * PAGE_RATIO;

        if (finalW > maxW) {
            finalW = maxW;
            finalH = finalW / PAGE_RATIO;
        }
        return { width: finalW, height: finalH, display: 'single' };
    } else {
        // ESCRITORIO
        let desktopMaxH = viewportH * 0.96;
        let spreadRatio = PAGE_RATIO * 2;

        finalH = desktopMaxH;
        finalW = finalH * spreadRatio;

        if (finalW > maxW) {
            finalW = maxW;
            finalH = finalW / spreadRatio;
        }
        return { width: finalW, height: finalH, display: 'double' };
    }
}

function updateUI(page) {
    let total = flipbook.turn('pages');
    
    // 1. Actualizar Texto
    let label = `Página ${page} / ${total}`;
    if (page === 1) label = "Portada";
    if (page === total) label = "Contraportada";
    $('#pageIndicator').text(label);

    // 2. Actualizar Barra de Progreso (Nuevo)
    let percentage = (page / total) * 100;
    $('#progressBar').css('width', `${percentage}%`);

    // 3. Actualizar Botones
    if (page === 1) $('#prevBtn').hide(); else $('#prevBtn').show();
    if (page === total) { $('#nextBtn').hide(); $('#restartBtn').css('display', 'flex'); } 
    else { $('#nextBtn').show(); $('#restartBtn').hide(); }
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
