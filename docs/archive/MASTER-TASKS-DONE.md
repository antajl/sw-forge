# Архив: исполняемые задачи MASTER (блоки A / B / C)

**Статус:** все пункты выполнены. Итог для игроков — Changelog → **2026-05-22**.

Этот файл сохранён для истории («было / стало», номера строк на момент аудита).  
**Не использовать как чеклист.** Актуальные задачи — [PLANS.md](PLANS.md).

---
## ЧАСТЬ 5: ЗАДАЧИ — ВЫПОЛНЯТЬ ПО ПОРЯДКУ

**Инструкция:** Выполняй задачи строго по одной. После каждой:
1. Отметь задачу как ✅
2. Добавь запись в changelog (en + ru)
3. Если задача касается `js/features/` — запусти `npm run build:ui`
4. Закоммить с понятным сообщением

---

### 🔴 БЛОК A — КРИТИЧНЫЕ ИСПРАВЛЕНИЯ ~~(делать первыми)~~ **✅ ВЫПОЛНЕН**

#### A1 — Добавить `defer` к тегам `<script>` в index.html ✅
**Файл:** `index.html`
**Строки:** 2848–2867 (блок скриптов в конце `<body>`)
**Что сделать:** Добавить атрибут `defer` ко ВСЕМ тегам `<script>` с локальными файлами.
GSAP с CDN (строка 2865) оставить без `defer` — он уже асинхронный по своей природе.

```html
<!-- БЫЛО: -->
<script src="js/core/meta.js"></script>

<!-- СТАЛО: -->
<script defer src="js/core/meta.js"></script>
```

Применить к КАЖДОМУ из этих файлов (порядок не менять!):
- js/core/meta.js
- js/core/i18n.js
- js/core/defaults.js
- js/core/changelog-data.js
- js/core/bootstrap.js
- js/data/artifacts/effects.js
- js/data/relics/effects.js
- js/data/gear/parse.js
- js/data/parser.js
- js/data/skill-db.js
- js/data/monster-db.js
- js/engine/engine-core.js
- js/engine/engine-legacy-roles.js
- js/engine/engine-gem-reapp-verdict.js
- js/advanced-formulas.js
- js/engine/engine-process.js
- js/self-test.js
- js/swrm-motion.js
- js/ui.js

**Проверка:** В DevTools → Network, убедись что скрипты загружаются параллельно.
**Changelog:** «Added defer to all script tags — improves initial page parse speed» / «Атрибут defer на все скрипты — ускоряет начальный парсинг страницы»

---

#### A2 — Исправить `cache: 'no-store'` на demo.json ✅
**Файл:** `js/features/runes/upload.js`
**Строка:** 293
**Проблема:** `cache: 'no-store'` означает, что 5.5 MB скачиваются заново при КАЖДОЙ загрузке демо.

```js
// БЫЛО (строка 293):
const res = await fetch(new URL(rel, window.location.href), { cache: 'no-store' });

// СТАЛО:
const res = await fetch(new URL(rel, window.location.href));
```

Просто удали объект опций `{ cache: 'no-store' }` — браузер будет кэшировать нормально.

**После изменения:** `npm run build:ui`
**Changelog:** «Fix: demo dataset no longer re-downloads on every load (removed cache: no-store)» / «Исправление: демо-данные больше не скачиваются заново при каждой загрузке»

---

#### A3 — Исправить `cache: 'no-store'` в monster-db.js ✅
**Файл:** `js/data/monster-db.js`
**Строка:** 230
**Проблема:** То же самое — monsters-index.json (641 KB) скачивается без кэша.

```js
// БЫЛО (строка 230):
const res = await fetch(url, { cache: 'no-store' });

// СТАЛО:
const res = await fetch(url);
```

**Changelog:** объединить с A2 в одну запись.

---

#### A4 — Создать файл `_headers` для Cloudflare Pages ✅
**Файл:** создать новый файл `_headers` в КОРНЕ проекта (рядом с index.html)
**Что делает:** настраивает правила кэширования для Cloudflare CDN.

