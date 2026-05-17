// ui-parts/04-main-tabs.js — slice of ui.monolith.bak.js L769-786
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
