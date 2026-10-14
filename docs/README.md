# Документация SW Forge

Единая карта документации проекта: где искать правила, код, тесты и игровые механики.

---

## Порядок изучения документации

| № | Документ | Описание |
|---|---|---|
| **00** | [`00-MASTER.md`](00-MASTER.md) | **Точка входа**: стек, пути к коду, порядок загрузки скриптов, правила правок |
| **01** | [`01-GAME-OVERVIEW.md`](01-GAME-OVERVIEW.md) | **Контекст игры**: руны, артефакты, монстры, термины SWEX |
| **02** | [`02-GAME-KNOWLEDGE.md`](02-GAME-KNOWLEDGE.md) | **Игровая логика**: правила слотов, заточки (grind), переточки (gem) |
| **03** | [`03-PROJECT-STRUCTURE.md`](03-PROJECT-STRUCTURE.md) | **Архитектура**: карта всех JS/CSS модулей и зависимости `window.SWRM` |
| **04** | [`04-API-REFERENCE.md`](04-API-REFERENCE.md) | **Справочник API**: методы `window.SWRM` и CSS-переменные |
| **05** | [`05-WORKFLOWS.md`](05-WORKFLOWS.md) | **Сценарии работы**: добавление фич, переводов, отладка |
| **06** | [`06-DEBUGGING.md`](06-DEBUGGING.md) | **Отладка**: частые ошибки и чек-листы |
| **07** | [`07-TESTING.md`](07-TESTING.md) | **Тестирование**: набор Vitest (50 тестов), запуск и TDD |
| **08** | [`08-DEVELOPMENT-TOOLS.md`](08-DEVELOPMENT-TOOLS.md) | **Инструменты**: ESLint, Prettier, Stylelint, скрипты сборки |
| **09** | [`09-CI-CD.md`](09-CI-CD.md) | **Деплой**: GitHub Actions, Cloudflare Pages и Workers |
| **11** | [`11-BACKLOG.md`](11-BACKLOG.md) | **Бэклог**: список задач и багов |
| **12** | [`12-AI-ASSISTANT.md`](12-AI-ASSISTANT.md) | **Памятка для AI-агентов** |
| **13** | [`13-RESEARCH-ARTIFACT-SCORING.md`](13-RESEARCH-ARTIFACT-SCORING.md) | **Исследования**: формула очков артефактов |
| — | [`DEFAULTS-REFATORING-ANALYSIS.md`](DEFAULTS-REFATORING-ANALYSIS.md) | **Анализ**: разбор сложностей распила `defaults.js` |

---

## Быстрый маршрут для разработчика

| Вопрос | Где смотреть |
|--------|----------------|
| С чего начать сессию правок | [`00-MASTER.md`](00-MASTER.md) — стек, build, правила правок |
| **Игровая терминология, механика** | [`02-GAME-KNOWLEDGE.md`](02-GAME-KNOWLEDGE.md) — engine EN, display localized, game rules |
| Где лежит файл / API `SWRM` | [`00-MASTER.md`](00-MASTER.md) — точка входа, правила правок, ссылки |
| Карта файлов, порядок загрузки, фичи | [`03-PROJECT-STRUCTURE.md`](03-PROJECT-STRUCTURE.md) |
| `window.SWRM` API + CSS переменные | [`04-API-REFERENCE.md`](04-API-REFERENCE.md) |
| Открытые баги + feature backlog | [`11-BACKLOG.md`](11-BACKLOG.md) |
| Что уже вышло (игрокам) | Changelog → **Releases** (`js/core/changelog-data.js`) |
| Справка для игроков (EN/RU в HTML) | **`index.html`** → `#tab-guide` (не в `docs/`) |

**Правило:** сделанное для игроков → новый пункт в `changelog-data.js` (перед изменением спросить у пользователя текущую дату; дата = дата из контекста или указанная пользователем; все изменения за один день в одну запись; писать крупные обновления без технических терминов); закрытое из планов → убрать из [`BACKLOG.md`](BACKLOG.md) и Roadmap.

---

## Два слоя документации

### 1. `docs/` — для кода

Технические контракты: какие файлы трогать, как собирать `ui.js` / `app.css`, что не коммитить руками.

