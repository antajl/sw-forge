// js/features/shell/donate-dialog.js — Donate modal (Boosty / Lava / crypto)
  function donateLinks() {
    const sw = window.SWRM || {};
    return {
      boosty: String(sw.DONATE_BOOSTY_URL || '').trim(),
      lava: String(sw.DONATE_LAVA_URL || '').trim(),
      crypto: String(sw.DONATE_CRYPTO_USDT_TRC20 || '').trim(),
    };
  }

  async function donateCopyText(text) {
    const s = String(text || '').trim();
    if (!s) return false;
    try {
      await navigator.clipboard.writeText(s);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = s;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e2) {
        return false;
      }
    }
  }

  function updateDonateDialogTexts() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en || {};
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el && text != null) el.textContent = text;
    };
    set('donate-dialog-title', t.donateDialogTitle || t.donateTitle || 'Support the development');
    set('lbl-donate-dialog-lead', t.donateDialogLead || '');
    set('lbl-donate-section-boosty-title', t.donateSectionBoostyTitle || '');
    set('lbl-donate-section-boosty-desc', t.donateSectionBoostyDesc || '');
    set('lbl-donate-btn-boosty', t.donateBtnBoosty || 'Pay via Boosty');
    set('lbl-donate-section-lava-title', t.donateSectionLavaTitle || '');
    set('lbl-donate-section-lava-desc', t.donateSectionLavaDesc || '');
    set('lbl-donate-btn-lava', t.donateBtnLava || 'Pay via Lava.top');
    set('lbl-donate-section-crypto-title', t.donateSectionCryptoTitle || '');
    set('lbl-donate-section-crypto-desc', t.donateSectionCryptoDesc || '');
    set('lbl-donate-copy-crypto', t.donateCopyAddress || 'Copy address');

    const links = donateLinks();
    const cryptoHint = document.getElementById('lbl-donate-crypto-hint');
    const boostyBtn = document.getElementById('donate-link-boosty');
    if (boostyBtn) {
      boostyBtn.href = links.boosty || '#';
      boostyBtn.toggleAttribute('disabled', !links.boosty);
    }
    const lavaBtn = document.getElementById('donate-link-lava');
    if (lavaBtn) {
      lavaBtn.href = links.lava || '#';
      lavaBtn.toggleAttribute('disabled', !links.lava);
    }

    const cryptoEl = document.getElementById('donate-crypto-address');
    const copyBtn = document.getElementById('donate-copy-crypto');
    const prefix = t.donateCryptoPrefix || 'USDT (TRC-20):';
    if (cryptoEl) {
      if (links.crypto) {
        cryptoEl.textContent = `${prefix} ${links.crypto}`;
        cryptoEl.classList.remove('donate-dialog__crypto--empty');
      } else {
        cryptoEl.textContent = t.donateCryptoEmpty || 'Wallet address is not configured yet.';
        cryptoEl.classList.add('donate-dialog__crypto--empty');
      }
    }
    if (cryptoHint) {
      if (links.crypto) {
        cryptoHint.textContent = t.donateCryptoNetworkHint || '';
        cryptoHint.hidden = !t.donateCryptoNetworkHint;
      } else {
        cryptoHint.textContent = '';
        cryptoHint.hidden = true;
      }
    }
    if (copyBtn) copyBtn.disabled = !links.crypto;

    const donateBtn = document.getElementById('header-donate-btn');
    if (donateBtn) {
      donateBtn.setAttribute('title', t.donateTitle || '');
      donateBtn.setAttribute('aria-label', t.donateAria || t.donateShort || 'Donate');
    }
    const donateLbl = document.getElementById('lbl-header-donate');
    if (donateLbl) donateLbl.textContent = t.donateShort || 'Donate';
  }

  function openDonateDialog() {
    const dlg = document.getElementById('donate-dialog');
    if (!dlg) return;
    updateDonateDialogTexts();
    if (typeof dlg.showModal === 'function') dlg.showModal();
  }

  function closeDonateDialog() {
    const dlg = document.getElementById('donate-dialog');
    if (dlg && typeof dlg.close === 'function') dlg.close();
  }

  function initDonateDialog() {
    const dlg = document.getElementById('donate-dialog');
    const openBtn = document.getElementById('header-donate-btn');
    if (!dlg || !openBtn) return;

    openBtn.addEventListener('click', () => openDonateDialog());
    document.getElementById('donate-dialog-close')?.addEventListener('click', () => closeDonateDialog());
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeDonateDialog();
    });

    document.getElementById('donate-copy-crypto')?.addEventListener('click', async () => {
      const links = donateLinks();
      if (!links.crypto) return;
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en || {};
      const btn = document.getElementById('donate-copy-crypto');
      const ok = await donateCopyText(links.crypto);
      if (btn && ok) {
        const prev = btn.textContent;
        btn.textContent = t.donateCopied || 'Copied';
        window.setTimeout(() => {
          btn.textContent = prev;
        }, 1600);
      }
    });

    updateDonateDialogTexts();
  }

  initDonateDialog();
