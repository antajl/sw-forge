# Изменения за 14 июля 2026

## Документация

### Реструктуризация документации
- Добавлены числовые префиксы к файлам документации для логического порядка чтения:
  - `MASTER.md` → `00-MASTER.md`
  - `GAME-OVERVIEW.md` → `01-GAME-OVERVIEW.md`
  - `GAME-KNOWLEDGE.md` → `02-GAME-KNOWLEDGE.md`
  - `PROJECT-STRUCTURE.md` → `03-PROJECT-STRUCTURE.md`
  - `API-REFERENCE.md` → `04-API-REFERENCE.md`
  - `WORKFLOWS.md` → `05-WORKFLOWS.md`
  - `DEBUGGING.md` → `06-DEBUGGING.md`
  - `TESTING.md` → `07-TESTING.md`
  - Создан `08-DEVELOPMENT-TOOLS.md`
  - Создан `09-CI-CD.md`
  - `BACKLOG.md` → `11-BACKLOG.md`
  - `AI-ASSISTANT.md` → `12-AI-ASSISTANT.md`
  - `ARTIFACT_SCORING_RESEARCH.md` → `13-RESEARCH-ARTIFACT-SCORING.md`
- Создан `00-README.md` как гид для AI с порядком чтения документации
- Удален `ARCHITECTURE-ROADMAP.md` (завершенный roadmap)
- Удален `DEPENDENCY-MAP.md` (контент объединен в `03-PROJECT-STRUCTURE.md`)
- Обновлены все внутренние ссылки для соответствия новым именам файлов
- Убраны упоминания AI из `docs/README.md` (только для разработчиков)
- Обновлен `docs/09-CI-CD.md` с Node.js v20 и новыми правами API токена

## Git Cleanup

### Удалены ненужные файлы
- Pinegrow файлы: `pinegrow.json`, `_pgbackup/`, `_pginfo/`
- Wrangler кэш: `worker/.wrangler/`
- IDE конфиги: `.cursor/`, `.devin/`, `.vscode/`, `.husky/`
- Обновлен `.gitignore` для исключения этих файлов

### Удалены зависимости
- Удален `husky` из `package.json` и `"prepare": "husky"` из scripts
- Git hooks больше не используются (можно запускать `npm run lint` вручную)

## Домен

### Настройка sw-forge.ru
- Куплен домен sw-forge.ru
- Добавлен в Cloudflare DNS
- Добавлен как custom domain в Cloudflare Pages
- Обновлены URL в проекте:
  - `README.md`: 3 замены sw-forge.pages.dev → sw-forge.ru
  - `docs/00-MASTER.md`: обновлен Prod URL
  - `docs/00-README.md`: обновлен Production URL

### Исправление редиректа
- Удален файл `_redirects` (создавал ERR_TOO_MANY_REDIRECTS)
- Оба домена (sw-forge.ru и sw-forge.pages.dev) теперь работают без редиректа
- Canonical tag указывает на sw-forge.ru как основной домен

## SEO

### Meta Tags
- Добавлен title с ключевыми словами (Summoners War Rune Analyzer & Calculator)
- Добавлена meta description (156 символов) с ключевыми словами
- Добавлен keywords тег с 15+ ключевыми словами (EN/RU/FR)
- Добавлен canonical tag на sw-forge.ru
- Добавлены hreflang для мультиязычности (EN/RU/FR)

### Open Graph & Social Media
- Добавлены Open Graph tags (og:title, og:description, og:image, og:url, og:type, og:site_name, og:locale)
- Добавлены Twitter Cards (twitter:card, twitter:title, twitter:description, twitter:image)
- Примечание: OG image (assets/og-image.png) нужно создать отдельно

### JSON-LD Structured Data
- Добавлен WebSite schema с описанием, языками, категорией
- Добавлен SoftwareApplication schema с featureList и keywords
- Помогает в rich snippets в поиске

### Технические файлы
- Создан `robots.txt` с sitemap и правилами для поисковых ботов
- Создан `sitemap.xml` для индексации

## CI/CD

### Исправление GitHub Actions
- Обновлен Node.js с v18 на v20 в `.github/workflows/deploy.yml`
- Обновлены actions/checkout с v3 на v4
- Обновлены actions/setup-node с v3 на v4
- Обновлены права API токена Cloudflare (Workers Scripts Edit, D1 Database Edit, Account Settings Read)
- Worker деплой теперь работает успешно

## Коммиты

1. `docs: reorganize documentation with numeric prefixes and remove Pinegrow files`
2. `chore: remove IDE configs from git tracking`
3. `docs: update documentation structure`
4. `chore: remove husky dependency`
5. `feat: add custom domain sw-forge.ru`
6. `fix: redirect only root path, not all resources`
7. `docs: add changelog for 2026-07-14 changes`
8. `seo: add comprehensive meta tags, robots.txt, sitemap.xml, and JSON-LD`
9. `fix: update Node.js to v20 in GitHub Actions workflow`
10. `trigger: retry worker deployment with updated API token`
11. `fix: remove redirect causing ERR_TOO_MANY_REDIRECTS`
