/*
  Flipbook 3D Deluxe - script.js
  - Crea spreads desde a-24.png .. a-67.png
  - Drag-to-flip, click to flip, swipe en móvil
  - Zoom por doble clic, fullscreen, sonido
  - Precarga de imágenes
*/

const pageFiles = [];
// Generar lista de nombres: a-24 ... a-67
for (let i = 24; i <= 67; i++) {
  pageFiles.push(`pages/a-${i}.png`);
}

const totalPages = pageFiles.length;           // 44
const totalSpreads = Math.ceil(totalPages / 2); // 22 spreads

// Estado
let curSpread = 1; // 1-based
let isAnimating = false;
let dragState = null; // {startX, curX, direction}

// DOM
const book = document.getElementById('book');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const curSpreadEl = document.getElementById('curSpread');
const totalSpreadEl = document.getElementById('totalSpread');
const pageSound = document.getElementById('pageSound');
const zoomBtn = document.getElementById('zoomBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

totalSpreadEl.textContent = totalSpreads;
curSpreadEl.textContent = curSpread;

// Precarga de imágenes
function preloadImages(list, onProgress){
  let loaded = 0;
  list.forEach(src => {
    const i = new Image();
    i.src = src;
    i.onload = () => { loaded++; if(onProgress) onProgress(loaded,list.length); };
    i.onerror = () => { loaded++; if(onProgress) onProgress(loaded,list.length); };
  });
}

preloadImages(pageFiles);

// RENDER de un spread
function renderSpread(spreadIndex){
  book.innerHTML = '';

  const leftIndex = (spreadIndex - 1) * 2;       // índice en pageFiles (0-based)
  const rightIndex = leftIndex + 1;

  const sheet = document.createElement('div');
  sheet.className = 'sheet';

  const leftSide = document.createElement('div');
  leftSide.className = 'side left';
  const leftImg = document.createElement('img');
  leftImg.alt = `pagina-${leftIndex+1}`;
  leftImg.src = pageFiles[leftIndex] || '';
  leftSide.appendChild(leftImg);

  const rightSide = document.createElement('div');
  rightSide.className = 'side right';
  const rightImg = document.createElement('img');
  rightImg.alt = `pagina-${rightIndex+1}`;
  rightImg.src = pageFiles[rightIndex] || '';
  rightSide.appendChild(rightImg);

  sheet.appendChild(leftSide);
  sheet.appendChild(rightSide);

  // elemento que hará la animación 3D cuando se pase la página
  const pageTurn = document.createElement('div');
  pageTurn.className = 'page-turn';

  const faceFront = document.createElement('div');
  faceFront.className = 'face front';
  const fImg = document.createElement('img');
  fImg.style.width = '100%'; fImg.style.height = '100%'; fImg.style.objectFit = 'cover';
  // por defecto frontal será la derecha (al avanzar)
  faceFront.appendChild(fImg);

  const faceBack = document.createElement('div');
  faceBack.className = 'face back';
  const bImg = document.createElement('img');
  bImg.style.width = '100%'; bImg.style.height = '100%'; bImg.style.objectFit = 'cover';
  faceBack.appendChild(bImg);

  pageTurn.appendChild(faceFront);
  pageTurn.appendChild(faceBack);

  // sombra
  const shadow = document.createElement('div');
  shadow.className = 'page-shadow';

  book.appendChild(sheet);
  book.appendChild(pageTurn);
  book.appendChild(shadow);

  // actualizar pager
  curSpreadEl.textContent = spreadIndex;
}

// llamada inicial
renderSpread(curSpread);

// UTIL: reproducir sonido (con try por autoplay policies)
function playSound(){
  try{ pageSound.currentTime = 0; pageSound.play(); }catch(e){ /* ignora */ }
}

// Animación de flip
function animateFlip(direction){
  if(isAnimating) return;
  if(direction === 'next' && curSpread >= totalSpreads) return;
  if(direction === 'prev' && curSpread <= 1) return;

  isAnimating = true;

  const pageTurn = document.querySelector('.page-turn');
  const faceFrontImg = pageTurn.querySelector('.face.front img');
  const faceBackImg = pageTurn.querySelector('.face.back img');
  const shadow = document.querySelector('.page-shadow');

  const leftIdx = (curSpread - 1) * 2; // current left page file index

  if(direction === 'next'){
    // la hoja que girará muestra la página derecha (current spread)
    faceFrontImg.src = pageFiles[leftIdx+1] || '';
    faceBackImg.src  = pageFiles[leftIdx+2] || '';

    // posicionar pageTurn en la mitad derecha
    pageTurn.style.left = '50%';
    pageTurn.style.transformOrigin = 'left center';

    // iniciar animación manualmente con requestAnimationFrame para suavizar
    pageTurn.style.transition = 'transform 700ms cubic-bezier(.2,.8,.2,1)';
    pageTurn.style.transform = 'rotateY(0deg)';
    shadow.style.opacity = '0.0';

    // pequeña espera para aplicar
    requestAnimationFrame(()=>{
      shadow.style.opacity = '1';
      pageTurn.style.transform = 'rotateY(-180deg)';
    });

    // sonido
    playSound();

    setTimeout(()=>{
      curSpread++;
      renderSpread(curSpread);
      isAnimating = false;
    }, 720);

  } else {
    // prev
    const prevLeftIdx = (curSpread - 2) * 2; // left index of previous spread
    faceFrontImg.src = pageFiles[prevLeftIdx+1] || '';
    faceBackImg.src  = pageFiles[prevLeftIdx] || '';

    // posicionar pageTurn en la mitad izquierda y girar inverso
    pageTurn.style.left = '0%';
    pageTurn.style.transformOrigin = 'left center';

    pageTurn.style.transition = 'transform 700ms cubic-bezier(.2,.8,.2,1)';
    pageTurn.style.transform = 'rotateY(-180deg)';
    shadow.style.opacity = '0';

    requestAnimationFrame(()=>{
      shadow.style.opacity = '1';
      pageTurn.style.transform
