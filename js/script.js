/*
  FOCO Magazine - Turn.js Fixed
  - Portada con proporción correcta (Sin estiramiento)
  - Bloqueo de doble clic (Debounce)
  - Estética mejorada
*/

const config = {
    startPage: 24, endPage: 67, path: 'pages/a-', ext: '.png'
};

let flipbook = $('#flipbook');
let totalPages = config.endPage - config.startPage + 1;
let isAnimating = false; // Candado para evitar doble clic
let audioUnlocked = false;

// Proporción de UNA sola página (Ancho / Alto)
// Ejemplo A4: 210 / 297 = ~0.707
// Ajusta este número si tus imágenes son cuadradas (1) o más anchas.
const PAGE_ASPECT_RATIO = 0.707; 

$(document).ready(function() {
    
    // 1. Cargar imágenes
    let images = [];
    for (let i = 0; i < totalPages; i++) {
        images.push(`${config.path}${config.startPage + i}${config.ext}`);
    }

    // Precargar para evitar páginas blancas
    preloadImages(images).then(() => {
        initBook(images);
        $('.loader-container').fadeOut(500);
    });

    // Desbloqueo audio
    $(document).on('touchstart click', function() {
        if(!audioUnlocked) {
            unlockAudio();
            audioUnlocked = true;
        }
    });
});

function initBook(images) {
    // Insertar HTML
    images.forEach((src, i) => {
        // La primera y última son 'hard' (duras) para efecto tapa
        let className = (i === 0 || i === images.length - 1) ? 'hard' : 'page';
        flipbook.append(`<div class="${className}"><img src="${src}"></div>`);
    });

    // Calcular tamaño inicial
    let size = calculateSize();

    // Iniciar Turn.js
    flipbook.turn({
        width: size.width,
        height: size.height,
        display: size.display,
        autoCenter: true,
        gradients: true, // Sombras realistas
        acceleration: true,
        elevation: 50,
        duration: 1000, // 1 segundo por vuelta
        when: {
            start: function() {
                isAnimating = true; // Bloquear botones
                playSound('flip');
            },
            turned: function(e, page) {
                isAnimating = false; // Desbloquear botones
                updateUI(page);
            },
            end: function() {
                isAnimating = false; // Asegurar desbloqueo
            }
        }
    });

    // Mostrar libro
    flipbook.animate({opacity: 1}, 500);
    updateUI(1);

    // Controles
    $('#prevBtn').click(() => {
        if (isAnimating) return; // SI ESTÁ ANIMANDO, IGNORAR CLIC
        flipbook.turn('previous');
    });

    $('#nextBtn').click(() => {
        if (isAnimating) return; // SI ESTÁ ANIMANDO, IGNORAR CLIC
        flipbook.turn('next');
    });

    $('#restartBtn').click(() => {
        if (isAnimating) return;
        playSound('restart');
        flipbook.turn('page', 1);
    });

    // Responsividad
    $(window).resize(() => {
        let newSize = calculateSize();
        flipbook.turn('size', newSize.width, newSize.height);
        flipbook.turn('display', newSize.display);
    });
}

function calculateSize() {
    let w = $(window).width();
    let h = $(window).height();
    let isMobile = w < 768;
    
    // Márgenes de seguridad
    let availableW = w * 0.95;
    let availableH = h * 0.85;

    let bookW, bookH;

    if (isMobile) {
        // MÓVIL: Vista sencilla ('single')
        // El libro mide lo que mide UNA página
        bookH = availableH;
        bookW = bookH * PAGE_ASPECT_RATIO;
        
        // Si se sale de ancho
        if (bookW > availableW) {
            bookW = availableW;
            bookH = bookW / PAGE_ASPECT_RATIO;
        }
        
        return { width: bookW, height: bookH, display: 'single' };
        
    } else {
        // ESCRITORIO: Vista doble ('double')
        // El libro mide DOS veces el ancho de una página
        bookH = availableH;
        let singlePageW = bookH * PAGE_ASPECT_RATIO;
        bookW = singlePageW * 2;

        // Si se sale de ancho
        if (bookW > availableW) {
            bookW = availableW;
            singlePageW = bookW / 2;
            bookH = singlePageW / PAGE_ASPECT_RATIO;
        }

        return { width: bookW, height: bookH, display: 'double' };
    }
}

function updateUI(page) {
    let total = flipbook.turn('pages');
    let label = `Página ${page} / ${total}`;
    if (page === 1) label = "Portada";
    if (page === total) label = "Contraportada";
    
    $('#pageIndicator').text(label);

    // Lógica botones
    if (page === 1) $('#prevBtn').hide(); else $('#prevBtn').show();
    
    if (page === total) {
        $('#nextBtn').hide();
        $('#restartBtn').css('display', 'flex');
    } else {
        $('#nextBtn').show();
        $('#restartBtn').hide();
    }
}

function preloadImages(urls) {
    let loaded = 0;
    return new Promise(resolve => {
        if (urls.length === 0) resolve();
        urls.forEach(src => {
            let img = new Image();
            img.src = src;
            img.onload = () => {
                loaded++;
                if (loaded === urls.length) resolve();
            };
            img.onerror = () => { // Si falla una, seguimos igual
                loaded++; 
                if (loaded === urls.length) resolve();
            };
        });
        // Seguridad: Si tarda mas de 5s, iniciar igual
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
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(()=>{});
    }
}
