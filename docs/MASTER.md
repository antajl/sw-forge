# SW Forge — MASTER (справочник для AI и разработчика)

> **Назначение:** карта репозитория, контракты загрузки, правила правок.  
> **Не backlog:** открытые фичи → [`PLANS.md`](PLANS.md); сделанное → Changelog в приложении.  
> **Быстрый вход:** [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) · **Индекс docs:** [`README.md`](README.md)

---

## ЧАСТЬ 1: КОНТЕКСТ ПРОЕКТА

### Что это
SW Forge — статический сайт на **Cloudflare Pages**: анализ рун Summoners War + хаб монстров (один SWEX в браузере).

### Инфраструктура
| | |
|---|---|
| **Prod** | https://sw-forge.pages.dev |
| **Repo** | https://github.com/antajl/sw-forge (`main`) |
| **Share API** | https://sw-backend.antajltube.workers.dev (Worker + D1) |
| **D1** | `swf-db` |
| **Локально** | VS Code Live Server → http://127.0.0.1:5500 |

Деплой: `git push` → Pages ~1 мин. CDN: корневой `_headers`.

### Стек
- **Runtime:** Vanilla JS + CSS, без фреймворков и бандлера в браузере
- **Build:** `npm run build` = `build:css` + `build:ui` (артефакты коммитятся, как `ui.js`)
- **CSS в prod:** `index.html` → `css/dist/app.css` (исходники в `css/features/`, dev-цепочка `css/style.css`)
- **Шрифты:** системный UI-стек (`system-ui` / Segoe UI / Roboto) в `base.css`; `tabular-nums` на body. Файлы в `assets/fonts/` — legacy, не подключаются
- **Анимации:** GSAP 3.12.7 с jsDelivr (SRI + `crossorigin`)
- **i18n:** EN + RU в `i18n.js`; FR lazy → `js/core/i18n-fr.js`
- **Worker:** `worker/` (Wrangler) — Share Profile

### npm scripts (`package.json`)
| Команда | Действие |
|---------|----------|
| `npm run build:ui` | `tools/build-ui.mjs` → `js/ui.js` |
| `npm run build:css` | `tools/build-css.mjs` → `css/dist/app.css` |
| `npm run build` | оба шага |
| `npm run watch:ui` | пересборка `ui.js` при сохранении в `js/features/` |

---

## ЧАСТЬ 2: КАРТА ФАЙЛОВ

### ⛔ Не редактировать вручную
| Файл | Почему |
|------|--------|
| `js/ui.js` | Артефакт `npm run build:ui` |
| `css/dist/app.css` | Артефакт `npm run build:css` |
| Порядок `<script defer>` в `index.html` | Жёсткий контракт зависимостей |

### Корень и статика
| Путь | Назначение |
|------|------------|
| `index.html` | Единственная HTML-страница (весь UI inline) |
| `_headers` | Cache-Control для Cloudflare Pages |
| `assets/fonts/*.woff2` | Self-hosted шрифты |
| `data/demo.json` | Демо SWEX (~5.5 MB) |
| `data/monsters-index.json` | Имена/иконки/мета монстров (кэш SWARFARM, `fetch-monsters-index.mjs`) |
| `data/skills-index.json` | Скиллы: max level, иконки, описание, прокачка, CD (`fetch-skills-index.mjs --fresh`, schema 2) |

### CSS
| Путь | Назначение |
|------|------------|
| `css/dist/app.css` | **Prod** — собранный бандл |
| `css/style.css` | Dev: только `@import` |
| `css/foundation/base.css` | `:root` переменные, `@font-face`, light theme |
| `css/foundation/header.css` | Шапка, навигация |
| `css/foundation/overlays.css` | Модалки, share-баннер, demo-баннер |
| `css/foundation/toasts.css` | Тосты |
| `css/foundation/action-chrome.css` | Кнопки |
| `css/features/runes/*.css` | Вкладка Runes (таблица, dashboard, rules UI…) |
| `css/features/gear/table-kind.css` | Artifacts / Relics таблицы |
| `css/features/teams/*.css` | Teams |
| `css/features/monsters/*.css` | Monsters (roster, detail, toolbar…) |
| `css/features/guide/archive.css` | Guide |
| `css/features/app/settings.css` | Settings |

