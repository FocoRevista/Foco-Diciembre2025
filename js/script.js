const config = {
  startPage: 24,
  endPage: 67,
  path: 'pages/a-',
  ext: '.png'
};

const PAGE_RATIO = 0.758;
let flipbook = $('#flipbook');
let totalPages = config.endPage - config.startPage + 1;
let isAnimating = false;
let audioUnlocked = false;

$(document).ready(function () {
  let images = [];
  for (let i = 0; i < totalPages; i++) {
    images.push(`${config.path}${config.startPage + i}${config.ext}`);
  }

  preloadImages(images).then(() => {
    initBook(images);
    $('.loader-container').fadeOut(500);
  });

  $(document).on('touchstart click', function () {
    if (!audioUnlocked) {
      unlockAudio();
      audioUnlocked = true;
    }
  });
});

function initBook(images) {
  images.forEach((src, i) => {
    let className = (i ===
