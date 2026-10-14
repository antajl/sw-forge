// src/features/shell/settings-ui.ts — app settings and data slots (simplified)

const DB_SLOTS_META_KEY = 'swrm_db_slots_meta_v1';
const DB_NAME = 'SWRM';
const DB_VERSION = 1;
const STORE_NAME = 'slots';

interface DbSlot {
  id: number;
  name: string;
  uploadedAt: string;
  active: boolean;
  wizardName?: string;
  wizardLevel?: number | null;
  wizardId?: string;
  demoProfile?: boolean;
}

let idb: IDBDatabase | null = null;

async function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      idb = req.result;
      resolve(idb);
    };
    req.onupgradeneeded = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function saveSlotData(slotId: number | string, jsonText: string): Promise<void> {
  if (!idb) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb!.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ id: slotId, jsonText });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function loadSlotData(slotId: number | string): Promise<string> {
  if (!idb) await initIndexedDB();
  const get = (key: number | string): Promise<string> => new Promise((resolve, reject) => {
    const tx = idb!.transaction([STORE_NAME], 'readonly');
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

async function deleteSlotData(slotId: number | string): Promise<void> {
  if (!idb) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb!.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(slotId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function defaultEmptyDbSlotsMeta(): DbSlot[] {
  return [
    { id: 1, name: '', uploadedAt: '', active: false },
    { id: 2, name: '', uploadedAt: '', active: false },
    { id: 3, name: '', uploadedAt: '', active: false },
    { id: 4, name: '', uploadedAt: '', active: false },
  ];
}

function normalizeDbSlot(slot: Partial<DbSlot>): DbSlot {
  return {
    id: slot.id ?? 1,
    name: slot.name ?? '',
    uploadedAt: slot.uploadedAt ?? '',
    active: slot.active ?? false,
    wizardName: slot.wizardName,
    wizardLevel: slot.wizardLevel,
    wizardId: slot.wizardId,
    demoProfile: slot.demoProfile,
  };
}

function loadDbSlots(): DbSlot[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(DB_SLOTS_META_KEY) || '[]');
    if (Array.isArray(parsed) && parsed.length === 4) return parsed.map(normalizeDbSlot);
  } catch (e) {
    // ignore
  }
  return defaultEmptyDbSlotsMeta();
}

function saveDbSlots(slots: DbSlot[]): void {
  const meta = slots.map((s) => normalizeDbSlot(s));
  localStorage.setItem(DB_SLOTS_META_KEY, JSON.stringify(meta));
}

export type { DbSlot };
export { initIndexedDB, saveSlotData, loadSlotData, deleteSlotData, loadDbSlots, saveDbSlots, defaultEmptyDbSlotsMeta };