Порядок сборки CSS: `tools/build-css.mjs` → массив `FILES`.

### JS — core (до UI)
| Путь | Назначение |
|------|------------|
| `js/core/meta.js` | `APP_VERSION`, константы статов |
| `js/core/i18n.js` | `TRANSLATIONS` EN + RU |
| `js/core/i18n-fr.js` | FR partial (lazy) |
| `js/core/defaults.js` | Пороги, роли, формулы, settings |
| `js/core/changelog-data.js` | `STATIC_CHANGELOG`, `STATIC_ROADMAP` |
| `js/core/bootstrap.js` | Сборка `window.SWRM` из defaults |

### JS — data
| Путь | Назначение |
|------|------------|
| `js/data/parser.js` | `parseSWEX`, `parseRune`, `parseUnits`, Eff% |
| `js/data/monster-db.js` | `monsters-index.json`, `SWRM_MONSTER_DB` |
| `js/data/skill-db.js` | `skills-index.json` + `metaById` (тултипы, Skill plan CD без API) |
| `js/data/gear/parse.js` | Артефакты/реликты из SWEX |
| `js/data/artifacts/effects.js` | Справочник эффектов артефактов |
| `js/data/relics/effects.js` | Типы реликтов, подписи |

### JS — engine (без DOM)
| Путь | Назначение |
|------|------------|
| `js/engine/engine-core.js` | `statMap`, HR anchor, sub helpers |
| `js/engine/engine-legacy-roles.js` | `checkRole`, `checkHighRoll`, duo |
| `js/engine/engine-gem-reapp-verdict.js` | Grind, Gem, Reapp, God sell |
| `js/advanced-formulas.js` | Формулы, `getAdvancedVerdict` |
| `js/engine/engine-process.js` | `processRune`, `processAll` |

### JS — workers
| Путь | Назначение |
|------|------------|
| `js/workers/rune-processor.worker.js` | `processAll` в фоне |
| `js/features/runes/rune-processor-worker.js` | `processRunesAsync` + fallback |

### JS — прочее до ui.js
| Путь | Назначение |
|------|------------|
| `js/self-test.js` | `SWRM.runSelfTests` |
| `js/swrm-motion.js` | GSAP-анимации |

### JS — features → `ui.js` (редактировать здесь)

Порядок concatenation: `tools/build-ui.mjs` (`CHUNKS` + `MONSTER_PARTS`).

**Shell / app**
| Файл | Роль |
|------|------|
| `shell/bootstrap.js` | Глобальное состояние приложения, табы |
| `shell/theme-nav.js` | Тема dark/light |
| `shell/i18n-bindings.js` | Привязка `TRANSLATIONS` к DOM, lazy FR |
| `shell/mobile-nav.js` | Мобильная навигация |
| `shell/filters-popover.js` | Поповеры фильтров |
| `shell/main-tabs.js` | Runes / Monsters / Guide / Changelog |

**Runes**
| Файл | Роль |
|------|------|
| `runes/stage-filters.js` | Стадия Early/Mid/Late |
| `runes/rune-processor-worker.js` | Async process |
| `runes/upload.js` | SWEX upload, demo, DB slots |
| `runes/utils.js` | Hydrate SWEX, empty state |
| `runes/verdict-filters.js` | Фильтр вердиктов |
| `runes/charts.js` | Графики |
| `runes/copy-summary.js` | Копирование сводки |
| `runes/stage-advisor-ui.js` | Stage Advisor |
| `runes/depth.js` | Depth analysis |
| `runes/dashboard.js` | Dashboard |
| `runes/rune-score.js` | Forge Score |
| `runes/table-row-render.js` | Строка таблицы |
| `runes/table-filters.js` | Фильтры таблицы |
| `runes/table.js` | Таблица рун |

**Gear**
| Файл | Роль |
|------|------|
| `gear/table-kind.js` | Runes / Artifacts / Relics sub-tabs |
| `gear/gear-roster-chips.js` | Чипы над таблицей gear |
| `gear/artifacts-table.js` | Таблица артефактов |
| `gear/relics-table.js` | Таблица реликтов |

