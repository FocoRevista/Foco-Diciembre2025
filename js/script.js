/*
  FOCO Magazine - Turn.js Edition
  - Usa la librería Turn.js para efecto 3D realista sin código nativo complejo.
  - Requiere jQuery y turn.min.js
*/

const config = {
    startPage: 24, endPage: 67, path: 'pages/a-', ext: '.png'
};

let flipbookEl = $('#flipbook');
let totalPages = config.endPage - config.startPage + 1;

// --- INICIO ---
$(document).ready(function() {
    // 1. Generar el HTML de las páginas
    for (let i = 0; i < totalPages; i++) {
        let src = `${config.path}${config.startPage + i}${config.ext}`;
        // Turn.js espera divs con clase 'page' o 'hard' (para portadas)
        let className = (i === 0 || i === totalPages - 1) ? 'hard' : 'page';
        flipbookEl.append(`<div class="${className}"><img src="${src}" loading="lazy"></div>`);
    }

    // 2. Calcular tamaño inicial
    let size = calculateBoundaries();

    // 3. INICIALIZAR TURN.JS
    flipbookEl.turn({
        width: size.width,
        height: size.height,
        autoCenter: true, // Centra la revista cuando hay una sola página
        gradients: true, // Sombras realistas al doblar
        acceleration: true, // Usa hardware para suavidad
        display: size.display, // 'single' para móvil, 'double' para PC
        elevation: 50, // Altura de la sombra

        // Evento: Cuando cambia la página
        when: {
            turned: function(e, page) {
                updateIndicator(page);
            }
        }
    });

    // 4. Ocultar loader y mostrar libro suavemente
    // Damos un pequeño respiro para que Turn.js se acomode
    setTimeout(() => {
        $('.loader-container').css('opacity', 0);
        setTimeout(() => $('.loader-container').hide(), 500);
        flipbookEl.css('opacity', 1);
    }, 1000);

    // 5. Configurar controles
    setupControls();

    // 6. Manejar redimensionamiento de ventana
    $(window).resize(function() {
        resizeBook();
    });

    // Estado inicial del indicador
    updateIndicator(1);
});


// --- FUNCIONES AUXILIARES ---

function setupControls() {
    // Flechas usan la API de Turn.js
    $('#prevBtn').click(function() {
        flipbookEl.turn('previous');
    });

    $('#nextBtn').click(function() {
        flipbookEl.turn('next');
    });

    // Teclado
    $(document).keydown(function(e) {
        if (e.keyCode == 37) flipbookEl.turn('previous');
        if (e.keyCode == 39) flipbookEl.turn('next');
    });
}

function updateIndicator(currentPage) {
    let label = `Página ${currentPage} / ${totalPages}`;
    // Intento simple de detectar portadas (Turn.js maneja la numeración internamente)
    if (currentPage === 1) label = "Portada";
    else if (currentPage >= totalPages) label = "Contraportada";
    
    $('#pageIndicator').text(label);
}

// Función clave para que sea responsivo
function calculateBoundaries() {
    let wrapperW = $('.book-container-wrapper').width();
    let wrapperH = $('.book-container-wrapper').height();
    let isMobile = wrapperW < 768;
    
    // Proporción original de tu revista (aprox 1.414 vertical por página)
    // Si es doble pagina, la proporción es horizontal (aprox 1.414 horizontal)
    let aspectRatio = isMobile ? (1/1.414) : 1.414; 

    let newWidth, newHeight;

    if (isMobile) {
        // Móvil: Intentar llenar el ancho
        newWidth = wrapperW * 0.95;
        newHeight = newWidth / aspectRatio;
        // Si se pasa de alto, ajustar por alto
        if (newHeight > wrapperH * 0.9) {
             newHeight = wrapperH * 0.9;
             newWidth = newHeight * aspectRatio;
        }
    } else {
        // Desktop (Doble página): Ajustar por altura primero
        newHeight = wrapperH * 0.9;
        newWidth = newHeight * aspectRatio;
        // Si se pasa de ancho, ajustar por ancho
        if (newWidth > wrapperW * 0.95) {
            newWidth = wrapperW * 0.95;
            newHeight = newWidth / aspectRatio;
        }
    }

    return {
        width: newWidth,
        height: newHeight,
        display: isMobile ? 'single' : 'double'
    };
}

function resizeBook() {
    let size = calculateBoundaries();
    // Usar la API de Turn.js para redimensionar
    flipbookEl.turn('size', size.width, size.height);
    flipbookEl.turn('display', size.display);
}
