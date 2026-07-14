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
- Создан файл `_redirects` для редиректа sw-forge.pages.dev → sw-forge.ru
- Обновлены URL в проекте:
  - `README.md`: 3 замены sw-forge.pages.dev → sw-forge.ru
  - `docs/00-MASTER.md`: обновлен Prod URL
  - `docs/00-README.md`: обновлен Production URL

### Исправление редиректа
- Изменен `_redirects` с `/* https://sw-forge.ru 301` на `/ https://sw-forge.ru 301`
- Редирект теперь работает только для корневого пути, не блокирует CSS/JS ресурсы

## Коммиты

1. `docs: reorganize documentation with numeric prefixes and remove Pinegrow files`
2. `chore: remove IDE configs from git tracking`
3. `docs: update documentation structure`
4. `chore: remove husky dependency`
5. `feat: add custom domain sw-forge.ru`
6. `fix: redirect only root path, not all resources`
