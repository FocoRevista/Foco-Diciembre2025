/*
  Flipbook 3D Deluxe - script.js
  - Crea spreads desde a-24.png .. a-67.png
  - Drag-to-flip, click to flip, swipe en móvil
  - Zoom por doble clic, fullscreen, sonido
  - Precarga de imágenes
*/

const pageFiles = [];
for (let i = 24; i <= 67; i++) {
  pageFiles.push(`pages/a-${i}.png`);
}

const totalPages = pageFiles.length;
const totalSpreads = Math.ceil(totalPages / 2);

let curSpread = 1;
let isAnimating = false;
let dragState = null;

const book = document.getElementById("book");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const curSpreadEl = document.getElementById("curSpread");
const totalSpreadEl = document.getElementById("totalSpread");
const pageSound = document.getElementById("pageSound");
const zoomBtn = document.getElementById("zoomBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");

totalSpreadEl.textContent = totalSpreads;
curSpreadEl.textContent = curSpread;

// Precarga
function preloadImages(list) {
  list.forEach((src) => {
    const i = new Image();
    i.src = src;
  });
}
preloadImages(pageFiles);

// Render del spread
function renderSpread(spreadIndex) {
  book.innerHTML = "";

  const leftIndex = (spreadIndex - 1) * 2;
  const rightIndex = leftIndex + 1;

  const sheet = document.createElement("div");
  sheet.className = "sheet";

  const leftSide = document.createElement("div");
  leftSide.className = "side left";
  const leftImg = document.createElement("img");
  leftImg.src = pageFiles[leftIndex] || "";
  leftSide.appendChild(leftImg);

  const rightSide = document.createElement("div");
  rightSide.className = "side right";
  const rightImg = document.createElement("img");
  rightImg.src = pageFiles[rightIndex] || "";
  rightSide.appendChild(rightImg);

  sheet.appendChild(leftSide);
  sheet.appendChild(rightSide);

  const pageTurn = document.createElement("div");
  pageTurn.className = "page-turn";

  const faceFront = document.createElement("div");
  faceFront.className = "face front";
  const fImg = document.createElement("img");
  faceFront.appendChild(fImg);

  const faceBack = document.createElement("div");
  faceBack.className = "face back";
  const bImg = document.createElement("img");
  faceBack.appendChild(bImg);

  pageTurn.appendChild(faceFront);
  pageTurn.appendChild(faceBack);

  const shadow = document.createElement("div");
  shadow.className = "page-shadow";

  book.appendChild(sheet);
  book.appendChild(pageTurn);
  book.appendChild(shadow);

  curSpreadEl.textContent = spreadIndex;
}
renderSpread(curSpread);

// Sonido
function playSound() {
  try {
    pageSound.currentTime = 0;
    pageSound.play();
  } catch (e) {}
}

// Animación
function animateFlip(direction) {
  if (isAnimating) return;
  if (direction === "next" && curSpread >= totalSpreads) return;
  if (direction === "prev" && curSpread <= 1) return;

  isAnimating = true;

  const pageTurn = document.querySelector(".page-turn");
  const fImg = pageTurn.querySelector(".face.front img");
  const bImg = pageTurn.querySelector(".face.back img");
  const shadow = document.querySelector(".page-shadow");

  const leftIdx = (curSpread - 1) * 2;

  if (direction === "next") {
    fImg.src = pageFiles[leftIdx + 1] || "";
    bImg.src = pageFiles[leftIdx + 2] || "";

    pageTurn.style.left = "50%";
    pageTurn.style.transformOrigin = "left center";

    pageTurn.style.transition = "transform 700ms cubic-bezier(.2,.8,.2,1)";
    pageTurn.style.transform = "rotateY(0deg)";
    shadow.style.opacity = "0";

    requestAnimationFrame(() => {
      shadow.style.opacity = "1";
      pageTurn.style.transform = "rotateY(-180deg)";
    });

    playSound();

    setTimeout(() => {
      curSpread++;
      renderSpread(curSpread);
      isAnimating = false;
    }, 750);
  } else {
    const prevLeftIdx = (curSpread - 2) * 2;

    fImg.src = pageFiles[prevLeftIdx + 1] || "";
    bImg.src = pageFiles[prevLeftIdx] || "";

    pageTurn.style.left = "0%";
    pageTurn.style.transformOrigin = "left center";
    pageTurn.style.transition = "transform 700ms cubic-bezier(.2,.8,.2,1)";
    pageTurn.style.transform = "rotateY(-180deg)";
    shadow.style.opacity = "0";

    requestAnimationFrame(() => {
      shadow.style.opacity = "1";
      pageTurn.style.transform = "rotateY(0deg)";
    });

    playSound();

    setTimeout(() => {
      curSpread--;
      renderSpread(curSpread);
      isAnimating = false;
    }, 750);
  }
}

// Botones
nextBtn.onclick = () => animateFlip("next");
prevBtn.onclick = () => animateFlip("prev");

// Swipe móvil
let touchStartX = 0;
book.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
});
book.addEventListener("touchend", (e) => {
  const endX = e.changedTouches[0].clientX;
  if (endX - touchStartX > 80) animateFlip("prev");
  if (touchStartX - endX > 80) animateFlip("next");
});

// Zoom
let zoomed = false;
zoomBtn.onclick = toggleZoom;
book.ondblclick = toggleZoom;

function toggleZoom() {
  zoomed = !zoomed;
  book.style.transform = zoomed ? "scale(1.8)" : "scale(1)";
  book.style.cursor = zoomed ? "zoom-out" : "zoom-in";
}

// Fullscreen
fullscreenBtn.onclick = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};
