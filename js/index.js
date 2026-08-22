// index.js — интерактив и мелкие улучшения для index.html
document.addEventListener('DOMContentLoaded', () => {
  adjustHeroPadding();
  ensureButtonsLayout();
  animateSkillCards();
  enableKeyboardFocus();
  adjustProfileForViewport();

  // Подстраиваем при изменении размера окна
  window.addEventListener('resize', () => {
    adjustHeroPadding();
    adjustProfileForViewport();
  });
});

/* Уменьшаем вертикальные отступы hero на очень маленьких экранах */
function adjustHeroPadding() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  if (window.innerHeight < 640) {
    hero.style.paddingTop = '48px';
    hero.style.paddingBottom = '36px';
  } else {
    hero.style.paddingTop = '';
    hero.style.paddingBottom = '';
  }
}

/* Гарантируем компактное расположение кнопок и отключаем длинную линию */
function ensureButtonsLayout() {
  const heroButtons = document.querySelector('.hero-buttons');
  if (!heroButtons) return;
  // Убираем класс, который включает длинную линию, если он случайно добавлен
  heroButtons.classList.remove('with-line');
  // Если нужно, можно явно прижать кнопки к левому краю
  heroButtons.style.justifyContent = 'flex-start';
  heroButtons.style.gap = '0.32rem';
}

/* Анимация появления карточек навыков (плавная последовательная) */
function animateSkillCards() {
  const cards = document.querySelectorAll('.skill-card');
  if (!cards || cards.length === 0) return;

  // Если поддерживается IntersectionObserver — используем его для производительности
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.transition = 'opacity 420ms ease, transform 420ms ease';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12 });

    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(8px)';
      // Небольшая задержка для последовательного эффекта
      card.style.transitionDelay = `${i * 70}ms`;
      io.observe(card);
    });
  } else {
    // Фоллбек: простая последовательная анимация
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(8px)';
      setTimeout(() => {
        card.style.transition = 'opacity 420ms ease, transform 420ms ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 80 * i);
    });
  }
}

/* Улучшение видимости фокуса для клавиатурной навигации */
function enableKeyboardFocus() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.documentElement.classList.add('user-is-tabbing');
    }
  });
}

/* Подгоняем подпись под картинкой на узких экранах, чтобы не перекрывалась */
function adjustProfileForViewport() {
  const profileInfo = document.querySelector('.profile-info');
  const profileImg = document.querySelector('.profile-img');
  if (!profileInfo || !profileImg) return;

  if (window.innerWidth < 420) {
    // чуть уменьшить картинку и дать место подписи
    profileImg.style.width = '220px';
    profileImg.style.height = '220px';
    profileInfo.style.maxWidth = '240px';
    profileInfo.style.bottom = '8px';
  } else {
    profileImg.style.width = '';
    profileImg.style.height = '';
    profileInfo.style.maxWidth = '';
    profileInfo.style.bottom = '';
  }
}
