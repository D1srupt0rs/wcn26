const navLinks = document.querySelectorAll('.nav a, .mobile-menu-links a');
const sections = ['home', 'collection', 'how-it-works', 'faq'].map((id) => ({
  id,
  el: document.getElementById(id),
  link: document.querySelector(`.nav a[href="#${id}"], .mobile-menu-links a[href="#${id}"]`),
}));

const menuToggle = document.querySelector('.menu-toggle');
const menuClose = document.querySelector('.menu-close');
const mobileMenuPanel = document.querySelector('.mobile-menu-panel');
const mobileMenuBackdrop = document.querySelector('.mobile-menu-backdrop');

let menuScrollY = 0;

function lockPageScroll() {
  menuScrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${menuScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}

function unlockPageScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, menuScrollY);
}

function closeMobileMenu() {
  if (!menuToggle || !mobileMenuPanel) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  mobileMenuPanel.classList.remove('is-open');
  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.classList.remove('is-open');
    mobileMenuBackdrop.setAttribute('aria-hidden', 'true');
  }
  unlockPageScroll();
}

function openMobileMenu() {
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Close menu');
  mobileMenuPanel.classList.add('is-open');
  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.classList.add('is-open');
    mobileMenuBackdrop.setAttribute('aria-hidden', 'false');
  }
  lockPageScroll();
}

if (menuToggle && mobileMenuPanel) {
  menuToggle.addEventListener('click', () => {
    if (mobileMenuPanel.classList.contains('is-open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  mobileMenuPanel.querySelectorAll('.mobile-menu-links a, .mobile-menu-socials a').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  if (menuClose) {
    menuClose.addEventListener('click', closeMobileMenu);
  }

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener('click', closeMobileMenu);
  }
}

// Smooth scroll offset for fixed header
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 80;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// Active nav link on scroll
function setActiveNav() {
  const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 80;
  const scrollPos = window.scrollY + headerH + 80;

  let current = 'home';
  sections.forEach(({ id, el }) => {
    if (el && el.offsetTop <= scrollPos) current = id;
  });

  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

window.addEventListener('scroll', setActiveNav, { passive: true });
setActiveNav();

// Only one FAQ open at a time
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    }
  });
});

// Mobile collection carousel (infinite loop)
(function initCollectionCarousel() {
  const viewport = document.querySelector('.collection-cards-viewport');
  const track = document.querySelector('.collection-cards');
  const prevBtn = document.querySelector('.carousel-arrow--prev');
  const nextBtn = document.querySelector('.carousel-arrow--next');
  const mq = window.matchMedia('(max-width: 900px)');

  if (!viewport || !track) return;

  const originals = [...track.querySelectorAll('.nft-card:not(.nft-card--clone)')];
  if (originals.length === 0) return;

  const REAL_COUNT = originals.length;
  let clonesBuilt = false;
  let positionIndex = 1;
  let touchStartX = 0;
  let touchDeltaX = 0;
  let isAnimating = false;

  function isMobile() {
    return mq.matches;
  }

  function slideWidth() {
    return viewport.getBoundingClientRect().width;
  }

  function cloneCard(card) {
    const clone = card.cloneNode(true);
    clone.classList.add('nft-card--clone');
    clone.setAttribute('aria-hidden', 'true');
    return clone;
  }

  function buildClones() {
    if (clonesBuilt) return;

    const headClones = originals.slice(-2).reverse().map(cloneCard);
    const tailClones = originals.slice(0, 2).map(cloneCard);

    headClones.forEach((clone) => track.insertBefore(clone, track.firstChild));
    tailClones.forEach((clone) => track.appendChild(clone));

    clonesBuilt = true;
    positionIndex = 2;
  }

  function removeClones() {
    track.querySelectorAll('.nft-card--clone').forEach((el) => el.remove());
    clonesBuilt = false;
    positionIndex = 0;
  }

  function allSlides() {
    return [...track.querySelectorAll('.nft-card')];
  }

  function setPosition(pos, animate = true) {
    track.style.transition = animate ? 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none';
    track.style.transform = `translateX(-${pos * slideWidth()}px)`;
    positionIndex = pos;
  }

  function normalizePosition() {
    const maxIndex = REAL_COUNT + 1;
    if (positionIndex < 2) {
      setPosition(positionIndex + REAL_COUNT, false);
    } else if (positionIndex > maxIndex) {
      setPosition(positionIndex - REAL_COUNT, false);
    }
  }

  function applySlideSizes() {
    if (!isMobile()) {
      removeClones();
      allSlides().forEach((card) => {
        card.style.flexBasis = '';
        card.style.width = '';
        card.style.maxWidth = '';
      });
      track.style.transform = '';
      track.style.transition = '';
      isAnimating = false;
      return;
    }

    buildClones();
    const w = slideWidth();
    allSlides().forEach((card) => {
      card.style.flexBasis = `${w}px`;
      card.style.width = `${w}px`;
      card.style.maxWidth = `${w}px`;
    });
    setPosition(positionIndex, false);
  }

  function moveBy(step) {
    if (!isMobile() || isAnimating) return;
    isAnimating = true;
    setPosition(positionIndex + step, true);
  }

  track.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform' || e.target !== track) return;
    isAnimating = false;
    normalizePosition();
  });

  prevBtn?.addEventListener('click', () => moveBy(-1));
  nextBtn?.addEventListener('click', () => moveBy(1));

  viewport.addEventListener('touchstart', (e) => {
    if (!isMobile()) return;
    touchStartX = e.changedTouches[0].clientX;
    touchDeltaX = 0;
    track.style.transition = 'none';
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (!isMobile()) return;
    touchDeltaX = e.changedTouches[0].clientX - touchStartX;
    track.style.transform = `translateX(${-positionIndex * slideWidth() + touchDeltaX}px)`;
  }, { passive: true });

  viewport.addEventListener('touchend', () => {
    if (!isMobile()) return;
    if (Math.abs(touchDeltaX) > 40) {
      moveBy(touchDeltaX < 0 ? 1 : -1);
    } else {
      setPosition(positionIndex, true);
    }
  }, { passive: true });

  mq.addEventListener('change', applySlideSizes);
  window.addEventListener('resize', applySlideSizes);
  applySlideSizes();
})();
