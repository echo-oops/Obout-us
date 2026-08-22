// js/about.js
// Обновлённый скрипт для about.html
// Функции:
//  - initImageFallback()       — обработка невалидных/упавших изображений
//  - initRevealAnimations()    — reveal-анимации с IntersectionObserver
//  - respectReducedMotion()    — учёт prefers-reduced-motion
//  - initProjectButtons()      — клавиатура + безопасность для ссылок "view-project"
//  - initProjectHighlighting() — подсветка карточек по data-* опциям

document.addEventListener('DOMContentLoaded', () => {
  try {
    respectReducedMotion(); // ставим раньше, чтобы animation/transitions были отключены при необходимости
    initImageFallback();
    initRevealAnimations();
    initProjectButtons();
    initProjectHighlighting();
  } catch (err) {
    // безопасно логируем ошибку, но не ломаем страницу
    // eslint-disable-next-line no-console
    console.error('about.js init error:', err);
  }
});

/* --------------------------- Image fallback --------------------------- */
function initImageFallback() {
  const imgs = Array.from(document.querySelectorAll('img'));

  imgs.forEach(img => {
    // If image already failed to load
    try {
      if (img.complete && img.naturalWidth === 0) {
        applyFallback(img);
      }
      img.addEventListener('error', () => applyFallback(img));
    } catch (e) {
      // ignore per-image errors
    }
  });

  function applyFallback(img) {
    if (!img || img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = '1';

    // hide the broken image but keep it in DOM for layout if needed
    img.style.display = 'none';

    // Prepare accessible label (use alt if available)
    const label = img.getAttribute('alt') ? `Изображение: ${img.getAttribute('alt')}` : 'Изображение недоступно';

    // Create wrapper element
    const wrapper = document.createElement('div');
    wrapper.className = 'img-fallback';
    wrapper.setAttribute('role', 'img');
    wrapper.setAttribute('aria-label', label);

    // Compute reasonable size based on rendered box or attributes
    const rect = img.getBoundingClientRect();
    const computed = getComputedStyle(img);
    const maxWidth = computed.maxWidth && computed.maxWidth !== 'none' ? computed.maxWidth : '320px';
    const width = (rect && rect.width) ? `${Math.round(rect.width)}px` : (img.getAttribute('width') || '100%');
    const height = (rect && rect.height) ? `${Math.round(rect.height || 220)}px` : (img.getAttribute('height') || '220px');

    // Inline styles to mimic original image box
    Object.assign(wrapper.style, {
      width: width === '100%' ? '100%' : width,
      maxWidth: maxWidth,
      height: height,
      borderRadius: computed.borderRadius || '12px',
      background: 'linear-gradient(135deg,#0f1114,#1b1d22)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(234,238,242,0.66)',
      fontSize: '0.95rem',
      border: '1px solid rgba(255,255,255,0.03)',
      boxShadow: '0 8px 26px rgba(0,0,0,0.35)',
      textAlign: 'center',
      padding: '12px',
      boxSizing: 'border-box'
    });

    // Add fallback content (keeps consistent language)
    wrapper.textContent = 'Изображение недоступно';

    // If image is inside a <picture>, append after picture, else after img
    const parent = img.parentNode;
    if (parent && parent.nodeName && parent.nodeName.toLowerCase() === 'picture') {
      parent.insertAdjacentElement('afterend', wrapper);
    } else {
      img.insertAdjacentElement('afterend', wrapper);
    }
  }
}

/* ------------------------ Reveal animations --------------------------- */
function initRevealAnimations() {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    // Make everything visible immediately
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => el.classList.add('is-visible'));
    return;
  }

  // Base selectors to convert into reveal elements if they aren't already
  const baseSelectors = ['.hero-text', '.about-content', '.timeline-item', '.project-card', '.approach-card', '.section-title'];
  const nodes = document.querySelectorAll(baseSelectors.join(', '));
  nodes.forEach(node => {
    if (!node.classList.contains('reveal') && !node.classList.contains('reveal-left') && !node.classList.contains('reveal-right')) {
      node.classList.add('reveal');
    }
  });

  // Stagger approach cards and project cards for nicer appearance
  document.querySelectorAll('.work-approach .approach-card').forEach((card, i) => {
    if (!card.classList.contains('reveal-right')) card.classList.add('reveal-right');
    card.classList.add('reveal-delay-' + ((i % 3) + 1));
  });
  document.querySelectorAll('.projects-grid .project-card').forEach((card, i) => {
    if (!card.classList.contains('reveal-right')) card.classList.add('reveal-right');
    card.classList.add('reveal-delay-' + ((i % 3) + 1));
  });

  // IntersectionObserver to add .is-visible when element enters viewport
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
      io.observe(el);
    });
  } else {
    // Fallback: reveal with timeouts
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el, idx) => {
      setTimeout(() => el.classList.add('is-visible'), 120 * idx);
    });
  }
}

