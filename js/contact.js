// js/contact.js
// Улучшенная версия: валидация формы, отправка (симуляция), анимации карточек и FAQ-аккордеон.

document.addEventListener('DOMContentLoaded', () => {
  try {
    ContactModule.init();
  } catch (err) {
    console.error('ContactModule init error:', err);
  }
});

const ContactModule = (function () {
  let initialized = false;

  return {
    init
  };

  function init() {
    if (initialized) return;
    initialized = true;

    initForm();
    initCardAnimations();
    initFAQ();
  }

  /* ===========================
     Form: validation and submit
     =========================== */
  function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const subject = form.querySelector('#subject');
    const contactMethodRadios = Array.from(form.querySelectorAll('input[name="contactMethod"]'));
    const contactInfo = form.querySelector('#contactInfo');
    const message = form.querySelector('#message');
    const submitBtn = form.querySelector('#submitBtn');
    const clearBtn = form.querySelector('#clearBtn');
    const statusEl = form.querySelector('#formStatus');

    const errors = {
      subject: form.querySelector('#subjectError'),
      contactMethod: form.querySelector('#contactMethodError'),
      contactInfo: form.querySelector('#contactInfoError'),
      message: form.querySelector('#messageError')
    };

    // initial state
    submitBtn.disabled = true;
    clearErrorMessages();

    // Event listeners
    subject?.addEventListener('input', quickValidate);
    contactInfo?.addEventListener('input', onContactInfoInput);
    message?.addEventListener('input', quickValidate);
    contactMethodRadios.forEach(r => r.addEventListener('change', onContactMethodChange));

    clearBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      form.reset();
      clearErrorMessages();
      submitBtn.disabled = true;
      showStatus('Форма очищена', 'info');
      subject?.focus();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrorMessages();
      if (!validateForm()) {
        showStatus('Пожалуйста, исправьте ошибки в форме', 'error');
        shake(form);
        return;
      }
      await submitForm();
    });

    // Quick presence check to enable/disable submit
    function quickValidate() {
      const ok = Boolean(
        subject && subject.value.trim() &&
        contactMethodRadios.some(r => r.checked) &&
        contactInfo && contactInfo.value.trim() &&
        message && message.value.trim().length >= 10
      );
      submitBtn.disabled = !ok;
      return ok;
    }

    // Detailed validation
    function validateForm() {
      let valid = true;

      if (!subject || !subject.value.trim()) {
        showError('subject', 'Выберите тему письма');
        valid = false;
      }

      const selectedMethod = contactMethodRadios.find(r => r.checked);
      if (!selectedMethod) {
        showError('contactMethod', 'Выберите способ связи');
        valid = false;
      }

      const info = contactInfo ? contactInfo.value.trim() : '';
      if (!info) {
        showError('contactInfo', 'Введите контактные данные');
        valid = false;
      } else if (selectedMethod) {
        const method = selectedMethod.value;
        if (method === 'email' && !isEmail(info)) {
          showError('contactInfo', 'Введите корректный email');
          valid = false;
        } else if (method === 'telegram' && !isTelegram(info)) {
          showError('contactInfo', 'Введите Telegram в формате @username');
          valid = false;
        } else if (method === 'instagram' && !isInstagram(info)) {
          showError('contactInfo', 'Введите Instagram в формате @username');
          valid = false;
        }
      }

      if (!message || message.value.trim().length < 10) {
        showError('message', 'Сообщение должно содержать минимум 10 символов');
        valid = false;
      }

      submitBtn.disabled = !valid;
      return valid;
    }

    // Contact info live validation and visual hint
    function onContactInfoInput() {
      const selected = contactMethodRadios.find(r => r.checked);
      if (!selected) return;
      const val = contactInfo.value.trim();
      if (!val) {
        contactInfo.style.borderColor = '';
        contactInfo.style.backgroundColor = '';
        quickValidate();
        return;
      }
      let ok = false;
      switch (selected.value) {
        case 'email': ok = isEmail(val); break;
        case 'telegram': ok = isTelegram(val); break;
        case 'instagram': ok = isInstagram(val); break;
        default: ok = true;
      }
      contactInfo.style.borderColor = ok ? '#10b981' : '#ef4444';
      contactInfo.style.backgroundColor = ok ? '#f0fdf4' : '#fff1f2';
      quickValidate();
    }

    function onContactMethodChange() {
      const selected = contactMethodRadios.find(r => r.checked);
      if (!selected) return;
      const placeholders = {
        email: 'Введите ваш email адрес',
        telegram: 'Введите ваш Telegram (например: @username)',
        instagram: 'Введите ваш Instagram (например: @username)'
      };
      contactInfo.placeholder = placeholders[selected.value] || 'Введите контактные данные';
      contactInfo.dispatchEvent(new Event('input'));
    }

    // Submit (simulated)
    async function submitForm() {
      try {
        submitBtn.disabled = true;
        const prevText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        showStatus('Отправка сообщения...', 'info');

        const payload = {
          subject: subject?.value || '',
          contactMethod: contactMethodRadios.find(r => r.checked)?.value || '',
          contactInfo: contactInfo?.value || '',
          message: message?.value || '',
          ts: new Date().toISOString()
        };

        await simulateNetwork(payload);

        showStatus('Сообщение успешно отправлено. Спасибо!', 'success');
        form.reset();
        submitBtn.disabled = true;
        submitBtn.textContent = prevText;
        subject?.focus();
      } catch (err) {
        console.error('Submit error:', err);
        showStatus('Ошибка при отправке. Попробуйте позже.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
      }
    }

    // Helpers
    function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    function isTelegram(v) { return /^@[a-zA-Z0-9_]{5,32}$/.test(v); }
    function isInstagram(v) { return /^@[a-zA-Z0-9._]{1,30}$/.test(v); }

    function showError(key, text) {
      const el = errors[key];
      if (!el) return;
      el.textContent = text;
      el.style.display = 'block';
      el.setAttribute('aria-hidden', 'false');
    }

    function clearErrorMessages() {
      Object.values(errors).forEach(el => {
        if (!el) return;
        el.textContent = '';
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      });
    }

    function showStatus(text, type = 'info') {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = `form-status ${type}`;
      statusEl.setAttribute('aria-live', 'polite');
      if (type === 'info' || type === 'success') {
        clearTimeout(showStatus._t);
        showStatus._t = setTimeout(() => {
          statusEl.textContent = '';
          statusEl.className = 'form-status';
        }, 5000);
      }
    }

    function shake(node) {
      node.classList.add('form-shake');
      setTimeout(() => node.classList.remove('form-shake'), 500);
    }

    function simulateNetwork(data) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('Simulated payload:', data);
          Math.random() > 0.08 ? resolve(data) : reject(new Error('Simulated network error'));
        }, 900);
      });
    }
  }

  /* ===========================
     Card animations (IntersectionObserver)
     =========================== */
  function initCardAnimations() {
    const cards = document.querySelectorAll('.contact-card');
    if (!cards.length) return;

    if (!('IntersectionObserver' in window)) {
      cards.forEach(c => {
        c.style.opacity = '1';
        c.style.transform = 'translateY(0)';
      });
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (!prefersReduced) {
          setTimeout(() => {
            el.classList.add('contact-card-float');
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, idx * 80);
        } else {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
        observer.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    cards.forEach(c => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(24px)';
      c.style.transition = prefersReduced ? 'none' : 'all 0.56s cubic-bezier(.2,.9,.3,1)';
      observer.observe(c);

      c.addEventListener('mouseenter', () => {
        c.style.transform = 'translateY(-8px) scale(1.02)';
        c.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
      });
      c.addEventListener('mouseleave', () => {
        c.style.transform = 'translateY(0) scale(1)';
        c.style.boxShadow = '';
      });
    });
  }

  /* ===========================
     FAQ accordion (accessible)
     =========================== */
  function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
      const btn = item.querySelector('.faq-question');
      const panelId = btn?.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : item.querySelector('.faq-answer');

      if (!btn || !panel) return;

      // Ensure button semantics
      if (btn.tagName.toLowerCase() !== 'button') {
        btn.setAttribute('role', 'button');
        btn.tabIndex = 0;
      }

      btn.setAttribute('aria-expanded', 'false');
      panel.hidden = true;

      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        // Close others (only one open)
        items.forEach(other => {
          const otherBtn = other.querySelector('.faq-question');
          const otherPanelId = otherBtn?.getAttribute('aria-controls');
          const otherPanel = otherPanelId ? document.getElementById(otherPanelId) : other.querySelector('.faq-answer');
          if (!otherBtn || !otherPanel) return;
          otherBtn.setAttribute('aria-expanded', 'false');
          otherPanel.hidden = true;
          other.classList.remove('active');
        });

        const willOpen = !expanded;
        btn.setAttribute('aria-expanded', String(willOpen));
        panel.hidden = !willOpen;
        item.classList.toggle('active', willOpen);
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }
})();
