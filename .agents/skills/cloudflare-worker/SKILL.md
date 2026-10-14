---
name: cloudflare-worker
description: >
  Правила разработки и деплоя Cloudflare Worker (SW-Forge Share API в директории worker/):
  wrangler команды, работа с KV, авторизация через .env.ai, безопасность секретов и CORS.
---

# Cloudflare Worker — SW-Forge Share API

## 1. Архитектура Worker

* **Директория:** `worker/`
* **Назначение:** Серверная часть функции «Поделиться билдом / аккаунтом» (`https://sw-backend.antajltube.workers.dev`).
* **Хранилище:** Cloudflare KV (`SHARES` namespace: хранение сериализованных JSON-билдов по сгенерированному 6-значному коду).
* **Срок жизни (TTL):** Шаринги автоматически экспайрятся через 30 дней.
* **CORS:** Разрешены запросы с `https://sw-forge.ru` и `http://localhost:5500`.

---

## 2. Безопасность и секреты

* **Никаких токенов в коде:** Все авторизационные ключи Cloudflare хранятся в корневом `.env.ai` (в `.gitignore`).
* **Лимиты памяти:** Максимальный размер загружаемого дампа — 10 МБ (в браузере перед отправкой данные фильтруются и сжимаются).
* **Rate Limiting:** Защита от спама генерации кодов по IP.

---

## 3. Команды разработки и деплоя

```bash
cd worker
npx wrangler dev          # Локальная эмуляция воркера
npx wrangler deploy       # Деплой в продакшен Cloudflare
```

При деплое через GitHub Actions переменные берутся из `secrets.CLOUDFLARE_API_TOKEN` и `secrets.CLOUDFLARE_ACCOUNT_ID`.