**Rules**
| Файл | Роль |
|------|------|
| `rules/formulas-ui.js` | Редактор формул |
| `rules/panel.js` | Контейнер Rules |
| `rules/constants-ui.js` | Константы UI |
| `rules/bootstrap.js` | Init settings / restore |
| `rules/policy-ui.js` | Eval policy |

**App**
| Файл | Роль |
|------|------|
| `app/settings-ui.js` | App Settings |
| `app/share.js` | Share Profile, `?s=`, `?profile=`, `?data=` |
| `app/changelog.js` | Changelog / Roadmap UI |

**Monsters** (`MONSTER_PARTS` + `monsters/bootstrap.js`)
| Файл | Роль |
|------|------|
| `monsters/monsters-state.js` | Состояние, ключи localStorage |
| `monsters/monsters-hub.js` | Вкладка Monsters |
| `teams/storage.js` | Teams localStorage + share export |
| `teams/ui.js` | Teams UI, combat SPD, share view |
| `monsters/monsters-storage.js` | Фильтры, meta units |
| `monsters/monsters-bulk.js` | Bulk select / marks |
| `monsters/monsters-filters.js` | Логика фильтров |
| `monsters/box-overview.js` | Плитки обзора коробки |
| `monsters/monsters-stats-calc.js` | Статы, боевой SPD, парсинг тотема (`wizard_skill_list` skill_id 14) |
| `monsters/monsters-gear.js` | Gear на detail |
| `monsters/monsters-runes.js` | Руны на карточке |
| `monsters/monsters-detail.js` | Панель деталей |
| `monsters/monsters-card.js` | Карточки |
| `monsters/monsters-table.js` | Таблица |
| `monsters/monsters-list.js` | Список / enrich |
| `monsters/monsters-events.js` | События тулбара |
| `monsters/bootstrap.js` | Закрывает IIFE `ui.js` |

### tools/
| Активные | |
|----------|--|
| `build-ui.mjs` | Сборка `js/ui.js` |
| `build-css.mjs` | Сборка `css/dist/app.css` |
| `watch-ui.mjs` | Watch UI |
| `fetch-monsters-index.mjs` | Обновить `monsters-index.json` |
| `fetch-skills-index.mjs` | `skills-index.json` (+ `metaById`; `--fresh` для полной перекачки) |
| `extract-tab-icons.mjs` | Иконки вкладок |
| `inspect-totem-from-json.mjs` | Где в SWEX лежит уровень Sky Tribe Totem (skill_id 14) |

Одноразовые патчи: `tools/archive/` (не трогать).

### docs/
| Файл | Роль |
|------|------|
| `PROJECT-CONTEXT.md` | Короткий вход |
| `MASTER.md` | Этот справочник |
| `PLANS.md` | Открытый продуктовый backlog |
| `PLANS-LOCAL-ASSETS.md` | Эпик: локальные JSON + картинки вместо SWARFARM CDN |
| `ARCHITECTURE.md` | Runtime / build схема |
| `FEATURES.md` | Карта фич по папкам |
| `archive/MASTER-TASKS-DONE.md` | Архив блоков A/B/C (выполнено) |

### worker/
Cloudflare Worker + D1 — Share API (`worker/src/index.js`, `wrangler.toml`).

---

### `window.SWRM` — основные члены

Собирается по цепочке скриптов; в `ui.js` тот же объект + UI-хелперы.

| API | Модуль | Назначение |
|-----|--------|------------|
| `APP_VERSION` | bootstrap | Версия приложения |
| `settings`, `saveSettings` | defaults | Настройки пользователя |
| `TRANSLATIONS`, `STATIC_CHANGELOG`, `STATIC_ROADMAP` | i18n / changelog | UI тексты |
| `parseSWEX`, `parseRune`, `parseUnits` | parser | SWEX → руны/юниты |
| `calcEfficiency`, `calcEfficiencyUncapped` | parser | Eff% |
| `parseAccountGear`, `parseArtifact`, `parseRelic` | gear/parse | Gear |
| `formatGearEffectLine`, `formatArtifactSubLine` | gear/parse | Отображение stat lines |
| `processAll`, `processRune`, `getRuneVerdict` | engine | Вердикты рун |
| `getAdvancedVerdict`, `processAdvancedFormulas` | advanced-formulas | Формулы / роли |
| `checkRole`, `checkGrind`, `checkHighRoll` | engine | Правила ролей / grind |
| `processRunesAsync` | rune-processor-worker | Worker + fallback |
| `runSelfTests` | self-test | Самотест |
| `isShareReadOnly`, `getShareIdFromUrl`, `getProfileLinkFromUrl` | share (ui) | Share режимы |

