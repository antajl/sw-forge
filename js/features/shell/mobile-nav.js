// js/features/shell/mobile-nav.js — mobile header tab menu
  function closeHeaderNavMenu() {
    const row = document.querySelector('.header-row--nav');
    const toggle = document.getElementById('header-nav-toggle');
    if (row) row.classList.remove('is-nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function initHeaderMobileNav() {
    const toggle = document.getElementById('header-nav-toggle');
    const row = document.querySelector('.header-row--nav');
    const panel = document.getElementById('main-tabs-panel');
    if (!toggle || !row || !panel) return;

    toggle.addEventListener('click', () => {
      const open = row.classList.toggle('is-nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    panel.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 720px)').matches) closeHeaderNavMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (!row.classList.contains('is-nav-open')) return;
      if (row.contains(e.target) || toggle.contains(e.target)) return;
      closeHeaderNavMenu();
    });

    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 721px)').matches) closeHeaderNavMenu();
    });
  }
