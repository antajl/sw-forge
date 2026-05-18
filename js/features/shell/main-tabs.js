// js/features/shell/main-tabs.js — top-level tab switching
  // ===================== TABS =====================
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      showMainTab(btn.dataset.tab, { writeHash: true });
    });
  });

  window.addEventListener('hashchange', () => {
    const id = mainTabIdFromHash();
    if (id) showMainTab(id);
    else showMainTab('runes');
  });

  window.addEventListener('popstate', () => {
    const id = mainTabIdFromHash() || 'runes';
    showMainTab(id);
  });