Отдельно: `window.SWRM_MONSTER_DB` — индекс монстров (`loadMonsterIndex`, `monsterDisplayName`, `lookupMonster`).

---

### Внешние данные SWARFARM (что локально vs что с сети)

| Источник | Локально (`data/`) | По сети (рантайм) |
|----------|-------------------|-------------------|
| **Скиллы** | `skills-index.json`: max level, иконка, имя, описание, upgrades, CD | Fallback API только если `com2us_id` нет в индексе (`SWRM_LOCAL_ASSETS_ONLY` отключает API) |
| **Монстры** | `monsters-index.json` schema 2: имя, статы, `leader_skill`, портрет path | API деталки не вызывается, если строка полная (`monsterHasBundledDetail`) |
| **Картинки** | `assets/` + manifests (`skills-icons`, `leader-icons`, `monsters-portraits`, static bundle) | CDN fallback, пока файла нет в manifest; `SWRM_LOCAL_ASSETS_ONLY=true` — только локальные PNG |
| **Реликвии** | `assets/relics/*.png` (вручную) | — |
| **SWEX** | `demo.json` только для демо | Экспорт пользователя — всегда локально в браузере |

Иконки и статика кэшируются браузером; JSON индексов — с `?v=APP_VERSION`.

---

### CSS-переменные

**Правило:** в `css/features/` использовать только `var(--…)` из списка ниже (hex только в `base.css` / `tokens.css` как источник значений).

#### `css/foundation/base.css` — `:root` (dark)

| Группа | Переменные |
|--------|------------|
| Фоны | `--bg`, `--bg2`, `--bg3`, `--surface` |
| Бордеры | `--border`, `--border2` |
| Текст | `--text`, `--text-dim`, `--text-hi` |
| Акценты | `--accent`, `--accent2`, `--gold`, `--green`, `--red`, `--orange`, `--purple`, `--teal` |
| Звёзды | `--star-awaken` (розовый awaken, **не** `--purple`) |
| Вердикты | `--keep`, `--sell`, `--grind`, `--finish`, `--reapp`, `--upgrade`, `--gem` |
| Шрифты | `--font-ui`, `--font-head`, `--font-mono` |
| Радиус | `--radius`, `--radius-lg` |
| Лейаут | `--app-content-max`, `--content-max`, `--app-gutter` |
| Стадии | `--stage-early`, `--stage-mid`, `--stage-late` |
| Эффекты | `--glow-accent`, `--select-chevron`, `--stage-select-chevron` |
| Chips (база) | `--chip-surface-pct`, `--chip-border-base-pct` |
| Тинты статов | `--tint-spd`, `--tint-hp`, `--tint-atk`, `--tint-def`, `--tint-cr`, `--tint-cd`, `--tint-acc`, `--tint-res` |
| Тинты грейда | `--tint-legend`, `--tint-hero`, `--tint-rare` |
| Тинты прочие | `--tint-neutral`, `--tint-muted`, `--tint-ancient` |
| Тинты вердиктов | `--tint-keep`, `--tint-sell`, `--tint-grind`, `--tint-finish`, `--tint-reapp`, `--tint-upgrade`, `--tint-gem` |
| Тинты ролей | `--tint-highroll`, `--tint-bruiser`, `--tint-fastcc`, `--tint-tank`, `--tint-bomber`, `--tint-classicdps`, `--tint-slowdps`, `--tint-duoroll` |
| Eff tiers | `--tint-eff-hi`, `--tint-eff-mid`, `--tint-eff-lo` |

`.light-theme` переопределяет те же токены (см. `base.css`).

