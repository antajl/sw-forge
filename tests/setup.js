// Test setup file for SW-Forge
// Sets up minimal SWRM global object for testing

window.SWRM = window.SWRM || {};
window.SWRM.STAT_NAMES = {
  1: 'HP', 2: 'HP%', 3: 'ATK', 4: 'ATK%', 5: 'DEF', 6: 'DEF%',
  8: 'SPD', 9: 'CRate', 10: 'CDmg', 11: 'RES', 12: 'ACC',
  'HP': 'HP', 'ATK': 'ATK', 'DEF': 'DEF', 'SPD': 'SPD',
  'CRI': 'CRate', 'CD': 'CDmg', 'RES': 'RES', 'ACC': 'ACC'
};

window.SWRM.SET_NAMES = {
  1: 'Energy', 2: 'Guard', 3: 'Swift', 4: 'Blade', 5: 'Rage', 6: 'Focus',
  7: 'Endure', 8: 'Fatal', 10: 'Despair', 11: 'Vampire', 13: 'Violent', 14: 'Nemesis',
  15: 'Will', 16: 'Shield', 17: 'Revenge', 18: 'Destroy', 19: 'Fight', 20: 'Determination',
  21: 'Enhance', 22: 'Accuracy', 23: 'Tolerance', 24: 'Seal', 25: 'Intangible',
  'Energy': 'Energy', 'Guard': 'Guard', 'Swift': 'Swift', 'Blade': 'Blade',
  'Rage': 'Rage', 'Focus': 'Focus', 'Endure': 'Endure', 'Fatal': 'Fatal',
  'Despair': 'Despair', 'Vampire': 'Vampire', 'Will': 'Will', 'Nemesis': 'Nemesis',
  'Shield': 'Shield', 'Revenge': 'Revenge', 'Destroy': 'Destroy', 'Violent': 'Violent',
  'Fight': 'Fight', 'Determination': 'Determination', 'Enhance': 'Enhance',
  'Accuracy': 'Accuracy', 'Tolerance': 'Tolerance', 'Seal': 'Seal', 'Intangible': 'Intangible'
};

window.SWRM.GRADE_NAMES = { 1: 'Common', 2: 'Magic', 3: 'Rare', 4: 'Hero', 5: 'Legend' };
window.SWRM.GRADE_SHORT = { 3: 'Rare', 4: 'Hero', 5: 'Legend' };

// In-memory mock for localStorage in testing environment
if (typeof window.localStorage === 'undefined' || typeof window.localStorage.getItem !== 'function') {
  let store = {};
  window.localStorage = {
    getItem: (key) => store[key] !== undefined ? store[key] : null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] || null,
  };
}

