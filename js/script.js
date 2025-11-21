/*
  FOCO Magazine - Turn.js Final V2
  - Carga TOTAL bloqueante (Evita páginas blancas)
  - Botón Reiniciar funcional
  - Audio Unlock
*/

const config = {
    startPage: 24, endPage: 67, path: 'pages/a-', ext: '.png'
};

let flipbookEl = $('#flipbook');
let totalPages = config.endPage - config.startPage + 1;
let audioUnlocked = false;

$(document).ready(async function() {
    
    // 1. Generar lista de imágenes
    let imagesToLoad = [];
    for (let i = 0; i < totalPages; i++) {
        imagesToLoad.push(`${config.path}${config.startPage + i}${config.ext}`);
    }

    // 2. CARGA BLOQUEANTE (Esperar a todas)
    // Esto garantiza que no haya paginas blancas, aunque el loader dure más.
    try {
        await preloadImages(imagesToLoad);
    } catch (e) {
        console.log("Alguna imagen falló, pero continuamos.");
    }

    // 3. Inyectar HTML en Turn.js
    imagesToLoad.forEach((src, index) => {
        // Sin loading=lazy porque ya las precargamos
        let className = (index === 0 || index === totalPages - 1) ? 'hard' : 'page';
        flipbookEl.append(`<div class="${className}"><img src="${src}"></div>`);
    });

    // 4. Inicializar Turn.js
    let size = calculateBoundaries();
    flipbookEl.turn({
        width: size.width,
        height: size.height,
        autoCenter: true,
        gradients: true,
        acceleration: true,
        display: size.display,
        elevation: 50,
        when: {
            turned: function(e, page) {
                updateControls(page);
                playSound('flip');
            }
        }
    });

    // 5. Ocultar Loader
    $('.loader-container').addClass('hidden');
    flipbookEl.css('opacity', 1);

    // 6. Eventos
    setupControls();
    
    // 7. Audio Unlock (Primer toque)
    const unlockAudio = () => {
        if(audioUnlocked) return;
        let a1 = document.getElementById('pageSound');
        let a2 = document.getElementById('restartSound');
        [a1, a2].forEach(a => {
            a.muted = true; 
            a.play().then(() => { a.pause(); a.currentTime=0; a.muted=false; }).catch(()=>{});
        });
        audioUnlocked = true;
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('touchstart', unlockAudio, {passive:true});
    document.addEventListener('click', unlockAudio);

    $(window).resize(function() { resizeBook(); });
    updateControls(1);
});

// --- FUNCIONES ---

function preloadImages(urls) {
    // Devuelve una promesa que se resuelve cuando TODAS las imágenes cargan
    const promises = urls.map(src => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve; // Si falla, resolvemos igual para no trabar todo
        });
    });
    return Promise.all(promises);
}

function setupControls() {
    $('#prevBtn').click(() => flipbookEl.turn('previous'));
    $('#nextBtn').click(() => flipbookEl.turn('next'));
    
    // Lógica RESTART
    $('#restartBtn').click(() => {
        playSound('restart');
        flipbookEl.turn('page', 1); // Turn.js tiene animación nativa de regreso
    });

    $(document).keydown(function(e) {
        if (e.keyCode == 37) flipbookEl.turn('previous');
        if (e.keyCode == 39) flipbookEl.turn('next');
    });
}

function updateControls(page) {
    let total = flipbookEl.turn('pages');
    
    // Indicador de página
    let label = `Página ${page} / ${total}`;
    if (page === 1) label = "Portada";
    else if (page >= total) label = "Contraportada";
    $('#pageIndicator').text(label);

    // Mostrar/Ocultar botones
    if (page === 1) $('#prevBtn').css('opacity', 0);
    else $('#prevBtn').css('opacity', 1);

    // Botón siguiente vs Reiniciar
    if (page >= total) {
        $('#nextBtn').hide();
        $('#restartBtn').css('display', 'flex'); // Mostrar reiniciar
    } else {
        $('#nextBtn').show();
        $('#restartBtn').hide();
    }
}

function playSound(type) {
    let id = type === 'restart' ? 'restartSound' : 'pageSound';
    let audio = document.getElementById(id);
    if (audio && (audio.readyState >= 2 || audioUnlocked)) {
        audio.currentTime = 0;
        audio.play().catch(()=>{});
    }
}

function calculateBoundaries() {
    let wrapperW = $('.book-container-wrapper').width();
    let wrapperH = $('.book-container-wrapper').height();
    let isMobile = wrapperW < 768;
    let aspectRatio = isMobile ? (1/1.414) : 1.414; 

    let newWidth, newHeight;
    if (isMobile) {
        newWidth = wrapperW * 0.95;
        newHeight = newWidth / aspectRatio;
        if (newHeight > wrapperH * 0.9) {
             newHeight = wrapperH * 0.9; newWidth = newHeight * aspectRatio;
        }
    } else {
        newHeight = wrapperH * 0.9; newWidth = newHeight * aspectRatio;
        if (newWidth > wrapperW * 0.95) {
            newWidth = wrapperW * 0.95; newHeight = newWidth / aspectRatio;
        }
    }
    return { width: newWidth, height: newHeight, display: isMobile ? 'single' : 'double' };
}

function resizeBook() {
    let size = calculateBoundaries();
    flipbookEl.turn('size', size.width, size.height);
    flipbookEl.turn('display', size.display);
}
