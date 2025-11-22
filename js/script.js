/*
  FOCO Magazine - V7 Contain Strategy
  - Ajuste dinámico para portada y contraportada.
  - Barra de progreso funcional.
*/

const config = {
    startPage: 24, endPage: 67, path: 'pages/a-', ext: '.png'
};

let flipbook = $('#flipbook');
let totalPages = config.endPage - config.startPage + 1;
let isAnimating = false;
let audioUnlocked = false;

// Ratio exacto de tus imágenes (603 / 796)
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
            turned: function(e, page) { 
                isAnimating = false; 
                updateUI(page); 
                adjustHardPages(); // 🔧 Ajuste tapas
            },
            end: function() { isAnimating = false; }
        }
    });

    flipbook.animate({opacity: 1}, 500);
    updateUI(1);
    adjustHardPages(); // 🔧 Ajuste inicial

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
        adjustHardPages(); // 🔧 Reajuste en resize
    });
}

function calculateExactSize() {
    let viewportW = $('.book-viewport').width();
    let viewportH = $('.book-viewport').height();
    let isMobile = viewportW < 768;
    
    let maxW = viewportW * 0.95;
    let maxH = viewportH * 0.95;
    let finalW, finalH;

    if (isMobile) {
        finalH = maxH;
        finalW = finalH * PAGE_RATIO;
        if (finalW > maxW) { finalW = maxW; finalH = finalW / PAGE_RATIO; }
        return { width: finalW, height: finalH, display: 'single' };
    } else {
        let spreadRatio = PAGE_RATIO * 2;
        finalH = maxH;
        finalW = finalH * spreadRatio;
        if (finalW > maxW) { finalW = maxW; finalH = finalW / spreadRatio; }
        return { width: finalW, height: finalH, display: 'double' };
    }
}

function adjustHardPages() {
    const size = flipbook.turn('size');
    $('#flipbook .page.hard').css({
        width: (size.width / 2) + 'px',
        height: size.height + 'px',
        margin: '0 auto'
    });
}

function updateUI(page) {
    let total = flipbook.turn('pages');
    let label = `Página ${page} / ${total}`;
    if (page === 1) label = "Portada";
    if (page === total) label = "Contraportada";
    $('#pageIndicator').text(label);

    let percentage = (page / total) * 100;
    $('#progressBar').css('width', `${percentage}%`);

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
        setTimeout(resolve, 5000); 
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
