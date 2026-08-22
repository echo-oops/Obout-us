/**
 * js/details-slider.js
 * Infinite carousel: 3 visible slides, centered viewport.
 * - клонирование крайних слайдов для бесшовного цикла
 * - автопрокрутка
 * - prev/next, точки, swipe/drag
 * - корректный пересчёт на resize
 *
 * Улучшенная и надёжная версия: сброс клонов, сохранение оригиналов,
 * корректная обработка transition, доступность (ARIA), drag, keyboard.
 */
(function () {
  'use strict';

  const ROOT_ID = 'detailsSlider';
  const AUTOPLAY = true;
  const AUTOPLAY_INTERVAL = 3200;
  const RESIZE_DEBOUNCE = 120;

  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  const viewport = root.querySelector('.slider-viewport');
  const track = root.querySelector('.slider-track');
  const prevBtn = root.querySelector('.slider-btn.prev');
  const nextBtn = root.querySelector('.slider-btn.next');
  const dotsContainer = root.querySelector('.slider-dots');

  // snapshot of original slides (clones will be created from these)
  const originalNodes = Array.from(track.children).map(n => n.cloneNode(true));
  const originalCount = originalNodes.length;

  let visibleCount = getVisibleCount();
  let clonesPrepended = 0;
  let clonesAppended = 0;
  let slidesAll = []; // live node list after cloning
  let currentIndex = 0; // index within slidesAll
  let slideWidth = 0;
  let isTransitioning = false;
  let autoplayTimer = null;

  /* utility: debounce */
  function debounce(fn, ms) {
    let t = null;
    return function (...args) {
      if (t) clearTimeout(t);
      t = setTimeout(() => { fn(...args); t = null; }, ms);
    };
  }

  function getVisibleCount() {
    const v = getComputedStyle(root).getPropertyValue('--slide-visible');
    return Math.max(1, parseInt(v, 10) || 3);
  }

  /* Create clones: prepend last N and append first N */
  function createClones(n) {
    // reset counters
    clonesPrepended = 0;
    clonesAppended = 0;

    // remove existing clones if any
    Array.from(track.querySelectorAll('.__clone')).forEach(node => node.remove());

    // ensure track contains only originals (rebuild from snapshot)
    track.innerHTML = '';
    originalNodes.forEach(node => track.appendChild(node.cloneNode(true)));

    const originals = Array.from(track.children);

    // append clones of first n
    for (let i = 0; i < n; i++) {
      const clone = originals[i].cloneNode(true);
      clone.classList.add('__clone');
      track.appendChild(clone);
      clonesAppended++;
    }
    // prepend clones of last n (reverse order)
    for (let i = n - 1; i >= 0; i--) {
      const clone = originals[originals.length - 1 - i].cloneNode(true);
      clone.classList.add('__clone');
      track.insertBefore(clone, track.firstChild);
      clonesPrepended++;
    }
  }

  function updateSlidesList() {
    slidesAll = Array.from(track.children);
  }

  function measure() {
    slideWidth = 0;
    const first = track.querySelector('.slide');
    if (!first) return;
    const gapRaw = getComputedStyle(track).gap || '0';
    const gap = parseFloat(gapRaw) || 0;
    const rect = first.getBoundingClientRect();
    slideWidth = rect.width + gap;
  }

  function updateDots() {
    if (!dotsContainer) return;
    const btns = Array.from(dotsContainer.children);
    if (!btns.length) return;
    const logical = ((currentIndex - clonesPrepended) % originalCount + originalCount) % originalCount;
    btns.forEach((b, i) => {
      const active = i === logical;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
      b.setAttribute('tabindex', active ? '0' : '-1');
    });
  }

  function updateAriaHidden() {
    slidesAll.forEach((s, i) => s.setAttribute('aria-hidden', i === currentIndex ? 'false' : 'true'));
  }

  function setPosition(index, animate = true) {
    if (!slidesAll.length) return;
    const translateX = -index * slideWidth;
    if (!animate) {
      track.style.transition = 'none';
      track.style.transform = `translateX(${translateX}px)`;
      void track.offsetWidth; // force reflow
      track.style.transition = '';
      currentIndex = index;
      updateDots();
      updateAriaHidden();
      isTransitioning = false;
    } else {
      track.style.transform = `translateX(${translateX}px)`;
    }
  }

  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    if (!track.id) track.id = `${ROOT_ID}-track`;

    for (let i = 0; i < originalCount; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slider-dot';
      btn.setAttribute('aria-label', `Перейти к слайду ${i + 1}`);
      btn.setAttribute('aria-controls', track.id);
      btn.dataset.logical = String(i);
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('tabindex', '-1');

      btn.addEventListener('click', () => {
        const target = clonesPrepended + i;
        goToIndex(target, true);
        restartAutoplay();
        btn.focus();
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const target = clonesPrepended + i;
          goToIndex(target, true);
          restartAutoplay();
        }
      });

      dotsContainer.appendChild(btn);
    }
    updateDots();
  }

  function goToIndex(idx, animate = true) {
    if (isTransitioning) return;
    // set flag only for animated transitions
    isTransitioning = !!animate;
    setPosition(idx, animate);
    if (animate) currentIndex = idx;
  }

  function next() {
    if (!slidesAll.length) return;
    goToIndex(currentIndex + 1, true);
  }
  function prev() {
    if (!slidesAll.length) return;
    goToIndex(currentIndex - 1, true);
  }

  // transitionend: handle loop jumps and update state
  track.addEventListener('transitionend', (e) => {
    if (e.propertyName && e.propertyName !== 'transform') return;

    // if we've moved into appended clones
    if (currentIndex >= clonesPrepended + originalCount) {
      const overflow = currentIndex - (clonesPrepended + originalCount);
      currentIndex = clonesPrepended + overflow;
      setPosition(currentIndex, false);
    }
    // if we've moved into prepended clones
    if (currentIndex < clonesPrepended) {
      const underflow = (currentIndex - clonesPrepended + originalCount) % originalCount;
      currentIndex = clonesPrepended + underflow;
      setPosition(currentIndex, false);
    }

    isTransitioning = false;
    updateDots();
    updateAriaHidden();
  });

  /* Autoplay */
  function startAutoplay() {
    if (!AUTOPLAY) return;
    if (autoplayTimer) return;
    autoplayTimer = setInterval(() => next(), AUTOPLAY_INTERVAL);
  }
  function stopAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }
  function restartAutoplay() { stopAutoplay(); startAutoplay(); }

  /* getCurrentTranslate using DOMMatrix with fallback */
  function getCurrentTranslate() {
    const s = getComputedStyle(track).transform;
    if (!s || s === 'none') return 0;
    try {
      const m = new DOMMatrixReadOnly(s);
      return m.m41 || 0;
    } catch (err) {
      const m = s.match(/matrix\(([^,]+),[^,]+,[^,]+,[^,]+,([^,]+),[^)]+\)/);
      if (m && m[2]) return parseFloat(m[2]) || 0;
      const m3 = s.match(/matrix3d\(([^)]+)\)/);
      if (m3) {
        const parts = m3[1].split(',');
        return parseFloat(parts[12]) || 0;
      }
      return 0;
    }
  }

  /* Drag / swipe */
  function initDrag() {
    let dragging = false;
    let startX = 0;
    let startTranslate = 0;

    function toX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }

    function onDown(e) {
      if (e.type === 'mousedown' && e.button !== 0) return;
      dragging = true;
      stopAutoplay();
      startX = toX(e);
      startTranslate = getCurrentTranslate();
      track.style.transition = 'none';
      if (e.type === 'mousedown') e.preventDefault(); // prevent text selection

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: true });
      document.addEventListener('touchend', onUp);
    }

    function onMove(e) {
      if (!dragging) return;
      const x = toX(e);
      const dx = x - startX;
      track.style.transform = `translateX(${startTranslate + dx}px)`;
    }

    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      const endX = toX(e);
      const dx = endX - startX;
      const threshold = (slideWidth || 1) / 4;
      track.style.transition = '';
      if (dx < -threshold) {
        next();
      } else if (dx > threshold) {
        prev();
      } else {
        setPosition(currentIndex, true);
      }
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      restartAutoplay();
    }

    viewport.addEventListener('mousedown', onDown);
    viewport.addEventListener('touchstart', onDown, { passive: true });
  }

  /* Keyboard navigation */
  function initKeyboard() {
    root.tabIndex = 0;
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { prev(); restartAutoplay(); }
      if (e.key === 'ArrowRight') { next(); restartAutoplay(); }
      if (e.key === 'Home') { goToIndex(clonesPrepended, true); restartAutoplay(); }
      if (e.key === 'End') { goToIndex(clonesPrepended + originalCount - 1, true); restartAutoplay(); }
    });
  }

  /* Resize handler */
  const onResize = debounce(() => {
    visibleCount = getVisibleCount();

    // rebuild track from original snapshot
    track.innerHTML = '';
    originalNodes.forEach(n => track.appendChild(n.cloneNode(true)));

    createClones(visibleCount);
    updateSlidesList();
    measure();

    currentIndex = clonesPrepended;
    setPosition(currentIndex, false);
    buildDots();
  }, RESIZE_DEBOUNCE);

  /* Init */
  function init() {
    visibleCount = getVisibleCount();

    createClones(visibleCount);
    updateSlidesList();
    measure();

    currentIndex = clonesPrepended;
    setPosition(currentIndex, false);

    buildDots();

    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); prevBtn.focus(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAutoplay(); nextBtn.focus(); });

    initDrag();
    initKeyboard();

    window.addEventListener('resize', onResize);

    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    root.addEventListener('focusin', stopAutoplay);
    root.addEventListener('focusout', startAutoplay);

    startAutoplay();
  }

  // run init
  init();

})();
