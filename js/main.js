// Основной JavaScript файл для портфолио

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация всех функций
    initNavigation();
    initScrollAnimations();
    initSkillBars();
    initFAQ();
    initFormValidation();
    initPortfolioFilter();
    initSmoothScroll();
});

// Навигация
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Закрытие меню при клике на ссылку
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Изменение стиля навбара при скролле
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// Анимации при скролле
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                
                // Анимация прогресс-баров навыков
                if (entry.target.classList.contains('skill-progress')) {
                    const width = entry.target.getAttribute('data-width');
                    entry.target.style.width = width;
                }
            }
        });
    }, observerOptions);
    
    // Наблюдение за элементами
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
    
    document.querySelectorAll('.skill-progress').forEach(el => {
        observer.observe(el);
    });
}

// Прогресс-бары навыков
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    skillBars.forEach(bar => {
        const width = bar.getAttribute('data-width');
        bar.style.width = '0%';
        
        // Анимация при появлении в viewport
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        bar.style.width = width;
                    }, 200);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(bar);
    });
}

// FAQ аккордеон
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Закрыть все другие элементы
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Переключить текущий элемент
            if (isActive) {
                item.classList.remove('active');
            } else {
                item.classList.add('active');
            }
        });
    });
}

// Валидация формы
function initFormValidation() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    const subject = document.getElementById('subject');
    const contactMethod = document.querySelectorAll('input[name="contactMethod"]');
    const contactInfo = document.getElementById('contactInfo');
    const message = document.getElementById('message');
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // Проверка заполненности полей
    function checkFormValidity() {
        const isSubjectValid = subject && subject.value.trim() !== '';
        const isContactMethodValid = Array.from(contactMethod).some(radio => radio.checked);
        const isContactInfoValid = contactInfo && contactInfo.value.trim() !== '';
        const isMessageValid = message && message.value.trim() !== '';
        
        if (isSubjectValid && isContactMethodValid && isContactInfoValid && isMessageValid) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-secondary');
            submitBtn.classList.add('btn-primary');
        } else {
            submitBtn.disabled = true;
            submitBtn.classList.remove('btn-primary');
            submitBtn.classList.add('btn-secondary');
        }
    }
    
    // Слушатели событий
    if (subject) subject.addEventListener('input', checkFormValidity);
    if (contactInfo) contactInfo.addEventListener('input', checkFormValidity);
    if (message) message.addEventListener('input', checkFormValidity);
    
    contactMethod.forEach(radio => {
        radio.addEventListener('change', checkFormValidity);
    });
    
    // Очистка формы
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            form.reset();
            checkFormValidity();
            clearErrorMessages();
        });
    }
    
    // Отправка формы
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (validateForm()) {
                submitForm();
            } else {
                showFormStatus('Пожалуйста, заполните все поля корректно', 'error');
            }
        });
    }
    
    // Валидация формы
    function validateForm() {
        let isValid = true;
        clearErrorMessages();
        
        if (!subject || subject.value.trim() === '') {
            showError('subjectError', 'Выберите тему письма');
            isValid = false;
        }
        
        const selectedMethod = Array.from(contactMethod).find(radio => radio.checked);
        if (!selectedMethod) {
            showError('contactMethodError', 'Выберите способ связи');
            isValid = false;
        }
        
        if (!contactInfo || contactInfo.value.trim() === '') {
            showError('contactInfoError', 'Введите контактные данные');
            isValid = false;
        }
        
        if (!message || message.value.trim() === '') {
            showError('messageError', 'Введите сообщение');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Показать ошибку
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    // Очистить ошибки
    function clearErrorMessages() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });
    }
    
    // Показать статус формы
    function showFormStatus(message, type) {
        const statusElement = document.getElementById('formStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `form-status ${type}`;
            statusElement.style.display = 'block';
            
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }
    }
    
    // Отправка формы (заглушка)
    function submitForm() {
        showFormStatus('Отправка...', 'info');
        
        // Здесь должна быть реальная отправка формы
        // Например, через EmailJS, Formspree или другой сервис
        
        setTimeout(() => {
            showFormStatus('Сообщение успешно отправлено!', 'success');
            form.reset();
            checkFormValidity();
        }, 2000);
    }
}

// Фильтр портфолио
function initPortfolioFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Обновить активную кнопку
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Фильтровать элементы
            portfolioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    item.style.display = 'block';
                    item.classList.add('portfolio-item-appear');
                } else {
                    item.style.display = 'none';
                    item.classList.remove('portfolio-item-appear');
                }
            });
        });
    });
}

// Плавный скролл
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Утилиты
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Ошибка:', e.error);
});

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', function(e) {
    console.error('Необработанная ошибка промиса:', e.reason);
});