#### `css/features/monsters/tokens.css`

| Переменные |
|------------|
| `--monster-star-natural`, `--monster-star-awaken`, `--monster-star-stroke`, `--monster-star-shadow` |
| `--space-xs`, `--space-sm`, `--space-md`, `--space-lg` |
| `--text-caption`, `--text-secondary`, `--text-body`, `--text-xs`, `--text-sm`, `--text-md` |

---

## ЧАСТЬ 3: ПОРЯДОК ЗАГРУЗКИ

### CSS (`index.html`, `<head>`)
| # | Файл | Строка ~ |
|---|------|----------|
| — | `css/dist/app.css` | 21 |

Dev: `css/style.css` (только локально; prod использует `app.css`).

### JavaScript (`index.html`, конец `<body>`)

Все локальные скрипты с **`defer`**, кроме GSAP (блокирующий CDN + SRI).

| # | Файл | Строки `index.html` |
|---|------|---------------------|
| 1 | `js/core/meta.js` | 2846 |
| 2 | `js/core/i18n.js` | 2847 |
| 3 | `js/core/defaults.js` | 2848 |
| 4 | `js/core/changelog-data.js` | 2849 |
| 5 | `js/core/bootstrap.js` | 2850 |
| 6 | `js/data/artifacts/effects.js` | 2851 |
| 7 | `js/data/relics/effects.js` | 2852 |
| 8 | `js/data/gear/parse.js` | 2853 |
| 9 | `js/data/parser.js` | 2854 |
| 10 | `js/data/skill-db.js` | 2855 |
| 11 | `js/data/monster-db.js` | 2856 |
| 12 | `js/engine/engine-core.js` | 2857 |
| 13 | `js/engine/engine-legacy-roles.js` | 2858 |
| 14 | `js/engine/engine-gem-reapp-verdict.js` | 2859 |
| 15 | `js/advanced-formulas.js` | 2860 |
| 16 | `js/engine/engine-process.js` | 2861 |
| 17 | `js/self-test.js` | 2862 |
| 18 | GSAP 3.12.7 CDN (`integrity` + `crossorigin`) | 2863–2865 |
| 19 | `js/swrm-motion.js` | 2866 |
| 20 | `js/ui.js` | 2867 |

**Lazy (не в HTML):** `js/core/i18n-fr.js` — подгружается при выборе FR в `i18n-bindings.js`.

**Worker:** `js/workers/rune-processor.worker.js` — создаётся из `rune-processor-worker.js`, не в HTML.

### Порядок `ui.js` (внутри одного IIFE)

См. `tools/build-ui.mjs`: `CHUNKS` (shell → runes → gear → rules → app) → `MONSTER_PARTS` → `monsters/bootstrap.js` (единственный файл с закрывающим `})();`).

---

## ЧАСТЬ 4: ПРАВИЛА ДЛЯ КАЖДОГО ИЗМЕНЕНИЯ

### 1. Changelog (`js/core/changelog-data.js`)

- Только блок **сегодняшней даты**; один день = один блок; новые пункты **в начало** `en[]` / `ru[]`.
- **EN и RU:** одинаковое число пунктов, один порядок.
- Текст для **игрока**: руны, 6★, SWEX, Keep/Sell, Monsters, Share — без имён файлов, npm, Worker, «Block A».
- Объединяй мелочи одной темы в **один** пункт.
- После записи убери задачу из [`PLANS.md`](PLANS.md).

### 1b. Roadmap (`STATIC_ROADMAP` в том же файле)

- Источник правды — [`PLANS.md`](PLANS.md); Roadmap = **краткая копия для игроков** (те же разделы, смысл пунктов).
- EN + RU синхронны с PLANS; без путей, API, Worker, Database Slots, localStorage.
- FR — тот же смысл, можно короче. Закрытый пункт — убрать и из PLANS, и из Roadmap.

### 2. i18n (`js/core/i18n.js`)

- Любая новая UI-строка → ключ в **EN и RU**.
- Плоский namespace, без HTML в строках.
- FR → `js/core/i18n-fr.js` + загрузка в `i18n-bindings.js`.

### 3. CSS

