# План: локальные ассеты вместо SWARFARM CDN

> Долгий эпик. Краткий backlog в [`PLANS.md`](PLANS.md) §9.  
> Техсправка: [`MASTER.md`](MASTER.md) → «Внешние данные SWARFARM».

**Цель:** JSON и картинки лежат на том же origin, что и сайт (Cloudflare Pages). Меньше зависимости от swarfarm.com, стабильнее кэш, предсказуемая скорость.  
**Не цель:** полный офлайн-клон SWARFARM или авто-синк после каждого патча игры без ручного шага.

---

## Уже сделано

| Что | Где | Обновление |
|-----|-----|------------|
| Скиллы (max, meta, иконки filename) | `data/skills-index.json` | `node tools/fetch-skills-index.mjs --fresh` |
| Имена/мета монстров (индекс) | `data/monsters-index.json` | `node tools/fetch-monsters-index.mjs` |
| Иконки реликвий (ручные) | `assets/relics/` | вручную |

---

## Целевая структура папок

```
data/
  README.md
  skills-index.json          # уже есть (schema 2 + metaById)
  monsters-index.json        # уже есть
  demo.json

assets/
  README.md                  # общие правила имён и лицензии
  relics/                    # уже есть — PNG по типу реликта
  monsters/                  # портреты: {image_filename} из индекса
    units/                   # зеркало SWARFARM paths при необходимости
  skills/                    # static/herders/images/skills/{icon_filename}
  elements/                  # fire.png, water.png, …
  artifacts/                 # иконки типов артефактов (SWARFARM paths)
  runes/                     # sets: energy.png, violent.png, …
  skills/leader/               # leader_skill_{Attr}_{Area}.png
  ui/                        # devilmon, tab icons (уже частично в assets/)
```

**Правило URL в коде:** один хелпер `SWRM.assetUrl(category, filename)` → `/assets/...` с fallback на `swarfarmAssetUrl()` пока миграция не завершена.

---

## Фазы (рекомендуемый порядок)

### Фаза A — JSON (низкий риск)

- [x] `skills-index.json` + meta (описания, upgrades, CD)
- [x] Расширить `monsters-index.json`: base stats, leader_skill (schema 2, `fetch-monsters-index.mjs --fresh`)
- [x] Деталка монстра: без SWARFARM API, если строка индекса полная (`monsterHasBundledDetail`)
- [x] `monsters-index.json` schema 2 перекачан локально (деплой на прод — при релизе)

**Скрипты:** `tools/fetch-skills-index.mjs`, `tools/fetch-monsters-index.mjs` (доработать ingest).

### Фаза B — мелкие static (быстро, мало файлов)

- [x] `assets/elements/` (~5 PNG) — `npm run fetch:static-bundle`
- [x] `assets/runes/sets/` (~23 PNG)
- [x] `assets/ui/devilmon.png`, `assets/artifacts/` (типы из gear/icons)
- [x] `tools/fetch-static-bundle.mjs` + `data/static-manifest.json`
- [x] `js/data/local-assets.js` + wiring в `monster-db`, `gear/icons`, `skill-db`
- [x] `assets/skills/leader/` — `npm run fetch:leader-icons` (manifest + CDN fallback)

**Оценка размера:** &lt; 5 MB.

### Фаза C — артефакты (средний объём)

- [x] `assets/artifacts/` по ключам из `js/data/gear/icons.js` (входит в `fetch:static-bundle`)
- [x] Переключить `artifactIconUrl()` на локальный путь

**Оценка:** десятки файлов, &lt; 10 MB.

### Фаза D — иконки скиллов (~5k)

- [x] `assets/skills/` — 3976/3976 имён в manifest (`fetch:missing-assets` + `skill-icon-overrides.json` для CDN 404)
- [x] `skillIconUrl()` → локально только если файл в `data/skills-icons-manifest.json`; иначе SWARFARM/proxy
- [x] `tools/fetch-skills-icons.mjs` — `npm run fetch:skills-icons`

**Оценка:** ~5k PNG, **50–150 MB** — основной вес репозитория. Вариант: отдельный R2 bucket + CDN, в репо только manifest.

### Фаза E — портреты монстров (самый тяжёлый)

- [x] `assets/monsters/` — 2121 PNG в manifest (2 файла не найдены на SWARFARM → CDN fallback)
- [x] `monsterImageUrl()` / `bindMonsterPortrait` — local-first + SWARFARM fallback
- [ ] Lazy (опционально): качать только монстров из SWEX пользователя

**Оценка:** 2000+ файлов, **100–300 MB** если полный bestiary. Практичный вариант: **on-demand** из экспорта пользователя (только его box) — отдельный подпункт.

### Фаза F — отключение fallback

- [x] Флаг `SWRM_LOCAL_ASSETS_ONLY` в `js/core/meta.js` (по умолчанию `false`)
- [x] При `true`: без CDN для manifest-картинок; без runtime API монстров/скиллов (только bundled JSON)
- [ ] Включить `true` на проде, когда деплой `assets/` + manifests полный (опционально)

---

## Плюсы / минусы «всё у нас»

| Плюсы | Минусы |
|-------|--------|
| Не зависим от uptime SWARFARM | Большой deploy (особенно портреты) |
| Один CDN, один cache policy | После патча игры — перекачка скриптом |
| Быстрее повторные визиты | Git LFS или внешнее хранилище для PNG |
| Проще Share/демо без внешних запросов | Юридически: ассеты Com2uS — оставить атрибуцию SWARFARM |

**Вывод:** JSON + мелкий static — **однозначно да**. Тысячи портретов — **да, но** через manifest + R2 или выборочно, не обязательно в git.

---

## Чеклист перед закрытием эпика

1. [x] `MASTER.md` таблица «внешние данные» обновлена.
2. [x] `data/README.md` + `assets/README.md` — команды `npm run fetch:*`.
3. [ ] CI / лимит размера Cloudflare Pages (проверить размер `assets/` + `data/` в деплое).
4. [x] Changelog (без путей к tools).

### Деплой на Pages (один раз после миграции)

Залить вместе с билдом:

- `assets/` (elements, runes, artifacts, ui, skills, skills/leader, monsters)
- `data/skills-index.json`, `data/monsters-index.json`
- `data/*-manifest.json`, `data/static-manifest.json`

Затем hard refresh. Обновление данных: `npm run fetch:data` и `npm run fetch:assets` (см. `package.json`).
