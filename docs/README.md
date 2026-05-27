# Документация SW Forge

Карта для **разработчика и AI**: где искать правила, код и тексты для игроков.

## Быстрый маршрут

| Вопрос | Где смотреть |
|--------|----------------|
| С чего начать сессию правок | [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) — стек, build, 5 правил |
| Где лежит файл / API `SWRM` | [`MASTER.md`](MASTER.md) — карта репо, load order, CSS vars, changelog rules |
| Что делать дальше (backlog) | [`PLANS.md`](PLANS.md) + в приложении Changelog → **Roadmap** |
| Что уже вышло (игрокам) | Changelog → **Releases** (`js/core/changelog-data.js`) |
| Порядок скриптов и сборка UI/CSS | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Папки `js/features/*` | [`FEATURES.md`](FEATURES.md) |
| Справка для игроков (EN/RU в HTML) | **`index.html`** → `#tab-guide` (не в `docs/`) |

**Правило:** сделанное для игроков → новый пункт в `changelog-data.js` (дата = сегодня); закрытое из планов → убрать из `PLANS.md` и Roadmap.

---

## Два слоя документации

### 1. `docs/` — для кода и AI

Технические контракты: какие файлы трогать, как собирать `ui.js` / `app.css`, что не коммитить руками.

### 2. Guide + Changelog в приложении — для игроков

| Вкладка | Файл-источник | Содержание |
|---------|---------------|------------|
| **Guide** | `index.html` (`#tab-guide`, панели `guide-panel-*`) | Пошагово: Dashboard, таблица рун, оценка, Rules. EN + RU inline. |
| **Changelog → Releases** | `js/core/changelog-data.js` → `STATIC_CHANGELOG` | Что вышло (новое сверху). |
| **Changelog → Roadmap** | тот же файл → `STATIC_ROADMAP` | Краткая копия [`PLANS.md`](PLANS.md). |

Подписи кнопок/колонок — `js/core/i18n.js` (+ `i18n-fr.js` lazy).

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
| Combat SPD, totem | `monsters-stats-calc.js`, `teams/ui.js` — см. `FEATURES.md` |
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
| Колонки / формулы таблицы | `index.html` Guide (EN+RU) + при необходимости `MASTER.md` / `FEATURES.md` |
| Новый модуль в load chain | `index.html` + `ARCHITECTURE.md` + `MASTER.md` § load order |
| Новая папка в `js/features/` | `tools/build-ui.mjs` + `FEATURES.md` |
| Строки UI | `i18n.js` (en+ru), опционально `i18n-fr.js` |

Не править вручную: `js/ui.js`, `css/dist/app.css`.
