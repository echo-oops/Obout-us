// ./js/header.js — надежная загрузка header и инициализация
document.addEventListener('DOMContentLoaded', function () {
  const target = document.getElementById('header');

  const candidates = [
    'header.html',
    './header.html',
    '/header.html',
    '../header.html'
  ];

  // Попробовать последовательные пути + cache-bust
  (async function tryLoad() {
    for (const p of candidates) {
      try {
        const res = await fetch(p + '?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const html = await res.text();
        if (target) target.innerHTML = html;
        else document.body.insertAdjacentHTML('afterbegin', html);
        initHeader(); // инициализация после вставки
        return;
      } catch (e) {
        // silent continue — попробуем следующий путь
        // но логируем в консоль для отладки
        console.debug('header fetch failed for', p, e.message || e);
      }
      // В конце tryLoad failure
      if (target) {
        target.innerHTML = '<nav class="navbar"><div class="nav-container"><div class="nav-logo"><h2>Портфолио</h2></div><ul class="nav-menu"><li><a href="index.html">Главная</a></li><li><a href="about.html">Обо мне</a></li></ul></div></nav>';}

    }
    console.error('Не удалось загрузить header (попробуйте открыть DevTools -> Network).');
  })();
  

  // Инициализация UI (бургер, подсветка, aria)
  function initHeader() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        const expanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', String(!expanded));
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }

    // Активная ссылка — сравнение по абсолютному пути
    const links = document.querySelectorAll('.nav-link');
    const current = (new URL(location.href)).pathname.replace(/\/+$/, '');
    links.forEach(link => {
      try {
        const href = link.getAttribute('href');
        const linkPath = (new URL(href, location.href)).pathname.replace(/\/+$/, '');
        if (linkPath === current || (linkPath === '/index.html' && (current === '/' || current === '/index.html'))) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      } catch (e) {}
      // закрывать мобильное меню по клику
      link.addEventListener('click', () => {
        if (navMenu) navMenu.classList.remove('active');
        if (hamburger) {
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }
});