### 2. Guide + Changelog в приложении — для игроков

| Вкладка | Файл-источник | Содержание |
|---------|---------------|------------|
| **Guide** | `index.html` (`#tab-guide`, панели `guide-panel-*`) | Пошагово: Dashboard, таблица рун, оценка, Rules. EN + RU inline. |
| **Changelog → Releases** | `js/core/changelog-data.js` → `STATIC_CHANGELOG` | Что вышло (новое сверху). |
| **Changelog → Roadmap** | тот же файл → `STATIC_ROADMAP` | Краткая копия [`BACKLOG.md`](BACKLOG.md). |

Подписи кнопок/колонок — `js/core/translations-en.js` + `translations-ru.js` (→ `translations.js`), FR lazy в `translations-fr.js`.

---

## Темы → файлы (шпаргалка)

### Таблица рун

| Тема | Код | Документация игрока |
|------|-----|---------------------|
| Колонки Ingame / Forge / Location | `js/data/ingame-score.js`, `js/features/runes/table-row-render.js`, `table.js` | Guide → Rune Table |
| SWOP Eff% (не в таблице) | `js/data/parser.js` (`calcEfficiency`) | Guide → Progression + примечание в Table |
| Forge Score | `js/features/runes/rune-score.js` | Guide → Rune Table → Forge |
| Вердикты / причина в тултипе | `js/engine/*`, `table-row-render.js` (`runeVerdictTipText`) | Guide → How scoring works |
| Фильтры, сорт, CSV | `table-filters.js`, `table.js` | Guide → Table toolbar |
| **Статы в ячейках (EN engine / FR PV,VIT…)** | `meta.js` (`displayStatForUi`), `table-row-render.js` | [`GAME-KNOWLEDGE.md`](GAME-KNOWLEDGE.md) |

### Артефакты / реликвии

| Тема | Код | Заметка |
|------|-----|---------|
| Artifact Ingame Score | `js/data/artifact-ingame-score.js` | `ARTIFACT_INGAME_WEIGHTS`, `artifactIngameScoreBreakdown()`; коэффициенты калибруются без denominator/max-roll логики |
| Таблица артефактов | `js/features/gear/artifacts-table.js`, `css/features/gear/table-kind.css` | Сортировка по заголовкам как у Rune Table; Ingame / Forge / Role / Location отделены визуально |
| Таблица реликвий | `js/features/gear/relics-table.js`, `css/features/gear/table-kind.css` | Сортировка по заголовкам, единый визуальный стиль с Rune Table |
| Dashboard артефактов | `js/features/gear/dashboard-artifacts.js` | Аналог rune dashboard: verdict/role/type/attribute/score distributions |

### Монстры / Teams / Share

| Тема | Код |
|------|-----|
| Roster, detail, gear на юните | `js/features/monsters/*` |
| Combat SPD, totem | `monsters-stats-calc.js`, `teams/ui.js` — см. `03-PROJECT-STRUCTURE.md` |
| Share Worker | `js/features/app/share.js`, `worker/` |

### Правила рун (Expert)

| Тема | Код |
|------|-----|
| Constants, policy, formulas UI | `js/features/rules/*`, `js/core/defaults.js` |
| Движок без DOM | `js/engine/*`, `js/advanced-formulas.js` |

---

## Что обновлять при типичных изменениях

| Изменение | Обновить |
|-----------|----------|
| Видимая фича для игрока | `changelog-data.js` (en/ru/fr, одинаковое число пунктов) |
| Колонки / формулы таблицы | `index.html` Guide (EN+RU) + при необходимости `00-MASTER.md` / `03-PROJECT-STRUCTURE.md` |
| Новый модуль в load chain | `index.html` + `03-PROJECT-STRUCTURE.md` + `00-MASTER.md` § load order |
| Новая папка в `js/features/` | `tools/build-ui.mjs` + `03-PROJECT-STRUCTURE.md` |
| Строки UI | `translations-en.js` + `translations-ru.js` → `npm run build:translations`; FR → `translations-fr.js` |

Не править вручную: `js/ui.js`, `css/dist/app.css`.
