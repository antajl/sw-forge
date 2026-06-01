// js/features/shell/main-tabs.js — top-level tab switching
  // ===================== TABS =====================
  initHeaderMobileNav();

  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      showMainTab(tabId, { writeHash: true });
      localStorage.setItem('swrm-last-tab', tabId);
    });
  });

  window.addEventListener('hashchange', () => {
    const id = mainTabIdFromHash();
    if (id) {
      showMainTab(id);
      localStorage.setItem('swrm-last-tab', id);
    } else {
      const lastTab = localStorage.getItem('swrm-last-tab') || 'runes';
      showMainTab(lastTab);
    }
  });

  window.addEventListener('popstate', () => {
    const id = mainTabIdFromHash();
    if (id) {
      showMainTab(id);
      localStorage.setItem('swrm-last-tab', id);
    } else {
      const lastTab = localStorage.getItem('swrm-last-tab') || 'runes';
      showMainTab(lastTab);
    }
  });
