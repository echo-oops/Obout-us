/**
 * js/portfolio.js
 * Handles:
 *  - "Read more" / collapse for project descriptions
 *  - Portfolio filters with ARIA and keyboard support
 *  - Small accessibility helpers (skip link focus, safe external links)
 *
 * Assumes HTML structure from portfolio.html and that details-slider.js
 * manages the carousel separately.
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ======================================================
     1. READ MORE / COLLAPSE (preserve HTML, accessible)
  ====================================================== */
  (function initReadMore() {
    const descBlocks = Array.from(document.querySelectorAll('.portfolio-desc-block'));

    if (!descBlocks.length) return;

    descBlocks.forEach((desc) => {
      // Keep original HTML
      const fullHTML = desc.innerHTML.trim();
      const plainText = desc.textContent.trim();

      // If short enough, skip
      if (plainText.length <= 140) return;

      // Try to split into sentences; fallback to character trim
      let shortText = '';
      const sentences = plainText.match(/(.+?[.!?])(\s|$)/g);
      if (sentences && sentences.length >= 2) {
        shortText = sentences.slice(0, 2).join(' ').trim();
      } else {
        shortText = plainText.slice(0, 140).trim();
        shortText = shortText.replace(/\s+[^\s]*$/, ''); // avoid cutting last word
      }
      shortText += '…';

      // Store both variants (full HTML and short HTML-safe)
      desc.dataset.full = fullHTML;
      desc.dataset.short = `<p>${escapeHtml(shortText)}</p>`;

      // Apply short version
      desc.innerHTML = desc.dataset.short;
      desc.classList.add('collapsed');

      // Create toggle button
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'read-more-btn';
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Ещё';

      btn.addEventListener('click', () => {
        const expanded = btn.classList.toggle('open');
        if (expanded) {
          desc.innerHTML = desc.dataset.full;
          desc.classList.remove('collapsed');
          btn.textContent = 'Скрыть';
          btn.setAttribute('aria-expanded', 'true');
        } else {
          desc.innerHTML = desc.dataset.short;
          desc.classList.add('collapsed');
          btn.textContent = 'Ещё';
          btn.setAttribute('aria-expanded', 'false');
        }
      });

      // Insert button after description
      desc.after(btn);
    });

    // Helper: escape HTML for short snippet
    function escapeHtml(str) {
      return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m]));
    }
  })();


  /* ======================================================
     2. FILTERS (ARIA, tabindex, keyboard navigation)
     - role="tablist" expected on container
     - each .filter-btn is role="tab"
  ====================================================== */
  (function initFilters() {
    const tablist = document.querySelector('.filter-buttons[role="tablist"]');
    if (!tablist) return;

    const tabs = Array.from(tablist.querySelectorAll('.filter-btn'));
    const items = Array.from(document.querySelectorAll('.portfolio-item'));

    if (!tabs.length) return;

    // Initialize ARIA and tabindex
    tabs.forEach((tab, idx) => {
      tab.setAttribute('role', 'tab');
      const active = tab.classList.contains('active');
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.setAttribute('tabindex', active ? '0' : '-1');

      tab.addEventListener('click', () => applyFilter(tab));
      tab.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            focusTab((idx + 1) % tabs.length);
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            focusTab((idx - 1 + tabs.length) % tabs.length);
            break;
          case 'Home':
            e.preventDefault();
            focusTab(0);
            break;
          case 'End':
            e.preventDefault();
            focusTab(tabs.length - 1);
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            applyFilter(tab);
            break;
        }
      });
    });

    function applyFilter(activeTab) {
      const filter = activeTab.dataset.filter || 'all';

      tabs.forEach((t) => {
        const isActive = t === activeTab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        t.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      items.forEach((it) => {
        const cat = it.dataset.category || '';
        if (filter === 'all' || cat === filter) {
          it.style.display = 'flex';
          it.removeAttribute('aria-hidden');
        } else {
          it.style.display = 'none';
          it.setAttribute('aria-hidden', 'true');
        }
      });
    }

    function focusTab(index) {
      const t = tabs[index];
      if (!t) return;
      t.focus();
    }
  })();


  /* ======================================================
     3. ACCESSIBILITY & SMALL HELPERS
     - ensure external links open safely and have rel attributes
     - skip link focus behavior already in HTML; ensure main can be focused
  ====================================================== */
  (function smallHelpers() {
    // Ensure external links with target="_blank" have rel attributes
    const external = Array.from(document.querySelectorAll('a[target="_blank"]'));
    external.forEach((a) => {
      const rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if (!rel.includes('noopener')) rel.push('noopener');
      if (!rel.includes('noreferrer')) rel.push('noreferrer');
      a.setAttribute('rel', rel.join(' '));
    });

    // Make skip link visible on focus (if custom CSS not present)
    const skip = document.querySelector('.skip-link');
    if (skip) {
      skip.addEventListener('click', (e) => {
        const target = document.querySelector(skip.getAttribute('href'));
        if (target) {
          target.focus({ preventScroll: false });
        }
      });
    }
  })();

  /* ======================================================
     4. LIGHT SAFETY CHECKS
     - ensure portfolio grid has at least one item visible
  ====================================================== */
  (function safetyChecks() {
    const grid = document.querySelector('.portfolio-grid');
    if (!grid) return;
    const visible = grid.querySelectorAll('.portfolio-item:not([aria-hidden="true"])');
    if (!visible.length) {
      // If nothing visible (edge case), show all
      const items = grid.querySelectorAll('.portfolio-item');
      items.forEach(it => {
        it.style.display = 'flex';
        it.removeAttribute('aria-hidden');
      });
      const firstTab = document.querySelector('.filter-btn');
      if (firstTab) {
        firstTab.classList.add('active');
        firstTab.setAttribute('aria-selected', 'true');
        firstTab.setAttribute('tabindex', '0');
      }
    }
  })();

});
