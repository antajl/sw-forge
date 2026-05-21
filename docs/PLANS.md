# SW Rune Master — планы (roadmap)

Краткая версия отображается во вкладке **Changelog → Roadmap** (`js/core/changelog-data.js`).  
Детальный план вкладки Monsters: **`docs/PLANS-MONSTERS.md`**.

---

## Контекст: что Com2uS не закрыл (уроки SWARFARM, 2026)

В игре за годы закрыли много «личного» (руны, корм, слияния). С закрытием публичных профилей SWARFARM комьюнити сильнее всего потеряло **социальное** и **командное**.

### 1. Публичные профили (Account Reviews) — критично для комьюнити

**Статус в игре:** по-прежнему нельзя расшарить аккаунт ссылкой; совет — скрины или Discord.

**Было на SWARFARM:** ссылка → полный разбор коробки, сортировка по качеству рун, артефакты, указание на ошибки сборки.

**У нас:** только локальный SWEX в браузере сегодня. **Публичный share — в scope как чистый фронтенд (GitHub Pages):** без своего сервера, через `?profile=https://…/export.json` (чтение JSON по ссылке) и/или `?data=…` (сжатая строка с данными аккаунта в URL). Ограничения: длина URL, CORS у хостинга JSON, размер экспорта — нужен компрессор и лимиты.

### 2. Skill-up'ы и девилмоны на уровне аккаунта

**Статус в игре:** по одному мобу «сколько свитков сейчас» — есть; долгосрочного плана по всему аккаунту — нет.

**Было на SWARFARM:** сводка: сколько девилмонов до ключевых Nat5 в пачках, у кого скиллы «застряли» на половине.

**У нас:** задел во вкладке Monsters (скиллы из SWEX, план: дефицит до max, фильтры max / needs skill-up). Полная **аккаунт-wide** аналитика — отдельный эпик (см. Monsters E).

### 3. Команды (Teams) с привязкой к сборкам и speed tuning

**Статус в игре:** Layout / копирование рун, «Инфо» — усреднённые пачки.

**Было на SWARFARM:** авторские гайды (ToA Hell, Siege, Cairos) с **реальным** speed tuning и порядком ходов.

**У нас:** сохранённые деки в localStorage без share URL — в roadmap (Monsters, низкий приоритет).

---

## Уже сделано (убрано из активного roadmap)

- Навигация: хаб Runes + вкладка **Monsters**, один SWEX.
- Monsters MVP: 6★ roster, фильтры, карточки/список, плавающий detail, руны на карточке, SWARFARM имена/иконки, ★/🍖, открытие рун в таблице, фильтр монстра в Rune Table.
- Runes: движок, таблица, dashboard, depth, changelog/guide субтабы, i18n EN/RU/FR (частично).

---

## Категория: Monsters

См. **`docs/PLANS-MONSTERS.md`** — что уже в сборке (MVP закрыт).

**Активный roadmap в UI:** Changelog → Roadmap (`js/core/changelog-data.js` → `STATIC_ROADMAP`).

Кратко по приоритету (сверху вниз в Changelog → Roadmap):

1. **Box overview** на Roster (плитки, readiness, next actions).
2. **Account-wide:** devilmon/skill planner, fusion tracker, Monster Builder lite, richer Teams.
3. **Monsters → Dashboard** (опционально): score, графики, drill-down, связка с Rune depth.
4. **Share** — account review по ссылке.
5. **Runes** — Rune Score, diff слотов, God hint, Grind.
6. **Roster depth** — compare, duplicates, presets, tags.
7. **Artifacts** · **Guide FR** · **Builders** (горизонт).

---

## Категория: Runes

- **Rune Score** — колонка в таблице (сила/слабость), без дублирования Sell.
- **Сравнение двух слотов SWEX** — diff вердиктов и ролей.
- **God potential** — информационная подсказка в строке (не вердикт).
- **Жёстче Grind** — опциональное правило (eff / HR subs).

---

## Категория: Artifacts

- Отдельная вкладка: парсинг SWEX, фильтры, свой движок правил (крупный scope).

---

## Категория: Guide & i18n

- Французские тексты Guide для Monsters (и позже Artifacts).
- Дополнение FR-строк UI для Monsters.

---

## Категория: Share & profiles (frontend-only)

- **Share URL** на GitHub Pages: `?profile=` внешний JSON или `?data=` сжатый payload (LZ-string / аналог).
- Read-only просмотр чужого ростера / рун (account review) без бэкенда.
- Синхронизация между устройствами «как облако» без сервера — только если пользователь сам хостит JSON.

## Категория: Out of scope

- Собственный бэкенд / аккаунты / база профилей на нашем сервере.
- Community drop logs (Cairos / Rift / SD).
- Полный клон bestiary SWARFARM — ссылки на swarfarm.com для множителей и справки.

---

## Категория: Инфра / dev

- Сборка `ui.js` из `js/features/` (не закрывать IIFE в середине feature-частей).
- При необходимости: skill max-level DB для Monsters (JSON рядом с `monsters-index.json`).