```
# _headers — Cloudflare Pages cache rules

# Статические ассеты — кэш навсегда (они не меняются)
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# ui.js — долгий кэш с фоновым обновлением
/js/ui.js
  Cache-Control: public, max-age=86400, stale-while-revalidate=3600

# Остальные JS-файлы
/js/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=3600

# CSS
/css/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=3600

# JSON данные — короткий кэш (могут обновляться)
/data/monsters-index.json
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/data/skills-index.json
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/data/demo.json
  Cache-Control: public, max-age=604800

# HTML — не кэшировать (всегда свежий)
/
  Cache-Control: no-cache
```

**Проверка:** После деплоя в DevTools → Network → заголовок `Cache-Control` должен измениться.
**Changelog:** «Added _headers for Cloudflare Pages — static assets now cached up to 1 year» / «Добавлен _headers для Cloudflare Pages — статические ассеты кэшируются до 1 года»

---

### 🟡 БЛОК B — ВАЖНЫЕ УЛУЧШЕНИЯ **✅ ВЫПОЛНЕН**

#### B1 — Cache-busting для JSON данных ✅
**Файлы:** `js/data/monster-db.js`, `js/data/skill-db.js`
**Проблема:** При обновлении monsters-index.json пользователи видят старую версию до истечения кэша.
**Решение:** Добавить версию приложения как query param к URL.

В `js/data/monster-db.js` найди строку с `INDEX_URL`:
```js
// БЫЛО (строка 5):
const INDEX_URL = 'data/monsters-index.json';

// СТАЛО:
const INDEX_URL = `data/monsters-index.json?v=${window.SWRM?.APP_VERSION || '0'}`;
```

Аналогично в `js/data/skill-db.js` — найди URL для skills-index.json и добавь `?v=`.

**Важно:** `window.SWRM` уже доступен к этому моменту (monster-db грузится после bootstrap).
**Changelog:** «JSON data files now versioned with APP_VERSION — cache invalidates on app update» / «JSON-данные теперь версионируются через APP_VERSION — кэш сбрасывается при обновлении»

---

#### B2 — Добавить SRI хэш к GSAP CDN скрипту ✅
**Файл:** `index.html`
**Строка:** 2865
**Проблема:** Скрипт с CDN без `integrity` атрибута — уязвимость безопасности.

Шаг 1 — Сгенерировать хэш (выполни в терминале):
```bash
curl -s https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js | openssl dgst -sha384 -binary | openssl base64 -A
```

Шаг 2 — Обновить тег (подставь реальный хэш вместо [HASH]):
```html
<!-- БЫЛО: -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"></script>

<!-- СТАЛО: -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"
  integrity="sha384-[HASH]"
  crossorigin="anonymous"></script>
```

**Changelog:** «Added SRI integrity hash to GSAP CDN script» / «Добавлен SRI хэш безопасности для скрипта GSAP с CDN»

---

#### B3 — Вынести FR переводы в отдельный файл (lazy loading) ✅
**Файлы:** `js/core/i18n.js`, создать новый `js/core/i18n-fr.js`
**Проблема:** 82 KB i18n.js грузит французские переводы даже для пользователей EN/RU.
**Строки FR в i18n.js:** 1339–1604

Шаг 1 — Создать `js/core/i18n-fr.js`:
```js
// js/core/i18n-fr.js — French translations (lazy loaded)
// Loaded only when user switches to 'fr' language
window.SWRM_I18N_FR = {
  // Скопировать сюда содержимое TRANSLATIONS_FR_PARTIAL из i18n.js (строки 1340-1603)
};
```

Шаг 2 — В конце `js/core/i18n.js` ЗАМЕНИТЬ строки 1339–1605:
```js
// БЫЛО:
const TRANSLATIONS_FR_PARTIAL = { ... };
TRANSLATIONS.fr = { ...TRANSLATIONS.en, ...TRANSLATIONS_FR_PARTIAL };

// СТАЛО:
// FR translations loaded lazily — see js/core/i18n-fr.js
// Triggered by language switch, NOT on startup
```

