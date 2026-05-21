# SW Rune Master — планы (roadmap)

Краткая версия отображается во вкладке **Changelog → Roadmap** (`js/core/changelog-data.js`).  
Детальный план вкладки Monsters: **`docs/PLANS-MONSTERS.md`**.

---

## Контекст: что Com2uS не закрыл (уроки SWARFARM, 2026)

В игре за годы закрыли много «личного» (руны, корм, слияния). С закрытием публичных профилей SWARFARM комьюнити сильнее всего потеряло **социальное** и **командное**.

### 1. Публичные профили (Account Reviews) — критично для комьюнити

**Статус в игре:** по-прежнему нельзя расшарить аккаунт ссылкой; совет — скрины или Discord.

**Было на SWARFARM:** ссылка → полный разбор коробки, сортировка по качеству рун, артефакты, указание на ошибки сборки.

**У нас:** read-only **Share Profile** через Cloudflare Worker + D1 (2026-05-20). Дальше — mentor account review, опционально `?profile=` / `?data=` без Worker.

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
- **Box overview** на Roster (плитки, readiness, фильтры по клику) — 2026-05-21.
- Runes: движок, таблица, dashboard, depth, **Forge Score**, changelog/guide субтабы, i18n EN/RU/FR (частично).
- Runes → Table: вкладки **Artifacts / Relics** (таблицы + парсинг SWEX); gear на detail Monsters.
- Share Profile (Worker + D1), логотипы/favicon.

---

## Категория: Monsters

См. **`docs/PLANS-MONSTERS.md`** — что уже в сборке (MVP закрыт).

**Активный roadmap в UI:** Changelog → Roadmap (`js/core/changelog-data.js` → `STATIC_ROADMAP`).

Кратко по приоритету (сверху вниз в Changelog → Roadmap):

1. **Account-wide:** devilmon/skill planner, fusion tracker, Monster Builder lite, richer Teams.
2. **Monsters → Dashboard** (опционально): score, графики, drill-down, связка с Rune depth.
3. **Share (частично)** — mentor account review, Teams в payload, опционально URL без Worker.
4. **Runes** — diff слотов, God hint, Grind, тюнинг Forge Score.
5. **Roster depth** — compare, duplicates, presets, tags.
6. **Artifacts/relics (частично)** — движок правил gear; опционально отдельная вкладка.
7. **Guide FR** · **Builders** (горизонт).

---

## Категория: Runes

- **Forge Score** — колонка в таблице (отдельно от Eff% и вердикта); Guide → Rune Table.
- **Сравнение двух слотов SWEX** — diff вердиктов и ролей.
- **God potential** — информационная подсказка в строке (не вердикт).
- **Жёстче Grind** — опциональное правило (eff / HR subs).

---

## Категория: Artifacts & relics

- **Сделано:** таблицы под Runes → Table, парсинг SWEX, gear на Monsters detail.
- **В планах:** движок правил Keep/Sell для gear (отдельно от рун); опционально верхняя вкладка.

---

## Категория: Guide & i18n

- Французские тексты Guide для Monsters (и позже Artifacts).
- Дополнение FR-строк UI для Monsters.

---

## Категория: Share & profiles

- **Сделано:** Share Profile (Worker + D1), режимы из App Settings.
- **Дальше:** account review banner для наставника; `?profile=` / `?data=` без Worker; Teams в share payload.

## Категория: Out of scope

- Собственный бэкенд / аккаунты / база профилей на нашем сервере.
- Community drop logs (Cairos / Rift / SD).
- Полный клон bestiary SWARFARM — ссылки на swarfarm.com для множителей и справки.

---

## Категория: Инфра / dev

- Сборка `ui.js` из `js/features/` (не закрывать IIFE в середине feature-частей).
- При необходимости: skill max-level DB для Monsters (JSON рядом с `monsters-index.json`).
