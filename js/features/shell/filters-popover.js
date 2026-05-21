// js/features/shell/filters-popover.js — anchored filter panels (not centered dialog)
  function closeAllFiltersPopovers(exceptId) {
    document.querySelectorAll('.filters-popover').forEach((panel) => {
      if (exceptId && panel.id === exceptId) return;
      panel.hidden = true;
      panel.dataset.open = '0';
    });
    document.querySelectorAll('[data-filters-popover-btn]').forEach((btn) => {
      const panelId = btn.getAttribute('aria-controls');
      if (exceptId && panelId === exceptId) return;
      btn.setAttribute('aria-expanded', 'false');
      btn.closest('.filters-popover-host')?.classList.remove('is-open');
    });
  }

  function positionFiltersPopover(btn, panel) {
    if (!btn || !panel) return;
    const host = btn.closest('.filters-popover-host');
    if (host) {
      panel.style.position = '';
      panel.style.top = '';
      panel.style.left = '';
      panel.style.right = '';
      panel.style.width = '';
      return;
    }
    const r = btn.getBoundingClientRect();
    const gap = 6;
    const maxW = Math.min(360, window.innerWidth - 16);
    let left = r.left;
    if (left + maxW > window.innerWidth - 8) left = window.innerWidth - maxW - 8;
    if (left < 8) left = 8;
    panel.style.position = 'fixed';
    panel.style.top = `${Math.round(r.bottom + gap)}px`;
    panel.style.left = `${Math.round(left)}px`;
    panel.style.right = 'auto';
    panel.style.width = `${Math.round(maxW)}px`;
  }

  function bindFiltersPopover(btnId, panelId, opts) {
    const btn = document.getElementById(btnId);
    const panel = document.getElementById(panelId);
    if (!btn || !panel) return;
    const onClose = opts && typeof opts.onClose === 'function' ? opts.onClose : null;

    btn.setAttribute('data-filters-popover-btn', '1');
    if (!btn.hasAttribute('aria-controls')) btn.setAttribute('aria-controls', panelId);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = panel.hidden;
      closeAllFiltersPopovers(open ? panelId : null);
      if (open) {
        positionFiltersPopover(btn, panel);
        panel.hidden = false;
        panel.dataset.open = '1';
        btn.setAttribute('aria-expanded', 'true');
        btn.closest('.filters-popover-host')?.classList.add('is-open');
      }
    });

    panel.querySelectorAll('[data-filters-popover-close]').forEach((el) => {
      el.addEventListener('click', () => {
        panel.hidden = true;
        panel.dataset.open = '0';
        btn.setAttribute('aria-expanded', 'false');
        btn.closest('.filters-popover-host')?.classList.remove('is-open');
        if (onClose) onClose();
      });
    });

    panel.querySelectorAll('[data-filters-popover-done]').forEach((el) => {
      el.addEventListener('click', () => {
        panel.hidden = true;
        panel.dataset.open = '0';
        btn.setAttribute('aria-expanded', 'false');
        btn.closest('.filters-popover-host')?.classList.remove('is-open');
        if (onClose) onClose();
      });
    });
  }

  if (!window.__swrmFiltersPopoverDocBound) {
    window.__swrmFiltersPopoverDocBound = true;
    document.addEventListener('click', (e) => {
      if (e.target.closest('.filters-popover-host') || e.target.closest('.filters-popover')) return;
      document.querySelectorAll('.filters-popover[data-open="1"]').forEach((panel) => {
        const btn = document.querySelector(`[aria-controls="${panel.id}"]`);
        const onCloseAttr = panel.getAttribute('data-on-close');
        panel.hidden = true;
        panel.dataset.open = '0';
        if (btn) {
          btn.setAttribute('aria-expanded', 'false');
          btn.closest('.filters-popover-host')?.classList.remove('is-open');
        }
      });
    });
    window.addEventListener('resize', () => {
      document.querySelectorAll('.filters-popover[data-open="1"]').forEach((panel) => {
        const btnId = panel.getAttribute('data-anchor-btn');
        const btn = btnId ? document.getElementById(btnId) : document.querySelector(`[aria-controls="${panel.id}"]`);
        positionFiltersPopover(btn, panel);
      });
    });
  }