Шаг 3 — В `js/features/shell/i18n-bindings.js` найди логику смены языка и добавь:
```js
async function loadFrTranslations() {
  if (window.SWRM.TRANSLATIONS.fr) return; // уже загружен
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'js/core/i18n-fr.js';
    s.onload = () => {
      window.SWRM.TRANSLATIONS.fr = {
        ...window.SWRM.TRANSLATIONS.en,
        ...window.SWRM_I18N_FR
      };
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
// Вызвать эту функцию перед применением FR языка
```

Шаг 4 — Добавить `js/core/i18n-fr.js` в список файлов для деплоя (он уже будет в папке).
**После изменения:** `npm run build:ui`

---

#### B4 — Заменить захардкоженные hex-цвета в CSS на переменные ✅
**Файлы:** все файлы в `css/features/`
**Проблема:** 95 случаев где вместо `var(--переменная)` используются прямые hex-значения.

Таблица замен (наиболее частые):
```
#f0c040  → var(--gold)        (встречается 20 раз)
#e87850  → var(--orange)      (встречается 12 раз)
#5b9cff  → var(--accent)      (встречается 7 раз)
#c9a227  → var(--gold)        (встречается 7 раз)
#6ea8fe  → var(--accent)      (встречается 4 раза)
#f06eb0  → var(--purple)      (встречается 5 раз)
#ffffff  → var(--text-hi) или var(--bg3) в зависимости от контекста
#2d8a5c  → var(--green)       (встречается 3 раза)
#ffd54a  → var(--gold)        (встречается 2 раза)
#ff9a6e  → var(--orange)      (встречается 2 раза)
```

Команда для поиска всех вхождений:
```bash
grep -rn "#[0-9a-fA-F]\{6\}" css/features/ | grep -v "svg\|data:image\|filter:"
```

**Важно:** Для каждой замены смотри контекст — один hex может означать разные вещи
в разных местах. Если не уверен — пропусти и спроси.

---

#### B5 — Архивировать одноразовые patch-скрипты из tools/ ✅
**Папка:** `tools/`
**Что делать:**
1. Создать папку `tools/archive/`
2. Переместить туда все файлы КРОМЕ активных:
   - Оставить: `build-ui.mjs`, `watch-ui.mjs`, `fetch-monsters-index.mjs`, `fetch-skills-index.mjs`, `extract-tab-icons.mjs`
   - Переместить в `tools/archive/`: `fix-motion-tags.mjs`, `fix-teams-html.mjs`, `move-teams-pane.mjs`, `patch-monsters-awaken.mjs`, `patch-monsters-ui.mjs`, `patch-teams-html.mjs`, `patch-toolbar.mjs`, `patch-roster-toolbar-fixed.html`, `patch-roster-toolbar.html`, `roster-toolbar-snippet.html`

**Changelog:** «Archived one-time patch scripts to tools/archive/» / «Одноразовые патч-скрипты перемещены в tools/archive/»

---

### 🟢 БЛОК C — ДОЛГОСРОЧНЫЕ УЛУЧШЕНИЯ **✅ ВЫПОЛНЕН**

#### C1 — CSS build step (конкатенация) ✅
**Цель:** Вместо цепочки `@import` — один файл `css/dist/app.css`.
**Сделано:** `tools/build-css.mjs`, `npm run build:css`, `index.html` → `css/dist/app.css`, порядок файлов = `style.css` / index.css.
**Файл для создания:** `tools/build-css.mjs`

