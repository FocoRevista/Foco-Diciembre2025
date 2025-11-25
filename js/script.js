/*
  FOCO Magazine - V12 Mobile Perfection
  - Lógica de inicio diferenciada (Móvil vs Escritorio).
  - En Móvil inicia en página 3 (Portada Real a-24).
  - En Escritorio inicia en página 2 (Spread Fantasma).
*/

const config = {
    startPage: 23, endPage: 68, path: 'pages/a-', ext: '.png'
};

let flipbook = $('#flipbook');
let totalRealImages = config.endPage - config.startPage + 1;
let isAnimating = false;
let audioUnlocked = false;

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

    // LÓGICA DE INICIO INTELIGENTE
    // Escritorio (Double): Pág 1(Dummy) | Pág 2(a-23). Queremos ver el spread [2-3] inicialmente?
    // No, queremos [Dummy | a-23] a la izquierda? No.
    // Queremos ver la portada (a-24) a la derecha.
    // Pág 1: Dummy (R)
    // Pág 2: a-23 (L) - Pág 3: a-24 (R).
    // Por defecto Turn.js en double muestra [2][3] si le dices page 2.
    
    // MÓVIL: Queremos ver a-24 directo. Es la página 3.
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
        page: startPage, // <--- INICIO DINÁMICO
        when: {
            start: function() { isAnimating = true; playSound('flip'); },
            turned: function(e, page) { isAnimating = false; updateUI(page); },
            end: function() { isAnimating = false; }
        }
    });

    flipbook.animate({opacity: 1}, 500);
    updateUI(startPage); 

    $('#prevBtn').click(() => { if (!isAnimating) flipbook.turn('previous'); });
    $('#nextBtn').click(() => { if (!isAnimating) flipbook.turn('next'); });
    $('#restartBtn').click(() => { 
        if (!isAnimating) { 
            playSound('restart'); 
            // Al reiniciar, respetar la lógica móvil/escritorio
            let restartPage = $(window).width() < 768 ? 3 : 2;
            flipbook.turn('page', restartPage); 
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
        // MÓVIL: Usar más altura para centrar mejor
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
    // Ajuste visual de índices
    let totalPagesInTurn = flipbook.turn('pages');
    let label = "";
    let percentage = 0;
    
    // En móvil la portada es la página 3 (interna 24).
    // En escritorio es parte del spread 2-3.
    let coverThreshold = 3; 

    if (page <= coverThreshold) {
        label = "Portada";
        percentage = 0;
    } else if (page >= totalPagesInTurn - 1) {
        label = "Contraportada";
        percentage = 100;
    } else {
        let displayPage = page - 3; // a-25 es la 4ta en Turn.js -> Pág 1
        label = `Página ${displayPage}`;
        
        let totalContentPages = totalPagesInTurn - 5; 
        percentage = (displayPage / totalContentPages) * 100;
    }
    
    $('#pageIndicator').text(label);
    if(percentage > 100) percentage = 100;
    $('#progressBar').css('width', `${percentage}%`);

    // Botones
    if (page <= coverThreshold) $('#prevBtn').hide(); else $('#prevBtn').show();
    
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
