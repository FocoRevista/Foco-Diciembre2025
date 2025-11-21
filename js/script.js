/*
  FOCO Magazine - Turn.js V3 Final Aesthetic
  - Solución definitiva a estiramiento (object-fit: contain)
  - Sombras CSS forzadas para volumen
  - Cálculo de tamaño simplificado
*/

const config = {
    startPage: 24, endPage: 67, path: 'pages/a-', ext: '.png'
};

let flipbook = $('#flipbook');
let totalPages = config.endPage - config.startPage + 1;
let isAnimating = false;
let audioUnlocked = false;

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
        // Las páginas 'hard' permiten el efecto de levantar la tapa
        let className = (i === 0 || i === images.length - 1) ? 'hard' : 'page';
        // Añadimos clases even/odd para las sombras CSS
        if (i > 0 && i < images.length - 1) {
            className += (i % 2 === 0) ? ' odd' : ' even';
        }
        flipbook.append(`<div class="${className}"><img src="${src}"></div>`);
    });

    let size = calculateSize();

    flipbook.turn({
        width: size.width,
        height: size.height,
        display: size.display,
        autoCenter: true,
        gradients: false, // Desactivamos las nativas, usaremos las nuestras CSS
        acceleration: true,
        elevation: 100, // Más elevación para realismo
        duration: 1000,
        when: {
            start: function() { isAnimating = true; playSound('flip'); },
            turned: function(e, page) { isAnimating = false; updateUI(page); },
            end: function() { isAnimating = false; }
        }
    });

    flipbook.animate({opacity: 1}, 500);
    updateUI(1);

    $('#prevBtn').click(() => { if (!isAnimating) flipbook.turn('previous'); });
    $('#nextBtn').click(() => { if (!isAnimating) flipbook.turn('next'); });
    $('#restartBtn').click(() => { if (!isAnimating) { playSound('restart'); flipbook.turn('page', 1); } });

    $(window).resize(() => {
        let newSize = calculateSize();
        flipbook.turn('size', newSize.width, newSize.height);
        flipbook.turn('display', newSize.display);
    });
    
    // Teclado
    $(document).keydown(function(e) {
        if (!isAnimating) {
            if (e.keyCode == 37) flipbook.turn('previous');
            if (e.keyCode == 39) flipbook.turn('next');
        }
    });
}

function calculateSize() {
    let w = $('.book-viewport').width();
    let h = $('.book-viewport').height();
    let isMobile = w < 768;
    
    // Usamos el 95% del espacio disponible, sin forzar proporciones.
    // El CSS (object-fit) se encargará de que la imagen no se estire.
    let bookW = w * 0.95;
    let bookH = h * 0.95;

    return { width: bookW, height: bookH, display: isMobile ? 'single' : 'double' };
}

function updateUI(page) {
    let total = flipbook.turn('pages');
    let label = `Página ${page} / ${total}`;
    if (page === 1) label = "Portada";
    if (page === total) label = "Contraportada";
    
    $('#pageIndicator').text(label);

    if (page === 1) $('#prevBtn').hide(); else $('#prevBtn').show();
    
    if (page === total) {
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
        setTimeout(resolve, 6000); // Timeout de seguridad
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