```js
// tools/build-css.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'css/dist/app.css');

// Порядок должен совпадать с @import порядком в style.css
const FILES = [
  'css/foundation/base.css',
  'css/foundation/header.css',
  'css/foundation/overlays.css',
  'css/foundation/toasts.css',
  'css/foundation/action-chrome.css',
  'css/features/guide/archive.css',
  'css/features/app/settings.css',
  // runes
  'css/features/runes/hub.css',
  'css/features/runes/chrome.css',
  'css/features/runes/grid.css',
  'css/features/runes/table-core.css',
  'css/features/runes/table-header.css',
  'css/features/runes/table-chips.css',
  'css/features/runes/table-toolbar.css',
  'css/features/runes/panel.css',
  'css/features/runes/stat-cards.css',
  'css/features/runes/chart-bars.css',
  'css/features/runes/eff-histo.css',
  'css/features/runes/floating-tip.css',
  'css/features/runes/slot-distribution.css',
  'css/features/runes/top-spd.css',
  'css/features/runes/typography.css',
  'css/features/runes/stage-advisor.css',
  'css/features/runes/rules.css',
  // gear
  'css/features/gear/table-kind.css',
  // teams
  'css/features/teams/teams.css',
  'css/features/teams/teams-v2.css',
  // monsters
  'css/features/monsters/shell.css',
  'css/features/monsters/hub.css',
  'css/features/monsters/toolbar.css',
  'css/features/monsters/toolbar-v2.css',
  'css/features/monsters/toolbar-controls.css',
  'css/features/monsters/cards.css',
  'css/features/monsters/card-meta.css',
  'css/features/monsters/table.css',
  'css/features/monsters/table-link.css',
  'css/features/monsters/list-runes.css',
  'css/features/monsters/rune-slots.css',
  'css/features/monsters/detail.css',
  'css/features/monsters/detail-tabs.css',
  'css/features/monsters/detail-runes.css',
  'css/features/monsters/detail-gear.css',
  'css/features/monsters/elements.css',
  'css/features/monsters/tokens.css',
  'css/features/monsters/tags-bulk-stats.css',
  'css/features/monsters/bulk.css',
  'css/features/monsters/responsive.css',
  'css/features/monsters/box-overview.css',
];

fs.mkdirSync(path.join(root, 'css/dist'), { recursive: true });
const body = FILES.map(f => {
  const full = path.join(root, f);
  return `/* === ${f} === */\n${fs.readFileSync(full, 'utf8')}`;
}).join('\n\n');

fs.writeFileSync(outPath, body, 'utf8');
console.log('wrote css/dist/app.css from', FILES.length, 'files');
```

Добавить скрипт в `package.json`:
```json
{
  "scripts": {
    "build:ui": "node tools/build-ui.mjs",
    "build:css": "node tools/build-css.mjs",
    "build": "npm run build:css && npm run build:ui",
    "watch:ui": "node tools/watch-ui.mjs"
  }
}
```

Обновить `index.html` — заменить:
```html
<!-- БЫЛО: -->
<link rel="stylesheet" href="css/style.css" />

<!-- СТАЛО: -->
<link rel="stylesheet" href="css/dist/app.css" />
```

Добавить `css/dist/app.css` в `.gitignore` (build artifact) ИЛИ коммитить как ui.js.
**Решение:** коммитить (аналогично ui.js) для статического хостинга без CI.

---

#### C2 — Web Worker для processAll() ✅
**Цель:** Перенести тяжёлый цикл рун с главного потока в фоновый воркер.
**Создать:** `js/workers/rune-processor.worker.js`

```js
// js/workers/rune-processor.worker.js
// Импортируем движок через importScripts
importScripts(
  '/js/core/meta.js',
  '/js/core/defaults.js',
  '/js/core/bootstrap.js',
  '/js/engine/engine-core.js',
  '/js/engine/engine-legacy-roles.js',
  '/js/engine/engine-gem-reapp-verdict.js',
  '/js/advanced-formulas.js',
  '/js/engine/engine-process.js'
);

self.onmessage = function({ data }) {
  const { runes, stage, settings, requestId } = data;
  try {
    const result = window.SWRM.processAll(runes, stage, settings);
    self.postMessage({ requestId, result, error: null });
  } catch(e) {
    self.postMessage({ requestId, result: null, error: e.message });
  }
};
```

