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
- [ ] Расширить `monsters-index.json`: base stats, leader_skill в индекс (сейчас часть тянется API в деталке)
- [ ] Версия/schema в JSON + bump `APP_VERSION` после каждого обновления

**Скрипты:** `tools/fetch-skills-index.mjs`, `tools/fetch-monsters-index.mjs` (доработать ingest).

### Фаза B — мелкие static (быстро, мало файлов)

- [ ] `assets/elements/` (~5 PNG)
- [ ] `assets/runes/sets/` (~20–40 PNG)
- [ ] `assets/ui/devilmon.png`, leader skill tiles
- [ ] `tools/fetch-static-bundle.mjs` — скачать список URL в manifest

**Оценка размера:** &lt; 5 MB.

### Фаза C — артефакты (средний объём)

- [ ] `assets/artifacts/` по ключам из `js/data/gear/icons.js`
- [ ] Переключить `artifactIconUrl()` на локальный путь

**Оценка:** десятки файлов, &lt; 10 MB.

### Фаза D — иконки скиллов (~5k)

- [ ] `assets/skills/` по `byIcon` из `skills-index.json`
- [ ] `skillIconUrl()` → локально; SWARFARM только для отсутствующих id после патча

**Оценка:** ~5k PNG, **50–150 MB** — основной вес репозитория. Вариант: отдельный R2 bucket + CDN, в репо только manifest.

### Фаза E — портреты монстров (самый тяжёлый)

- [ ] `assets/monsters/` только для `image_filename` из `monsters-index.json` (не весь bestiary)
- [ ] Lazy: качать только монстров, встречающихся в типичном SWEX + полный индекс опционально

**Оценка:** 2000+ файлов, **100–300 MB** если полный bestiary. Практичный вариант: **on-demand** из экспорта пользователя (только его box) — отдельный подпункт.

### Фаза F — отключение fallback

- [ ] Флаг `SWRM_LOCAL_ASSETS_ONLY` (dev) / настройка после покрытия
- [ ] Убрать прямые вызовы SWARFARM API кроме обновления индексов разработчиком

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

1. `MASTER.md` таблица «внешние данные» — только manifest/fetch для dev.
2. `data/README.md` + `assets/README.md` — команды обновления.
3. CI не ломается (лимит размера Pages).
4. Changelog + Roadmap для игроков (без путей к tools).
