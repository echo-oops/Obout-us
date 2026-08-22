// footer.js — безопасная загрузка футера с fallback'ом
document.addEventListener('DOMContentLoaded', () => {
  const target = document.getElementById('footer');
  if (!target) return;

  const paths = [
    'footer.html',
    './footer.html',
    '/footer.html',
    '../footer.html'
  ];

  // Встроенный fallback HTML футера (на случай, если fetch не сработает)
  const fallbackFooter = `
    <footer class="footer" role="contentinfo">
      <div class="footer-bar container">
        <nav class="footer-nav" aria-label="Основная навигация">
          <a href="index.html">Главная</a>
          <a href="about.html">Обо мне</a>
          <a href="portfolio.html">Портфолио</a>
          <a href="contact.html">Контакты</a>
        </nav>

        <div class="footer-socials" aria-label="Социальные ссылки">
          <a href="mailto:dochimovbobur@gmail.com" aria-label="Email" class="social-link">
            <i class="fas fa-envelope" aria-hidden="true"></i>
          </a>

          <a href="https://t.me/echo_oops" target="_blank" rel="noopener noreferrer" aria-label="Telegram" class="social-link">
            <i class="fab fa-telegram-plane" aria-hidden="true"></i>
          </a>

          <a href="https://github.com/username" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="social-link">
            <i class="fab fa-github" aria-hidden="true"></i>
          </a>
        </div>
      </div>

      <div class="footer-bottom">
        © <span id="footer-year"></span> Портфолио. Все права защищены.
      </div>
    </footer>
  `;

  (async function loadFooter() {
    for (const path of paths) {
      try {
        const res = await fetch(path + '?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        const html = await res.text();
        target.innerHTML = html;
        initFooter();
        return;
      } catch (err) {
        // пробуем следующий путь
      }
    }

    // Если не удалось загрузить — используем fallback
    target.innerHTML = fallbackFooter;
    initFooter();
  })();

  function initFooter() {
    const year = document.getElementById('footer-year');
    if (year) year.textContent = '2025'; // фиксированный год по запросу
  }
});