**Важно:** `window.SWRM` в воркере — это `self.SWRM` (в воркерах `window` === `self`).
Нужно проверить, что `bootstrap.js` использует `window.SWRM = window.SWRM || {}` (он использует).

Добавить вызов воркера в `js/features/runes/table.js` или там где вызывается `processAll`:
```js
// Создаётся один раз при инициализации
const runeWorker = new Worker('/js/workers/rune-processor.worker.js');

function processRunesAsync(runes, stage, settings) {
  return new Promise((resolve, reject) => {
    const requestId = Date.now();
    runeWorker.postMessage({ runes, stage, settings, requestId });
    runeWorker.onmessage = ({ data }) => {
      if (data.requestId !== requestId) return;
      if (data.error) reject(new Error(data.error));
      else resolve(data.result);
    };
  });
}
```

**Предупреждение:** Это сложное изменение. Перед внедрением убедиться что `processAll` не зависит от DOM (он не зависит — в `js/engine/`).

---

#### C3 — Self-hosted шрифты ✅
**Цель:** Убрать зависимость от Google Fonts CDN.
**Инструмент:** https://gwfh.mranftl.com (google-webfonts-helper)

Скачать и разместить в `assets/fonts/`:
- IBM Plex Sans: Regular(400), Medium(500), SemiBold(600), Bold(700) + Italic(400)
- Share Tech Mono: Regular(400)

В `css/foundation/base.css` в самом начале добавить:
```css
@font-face {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/ibm-plex-sans-v19-latin-regular.woff2') format('woff2');
}
/* ... остальные веса аналогично */
```

В `index.html` удалить строки:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:..." rel="stylesheet">
```

---

## ЧАСТЬ 6: ПРАВИЛА ДЛЯ НОВЫХ ФИЧЕЙ

### Как добавить новую фичу
1. CSS → создать `css/features/[feature]/my-component.css`
2. Добавить `@import url('./my-component.css');` в `css/features/[feature]/index.css`
3. JS → создать `js/features/[feature]/my-component.js`
4. Добавить путь в `tools/build-ui.mjs` в правильную позицию массива `CHUNKS`
5. Запустить `npm run build:ui`
6. Добавить строки в `js/core/i18n.js` (EN + RU)
7. Добавить запись в `js/core/changelog-data.js`

### Как добавить новую CSS-переменную
1. Открыть `css/foundation/base.css`
2. Добавить переменную в `:root` с логичным именем в существующую группу
3. Если переменная нужна только в одном компоненте — рассмотреть локальный scope через `.component-name { --local-var: value; }`

### Как обновить данные монстров/умений
```bash
node tools/fetch-monsters-index.mjs  # обновляет data/monsters-index.json
node tools/fetch-skills-index.mjs    # обновляет data/skills-index.json
```
После обновления увеличить `APP_VERSION` в `js/core/meta.js`.

### Как деплоить Worker
```bash
cd worker
npx wrangler deploy
```

---

## ЧАСТЬ 7: ИЗВЕСТНЫЕ ТЕХНИЧЕСКИЕ ДОЛГИ

| # | Проблема | Статус | Приоритет |
|---|---|---|---|
| 1 | Захардкоженные hex в `css/features/` | Частично (B4) | 🟡 |
| 2 | CSS @import цепочка | ✅ `css/dist/app.css` (C1) | — |
| 3 | `index.html` монолитный (~252 KB) | Открыто | 🟢 |
| 4 | `tools/` патч-скрипты | ✅ `tools/archive/` (B5) | — |
| 5 | Google Fonts CDN | ✅ self-hosted (C3) | — |
| 6 | `processAll()` на main thread | ✅ Worker + fallback (C2) | — |
| 7 | Нет минификации JS/CSS | Открыто | 🟢 |
| 8 | `npm run watch:css` | Нет | 🟢 dev UX |

---

## ЧАСТЬ 8: БЫСТРЫЕ КОМАНДЫ

```bash
# Сборка UI после изменений в js/features/
npm run build:ui

