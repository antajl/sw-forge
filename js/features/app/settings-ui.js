// js/features/app/settings-ui.js — app settings and data slots
  // ===================== APP SETTINGS =====================
  const DB_SLOTS_META_KEY = 'swrm_db_slots_meta_v1';

  // IndexedDB setup for large JSON files
  const DB_NAME = 'SWRM';
  const DB_VERSION = 1;
  const STORE_NAME = 'slots';
  let idb = null;

  async function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { idb = req.result; resolve(idb); };
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async function saveSlotData(slotId, jsonText) {
    if (!idb) await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id: slotId, jsonText });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function loadSlotData(slotId) {
    if (!idb) await initIndexedDB();
    const get = (key) => new Promise((resolve, reject) => {
      const tx = idb.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.jsonText || '');
      req.onerror = () => reject(req.error);
    });
    let text = await get(slotId);
    if (text) return text;
    if (slotId === 'current-runes') return '';
    if (typeof slotId === 'number' && !Number.isNaN(slotId)) {
      text = await get(String(slotId));
    } else if (typeof slotId === 'string' && /^\d+$/.test(slotId)) {
      text = await get(Number(slotId));
    }
    return text || '';
  }

  async function deleteSlotData(slotId) {
    if (!idb) await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(slotId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteSlotDataRobust(slotId) {
    await deleteSlotData(slotId);
    if (typeof slotId === 'number' && !Number.isNaN(slotId)) {
      await deleteSlotData(String(slotId));
    }
  }

  async function clearAllIndexedDbRunePayloads() {
    for (const id of [1, 2, 3, 4, 'current-runes', '__swrm_embedded_demo__']) {
      try {
        await deleteSlotDataRobust(id);
      } catch (e) {
        console.warn('clearAllIndexedDbRunePayloads', id, e);
      }
    }
  }

  function loadDbSlots() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_SLOTS_META_KEY) || '[]');
      if (Array.isArray(parsed) && parsed.length === 4) return parsed.map(normalizeDbSlot);
    } catch(e) {}
    return defaultEmptyDbSlotsMeta();
  }

  function saveDbSlots(slots) {
    const meta = slots.map(s => normalizeDbSlot(s));
    localStorage.setItem(DB_SLOTS_META_KEY, JSON.stringify(meta));
  }

  function renderDbSlots() {
    const wrap = document.getElementById('db-slots-wrap');
    if (!wrap) {
      console.error('db-slots-wrap element not found');
      return;
    }
    const slots = loadDbSlots();
    const t = TRANSLATIONS && TRANSLATIONS[currentLang] ? TRANSLATIONS[currentLang] : {};
    
    wrap.innerHTML = slots.map(slot => {
      const hasData = !!slot.name;
      const summaryHtml = formatSlotSummaryLine(slot, t);
      const activeClass = slot.active ? ' db-slot--active' : '';
      const activePill = slot.active
        ? `<span class="db-slot-active-pill" aria-label="${escapeHtml(t.activeProfile || t.current)}">${escapeHtml(t.activeProfile || t.current)}</span>`
        : '';
      return `
      <div class="db-slot${activeClass}" data-slot="${slot.id}" ${slot.active ? 'data-active="true"' : ''}>
        <div class="db-slot-header-row">
          <div class="db-slot-title">${escapeHtml(t.dbSlot || 'Database Slot')} ${slot.id}</div>
          ${activePill}
        </div>
        <div class="db-slot-meta">${escapeHtml(t.name || 'Name')}: ${escapeHtml(slot.name) || '—'}</div>
        <div class="db-slot-meta">${escapeHtml(t.uploaded || 'Uploaded')}: ${escapeHtml(slot.uploadedAt) || '—'}</div>
        ${summaryHtml}
        <div class="db-slot-actions">
          <button type="button" class="btn-ghost" data-db-action="clipboard" data-slot="${slot.id}">${escapeHtml(t.clipboard || 'Clipboard')}</button>
          <button type="button" class="btn-ghost" data-db-action="upload" data-slot="${slot.id}">${escapeHtml(t.upload || 'Upload')}</button>
          <button type="button" class="btn-ghost" ${hasData ? '' : 'disabled'} data-db-action="download" data-slot="${slot.id}">${escapeHtml(t.download || 'Download')}</button>
          <button type="button" class="btn-ghost" ${hasData ? '' : 'disabled'} data-db-action="delete" data-slot="${slot.id}">${escapeHtml(t.delete || 'Delete')}</button>
          ${slot.active || !hasData ? '' : `<button type="button" class="btn-primary" data-db-action="swap" data-slot="${slot.id}">${escapeHtml(t.swap || 'Swap')}</button>`}
        </div>
      </div>`;
    }).join('');
  }

  async function processJsonData(jsonText) {
    const json = JSON.parse(jsonText);
    allRunes = parseSWEX(json);
    rebuildUnitsFromSwex(json);
    reprocess();
    markUserLoadedRealExport();
    if (typeof purgeDemoStorage === 'function') await purgeDemoStorage();
    if (typeof scrubDemoFromUserSlots === 'function') await scrubDemoFromUserSlots();
    if (typeof removeDemoTeams === 'function') removeDemoTeams();
    syncDemoBannerVisibility();
    document.getElementById('upload-prompt').classList.add('hidden');
  }

  async function parseAndLoadJson(jsonText) {
    await processJsonData(jsonText);
    showMainTab('dashboard', { writeHash: true });
  }

  const appLangSelect = document.getElementById('app-language');
  if (appLangSelect) {
    appLangSelect.value = currentLang;
    appLangSelect.addEventListener('change', async () => {
      let v = appLangSelect.value || 'en';
      if (!['en', 'ru', 'fr'].includes(v)) v = 'en';
      await updateLanguage(v);
      appLangSelect.value = currentLang;
    });
  }

  document.getElementById('theme-toggle')?.addEventListener('click', () => toggleTheme());

  document.getElementById('db-slots-wrap')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-db-action]');
    if (!btn) return;
    e.stopPropagation();
    
    const action = btn.dataset.dbAction;
    const slotId = Number(btn.dataset.slot);
    console.log('Slot action:', action, 'slotId:', slotId);
    
    const slots = loadDbSlots();
    const idx = slots.findIndex(s => s.id === slotId);
    if (idx < 0) return;
    const slot = slots[idx];
    const t = TRANSLATIONS[currentLang];

    if (action === 'clipboard') {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) return;
        let jsonObj;
        try {
          jsonObj = JSON.parse(text);
        } catch {
          alert(t.clipboardNotJson || 'Clipboard does not contain valid JSON.');
          return;
        }
        await saveSlotData(slotId, text);
        applySlotSummaryFromJson(slot, `Clipboard ${slotId}`, jsonObj);
        saveDbSlots(slots);
        renderDbSlots();
        markUserLoadedRealExport();
        syncDemoBannerVisibility();
      } catch(err) {
        alert('Clipboard access denied or not available');
      }
      return;
    }
    
    if (action === 'upload') {
      console.log('Upload clicked for slot', slotId);
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      
      inp.addEventListener('change', async ev => {
        console.log('File selected');
        const file = ev.target.files?.[0];
        if (!file) {
          console.log('No file selected');
          return;
        }
        console.log('Reading file:', file.name);
        const reader = new FileReader();
        reader.onload = async event => {
          try {
            const text = event.target.result;
            console.log('File read successfully, length:', text.length);
            const jsonObj = JSON.parse(text);
            await saveSlotData(slotId, text);
            applySlotSummaryFromJson(slot, file.name, jsonObj);
            slots.forEach((s) => { s.active = s.id === slotId; });
            saveDbSlots(slots);
            await processJsonData(text);
            renderDbSlots();
            console.log('Slot saved and rendered');
          } catch(err) {
            console.error('Error saving to IndexedDB:', err);
            alert('Failed to save file: ' + err.message);
          }
        };
        reader.onerror = () => console.error('File read error');
        reader.readAsText(file);
        document.body.removeChild(inp);
      });
      
      inp.click();
      return;
    }
    
    if (action === 'download') {
      try {
        const jsonText = await loadSlotData(slotId);
        if (!jsonText) return;
        const blob = new Blob([jsonText], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = slot.name || `slot-${slot.id}.json`;
        a.click();
      } catch(err) {
        alert('Failed to load slot data: ' + err.message);
      }
      return;
    }
    
    if (action === 'delete') {
      if (!confirm(`Delete slot ${slot.id}?`)) return;
      try {
        const wasActive = slot.active;
        await deleteSlotDataRobust(slotId);
        slots[idx] = normalizeDbSlot({ id: slot.id, name: '', uploadedAt: '', active: false });

        const namedSlots = slots.filter(s => s.name && s.name.trim() !== '');

        if (namedSlots.length === 0) {
          resetDemoAndRealPersistenceFlags();
          await clearAllIndexedDbRunePayloads();
          clearLocalStorageRuneBackup();
          saveDbSlots(defaultEmptyDbSlotsMeta());
          uiEmptyRuneApplicationState({ keepTab: true });
          showSwrmToast(t.slotDeleteAllCleared || 'All saved databases were removed.', { type: 'info' });
          renderDbSlots();
          const demoOk = await installEmbeddedDemoDataset({ keepTab: true });
          if (!demoOk) uiEmptyRuneApplicationState({ keepTab: false });
          renderDbSlots();
          return;
        }

        const needReselectActive =
          wasActive || !slots.some(s => s.active && s.name && s.name.trim() !== '');

        if (needReselectActive) {
          let next = slots.find(s => s.active && s.name && s.name.trim() !== '');
          if (!next) next = namedSlots[0];
          slots.forEach(s => {
            s.active = s.id === next.id;
          });
          saveDbSlots(slots);
          clearLocalStorageRuneBackup();
          const jsonText = await loadSlotData(next.id);
          if (!jsonText || !tryHydrateRunesFromJsonText(jsonText)) {
            resetDemoAndRealPersistenceFlags();
            await clearAllIndexedDbRunePayloads();
            clearLocalStorageRuneBackup();
            saveDbSlots(defaultEmptyDbSlotsMeta());
            uiEmptyRuneApplicationState({ keepTab: true });
            showSwrmToast(t.slotDeleteNextLoadFailed || 'Could not load the next database.', { type: 'error', duration: 7000 });
            renderDbSlots();
            const demoOk = await installEmbeddedDemoDataset({ keepTab: true });
            if (!demoOk) uiEmptyRuneApplicationState({ keepTab: false });
            renderDbSlots();
            return;
          }
          uiAfterSuccessfulRuneRestore(next, { keepTab: true });
          const msg = (t.slotDeleteSwitchedTo || '')
            .replace('{n}', String(next.id))
            .replace('{name}', next.name || '');
          if (msg) showSwrmToast(msg, { type: 'success' });
        } else {
          clearLocalStorageRuneBackup();
        }

        saveDbSlots(slots);
        renderDbSlots();
      } catch (err) {
        showSwrmToast('Failed to delete slot: ' + err.message, { type: 'error', duration: 7000 });
      }
      return;
    }
    
    if (action === 'swap') {
      try {
        const jsonText = await loadSlotData(slotId);
        if (!jsonText) return alert(t.slotEmpty || 'Selected slot is empty');
        slots.forEach(s => { s.active = s.id === slot.id; });
        saveDbSlots(slots);
        await processJsonData(jsonText);
      } catch(err) {
        alert((t.parseError || 'Failed to parse slot JSON: ') + err.message);
      }
      renderDbSlots();
    }
  });