- Цвета только `var(--…)` в `css/features/`.
- Новый файл → добавить в `tools/build-css.mjs` (`FILES`) → `npm run build:css`.
- Dev-цепочка: `@import` в `css/features/*/index.css` (опционально).

### 4. Build

| Изменили | Команда |
|----------|---------|
| `js/features/**` | `npm run build:ui` |
| CSS из списка `build-css.mjs` | `npm run build:css` |
| Оба | `npm run build` |

### 5. Новый файл в `ui.js`

1. Создать `js/features/.../file.js`
2. Добавить путь в `tools/build-ui.mjs` (`CHUNKS` или `MONSTER_PARTS`) с учётом зависимостей
3. `npm run build:ui`

---

## ЧАСТЬ 5: АРХИВ ИСПОЛНЯЕМЫХ ЗАДАЧ (A / B / C)

Блоки **A** (критичные), **B** (важные), **C** (build/worker/fonts) **выполнены**.  
Подробные инструкции «было / стало» с номерами строк — в [`docs/archive/MASTER-TASKS-DONE.md`](archive/MASTER-TASKS-DONE.md).  
Итог для пользователей: **Changelog → 2026-05-22**.

**Не искать новые задачи в MASTER** — только [`PLANS.md`](PLANS.md).

---

## ЧАСТЬ 6: ПРАВИЛА ДЛЯ НОВЫХ ФИЧЕЙ

1. **CSS** — файл в `css/features/[feature]/`, строка в `tools/build-css.mjs`, `npm run build:css`
2. **JS** — файл в `js/features/`, строка в `tools/build-ui.mjs`, `npm run build:ui`
3. **i18n** — EN + RU (+ FR при необходимости)
4. **Changelog** — сегодняшний блок, игровой язык
5. **PLANS** — убрать выполненный пункт

### Данные монстров / скиллов
```bash
node tools/fetch-monsters-index.mjs
node tools/fetch-skills-index.mjs --fresh   # полная перекачка skills + meta (~1.6 MB JSON)
```
После обновления JSON — поднять `APP_VERSION` в `js/core/meta.js` и задеплоить `data/*.json` вместе с сайтом.

**Что остаётся с SWARFARM в рантайме (см. § «Внешние данные» ниже):** картинки (портреты, иконки скиллов/элементов/артефактов/сетов рун), опционально API одного монстра для базовых статов в деталке, fallback meta скилла если id нет в индексе.

### Worker (Share)
```bash
cd worker && npx wrangler deploy
```

---

## ЧАСТЬ 7: ТЕХНИЧЕСКИЙ ДОЛГ

| # | Проблема | Статус |
|---|----------|--------|
| 1 | Остаточные hex в `css/features/` | Частично закрыто |
| 2 | `index.html` монолит (~250 KB) | Открыто |
| 3 | Нет минификации JS/CSS | Открыто |
| 4 | Нет `npm run watch:css` | Открыто |

Закрыто (не возвращать в backlog): `@import` prod → `app.css`; Google Fonts → local; `processAll` worker; `tools/archive/`.

---

## ЧАСТЬ 8: БЫСТРЫЕ КОМАНДЫ

```bash
npm run build:ui
npm run build:css
npm run build
npm run watch:ui

node tools/fetch-monsters-index.mjs
node tools/fetch-skills-index.mjs

cd worker && npx wrangler deploy && cd ..
```

Поиск hex в features (PowerShell / git bash):
```bash
rg "#[0-9a-fA-F]{6}" css/features/ -g "*.css"
```

---

## ЧАСТЬ 9: СВЯЗЬ С ДРУГИМИ ДОКУМЕНТАМИ

| Вопрос | Файл |
|--------|------|
| Быстрый старт AI | `PROJECT-CONTEXT.md` |
| Как устроен runtime | `ARCHITECTURE.md` |
| Где код фичи | `FEATURES.md` |
| **Что делать дальше в продукте** | **`PLANS.md`** + Changelog → Roadmap |
| История задач A/B/C | `archive/MASTER-TASKS-DONE.md` |

---

*При изменении структуры репозитория обновляй **Часть 2** и `tools/build-*.mjs`. Backlog не добавляй в MASTER — только в PLANS.*
