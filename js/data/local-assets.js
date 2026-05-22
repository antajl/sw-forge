// js/data/local-assets.js — bundled assets under assets/ (SWARFARM fallback when missing)
(function () {
  const PREFIX = 'assets/';

  const DIR = {
    elements: 'elements/',
    runes: 'runes/sets/',
    ui: 'ui/',
    artifacts: 'artifacts/',
    skills: 'skills/',
    leader: 'skills/leader/',
    monsters: 'monsters/',
  };

  const SKILLS_MANIFEST_URL = 'data/skills-icons-manifest.json';
  const LEADER_MANIFEST_URL = 'data/leader-icons-manifest.json';
  const PORTRAITS_MANIFEST_URL = 'data/monsters-portraits-manifest.json';
  const PORTRAIT_REMOTE_BASES = [
    'static/herders/images/monsters/',
    'static/herders/images/units/',
  ];
  let skillIconFiles = null;
  let leaderIconFiles = null;
  let portraitFiles = null;
  let skillsManifestPromise = null;
  let leaderManifestPromise = null;
  let portraitsManifestPromise = null;

  function localAssetsOnly() {
    return typeof SWRM_LOCAL_ASSETS_ONLY === 'boolean' && SWRM_LOCAL_ASSETS_ONLY === true;
  }

  function remoteOrEmpty(url) {
    return localAssetsOnly() ? '' : url;
  }

  function localUrl(category, filename) {
    const dir = DIR[category] || (String(category).endsWith('/') ? category : `${category}/`);
    const file = String(filename || '').replace(/^\//, '');
    if (!file) return '';
    return `${PREFIX}${dir}${file}`.replace(/\/+/g, '/');
  }

  function swarfarmUrl(relativePath) {
    if (localAssetsOnly()) return '';
    const rel = String(relativePath || '').replace(/^\//, '');
    const db = window.SWRM_MONSTER_DB;
    if (db && typeof db.swarfarmAssetUrl === 'function') {
      return db.swarfarmAssetUrl(rel);
    }
    return `https://swarfarm.com/${rel}`;
  }

  function skillIconRemoteUrl(iconFilename) {
    const fn = String(iconFilename || '').replace(/^\//, '');
    if (!fn) return '';
    return swarfarmUrl(`static/herders/images/skills/${fn}`);
  }

  function loadSkillsIconManifest() {
    if (!skillsManifestPromise) {
      skillsManifestPromise = fetch(SKILLS_MANIFEST_URL, { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : { files: [] }))
        .then((data) => {
          const list = Array.isArray(data.files) ? data.files : [];
          skillIconFiles = new Set(list.map((f) => String(f)));
          return skillIconFiles;
        })
        .catch(() => {
          skillIconFiles = new Set();
          return skillIconFiles;
        });
    }
    return skillsManifestPromise;
  }

  /** Local only if listed in skills-icons-manifest.json; else SWARFARM/proxy (unless LOCAL_ASSETS_ONLY). */
  function resolveSkillIconUrl(iconFilename) {
    const fn = String(iconFilename || '').replace(/^\//, '');
    if (!fn) return '';
    if (skillIconFiles && skillIconFiles.has(fn)) {
      return localUrl('skills', fn);
    }
    return remoteOrEmpty(skillIconRemoteUrl(fn));
  }

  function skillIconFallbackUrl(iconFilename) {
    if (localAssetsOnly()) return '';
    const fn = String(iconFilename || '').replace(/^\//, '');
    if (!fn) return '';
    const primary = resolveSkillIconUrl(fn);
    const remote = skillIconRemoteUrl(fn);
    return primary && primary !== remote ? remote : '';
  }

  function leaderIconRemoteUrl(filename) {
    const fn = String(filename || '').replace(/^\//, '');
    if (!fn) return '';
    return swarfarmUrl(`static/herders/images/skills/leader/${fn}`);
  }

  function loadLeaderIconManifest() {
    if (!leaderManifestPromise) {
      leaderManifestPromise = fetch(LEADER_MANIFEST_URL, { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : { files: [] }))
        .then((data) => {
          const list = Array.isArray(data.files) ? data.files : [];
          leaderIconFiles = new Set(list.map((f) => String(f)));
          return leaderIconFiles;
        })
        .catch(() => {
          leaderIconFiles = new Set();
          return leaderIconFiles;
        });
    }
    return leaderManifestPromise;
  }

  function resolveLeaderIconUrl(filename) {
    const fn = String(filename || '').replace(/^\//, '');
    if (!fn) return '';
    if (leaderIconFiles && leaderIconFiles.has(fn)) {
      return localUrl('leader', fn);
    }
    return remoteOrEmpty(leaderIconRemoteUrl(fn));
  }

  function leaderIconFallbackUrl(filename) {
    if (localAssetsOnly()) return '';
    const fn = String(filename || '').replace(/^\//, '');
    if (!fn) return '';
    const primary = resolveLeaderIconUrl(fn);
    const remote = leaderIconRemoteUrl(fn);
    return primary && primary !== remote ? remote : '';
  }

  function preferLocal(category, filename) {
    return localUrl(category, filename);
  }

  function monsterPortraitRemoteUrl(imageFilename, baseIndex) {
    const fn = String(imageFilename || '').replace(/^\//, '');
    if (!fn) return '';
    const i = baseIndex != null ? Number(baseIndex) : 0;
    const rel = PORTRAIT_REMOTE_BASES[i] || PORTRAIT_REMOTE_BASES[0];
    return swarfarmUrl(`${rel}${fn}`);
  }

  function loadPortraitsManifest() {
    if (!portraitsManifestPromise) {
      portraitsManifestPromise = fetch(PORTRAITS_MANIFEST_URL, { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : { files: [] }))
        .then((data) => {
          const list = Array.isArray(data.files) ? data.files : [];
          portraitFiles = new Set(list.map((f) => String(f)));
          return portraitFiles;
        })
        .catch(() => {
          portraitFiles = new Set();
          return portraitFiles;
        });
    }
    return portraitsManifestPromise;
  }

  function resolveMonsterPortraitUrl(imageFilename) {
    const fn = String(imageFilename || '').replace(/^\//, '');
    if (!fn) return '';
    if (portraitFiles && portraitFiles.has(fn)) {
      return localUrl('monsters', fn);
    }
    return remoteOrEmpty(monsterPortraitRemoteUrl(fn, 0));
  }

  function monsterPortraitFallbackUrl(imageFilename) {
    if (localAssetsOnly()) return '';
    const fn = String(imageFilename || '').replace(/^\//, '');
    if (!fn) return '';
    const primary = resolveMonsterPortraitUrl(fn);
    const remote = monsterPortraitRemoteUrl(fn, 0);
    return primary && primary !== remote ? remote : monsterPortraitRemoteUrl(fn, 1);
  }

  loadSkillsIconManifest();
  loadLeaderIconManifest();
  loadPortraitsManifest();

  window.SWRM_LOCAL_ASSETS = {
    PREFIX,
    localAssetsOnly,
    localUrl,
    swarfarmUrl,
    preferLocal,
    skillIconRemoteUrl,
    resolveSkillIconUrl,
    skillIconFallbackUrl,
    loadSkillsIconManifest,
    leaderIconRemoteUrl,
    resolveLeaderIconUrl,
    leaderIconFallbackUrl,
    loadLeaderIconManifest,
    monsterPortraitRemoteUrl,
    resolveMonsterPortraitUrl,
    monsterPortraitFallbackUrl,
    loadPortraitsManifest,
  };
})();
