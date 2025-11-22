const config = {
  startPage: 24,
  endPage: 67,
  path: 'pages/a-',
  ext: '.png'
};

let flipbook = $('#flipbook');
let totalPages = config.endPage - config.startPage + 1;
let isAnimating = false;
let audioUnlocked = false;

const PAGE_RATIO = 0.758;

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
    let className = (i === 0 || i === images.length - 1) ? 'hard' : 'page';
    if (i > 0 && i < images.length - 1)
      className += (i % 2 === 0) ? ' odd' : ' even';
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
      start: function () {
        isAnimating = true;
        playSound('flip');
      },
      turned: function (e, page) {
        isAnimating = false;
        updateUI(page);
        fixCoverGeometry();
      },
      end: function () {
        isAnimating = false;
      }
    }
  });

  flipbook.animate({ opacity: 1 }, 500);
  updateUI(1);
  fixCoverGeometry();

  $('#prevBtn').click(() => {
    if (!isAnimating) flipbook.turn('previous');
  });
  $('#nextBtn').click(() => {
    if (!isAnimating) flipbook.turn('next');
  });
  $('#restartBtn').click(() => {
    if (!isAnimating) {
      playSound('restart');
      flipbook.turn('page', 1);
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
    fixCoverGeometry