/* ----------------------- Respect reduced motion ----------------------- */
function respectReducedMotion() {
  try {
    const prefers = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefers) return;

    // Make reveals visible and disable transitions/animations by inline style for highest priority
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => el.classList.add('is-visible'));
    // Also set inline style for all elements as last resort (keeps original behavior)
    document.querySelectorAll('*').forEach(el => {
      el.style.transition = 'none';
      el.style.animation = 'none';
    });
  } catch (e) {
    // no-op
  }
}

/* ------------------------ Project buttons ----------------------------- */
function initProjectButtons() {
  const viewBtns = Array.from(document.querySelectorAll('.view-project'));

  viewBtns.forEach(btn => {
    // If button is an anchor with href, default click already opens it.
    // We add keyboard handling for anchors and non-anchor elements alike.
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        activateProjectLink(btn);
      }
    });

    // If it's not an anchor (e.g. button), attach click to open target if data-href present
    btn.addEventListener('click', (ev) => {
      // allow normal anchor behaviour; for non-anchor open data-href or href
      const href = getHrefFromElement(btn);
      if (!href) return; // nothing to do
      // If it's anchor and has target, allow default; but to be safe open by script
      // This ensures consistent behavior across various setups
      ev.preventDefault();
      activateProjectLink(btn);
    });
  });

  function getHrefFromElement(el) {
    if (!el) return null;
    if (el.tagName && el.tagName.toLowerCase() === 'a') {
      return el.getAttribute('href');
    }
    // fallback: data-href
    return el.dataset && el.dataset.href ? el.dataset.href : null;
  }

  function activateProjectLink(el) {
    const href = getHrefFromElement(el);
    if (!href) return;
    try {
      window.open(href, '_blank', 'noopener,noreferrer');
    } catch (e) {
      // as fallback, change location (not ideal)
      window.location.href = href;
    }
  }
}

/* ---------------------- Project highlighting ------------------------- */
/*
 Behavior:
  - if .projects-grid has attribute data-auto-highlight="true" => add .highlight to all .project-card
  - otherwise, only cards that already have class "highlight" or data-highlight="true" remain highlighted
*/
function initProjectHighlighting() {
  try {
    const container = document.querySelector('.projects-grid');
    if (!container) return;

    // auto-highlight option
    const auto = container.dataset && (container.dataset.autoHighlight === 'true' || container.dataset.autoHighlight === '1');

    const cards = Array.from(container.querySelectorAll('.project-card'));
    if (auto) {
      cards.forEach(c => c.classList.add('highlight'));
      return;
    }

    // otherwise respect existing attributes/classes — no change required
    // But if some cards have data-highlight="true", ensure they have class highlight
    cards.forEach(c => {
      if (c.dataset && (c.dataset.highlight === 'true' || c.dataset.highlight === '1')) {
        c.classList.add('highlight');
      }
    });
  } catch (e) {
    // ignore
  }
}