# Сборка CSS после изменений в css/ (список в tools/build-css.mjs)
npm run build:css

# Полная сборка
npm run build

# Наблюдение за изменениями (hot rebuild)
npm run watch:ui

# Обновить данные монстров из SWARFARM
node tools/fetch-monsters-index.mjs

# Обновить данные умений
node tools/fetch-skills-index.mjs

# Деплой Worker
cd worker && npx wrangler deploy && cd ..

# Найти захардкоженные цвета в CSS
grep -rn "#[0-9a-fA-F]\{6\}" css/features/ | grep -v "svg\|data:image\|filter:"

# Найти все window.SWRM зависимости
grep -rn "window\.SWRM\." js/features/ | grep -v "//.*window"

# Проверить размеры файлов
find js css -name "*.js" -o -name "*.css" | xargs wc -c | sort -rn | head -20
```

---

## ЧАСТЬ 9: ДОКУМЕНТАЦИЯ (`docs/`)

**Индекс:** [`docs/README.md`](README.md) — таблица «какой файл зачем», можно ли объединять.

| Файл | Назначение |
|------|------------|
| `PROJECT-CONTEXT.md` | Быстрый вход для AI: проект, стек, правила, без списка задач |
| `MASTER.md` | Исполняемые задачи, карта файлов, changelog/i18n/build правила |
| `ARCHITECTURE.md` | Техническая схема загрузки и сборки |
| `FEATURES.md` | Где лежит код по вкладкам/фичам |
| `PLANS.md` | Единый продуктовый план; § Monsters = бывший PLANS-MONSTERS |
| `PLANS-MONSTERS.md` | Редирект на `PLANS.md#monsters` |

**Roadmap в приложении** — `js/core/changelog-data.js` (`STATIC_ROADMAP`). Полный текст и «зачем» — в **`PLANS.md`**; при смене приоритетов обновляй оба.

**Не вливать** весь `PLANS.md` в MASTER: MASTER = как делать, PLANS = что хотим в продукте.

---

## ЧАСТЬ 10: ПЛАН ВЫПОЛНЕНИЯ ОСТАВШИХСЯ ФИЧ

> Детали: [`PLANS.md`](PLANS.md). Игроку: Changelog → Roadmap. Блоки A/B/C ✅ (см. changelog 2026-05-22).

### Фаза 1 — Runes (следующая)
| # | Задача |
|---|--------|
| 1.1 | Diff двух Database Slots |
| 1.2 | Опциональное правило Grind (policy UI) |

### Фаза 2 — Monsters account-wide
| # | Задача |
|---|--------|
| 2.1 | Skill-up / devilmon planner (сводка + список приоритетов) |
| 2.2 | Fusion tracker |
| 2.3 | Monster Builder lite |
| 2.4 | Teams: notes, readiness strip |

### Фаза 3 — Monsters Dashboard (опционально)
| # | Задача |
|---|--------|
| 5.1 | Субтаб Dashboard, плитки как Box overview++, графики |
| 5.2 | Cross-link из Runes depth |

### Фаза 4 — Roster depth & gear
| # | Задача |
|---|--------|
| 6.1 | Compare two units |
| 6.2 | Duplicate Nat5 hint |
| 6.3 | Content tags RTA/Siege/ToA |
| 6.4 | Artifacts/relics verdict engine |

### Фаза 5 — i18n & polish
| # | Задача |
|---|--------|
| 7.1 | Guide FR Monsters |
| 7.2 | Оставшиеся hex → CSS vars (если ещё есть) |
| 7.3 | `npm run watch:css` (удобство dev) |

**Сейчас в работе:** **Фаза 1** (diff двух слотов SWEX, Grind).

---

*Этот файл создан по результатам архитектурного аудита проекта sw-forge.
При значимых изменениях архитектуры — обновлять ЧАСТЬ 2 (карту файлов) и `docs/README.md`.*
