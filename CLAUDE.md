# Homelab Bot

Telegram-бот для мониторинга домашнего сервера. Написан на GrammY + TypeScript.

## Контекст

Сервер: Proxmox → OMV (OpenMediaVault) → Docker.
Часть сервисов запущена через OMV UI (docker-compose), часть через GitHub CI.

Бот живёт в Docker-контейнере на сервере. Деплой через GitHub Actions:
GitHub CI → build image → push to ghcr.io → SSH на сервер → docker-compose pull && up.

На сервере лежит только `docker-compose.yml` и `.env` в `~/services/homelab-bot/`.
Репозиторий на сервере не клонируется.

## Стек

- GrammY — Telegram bot framework
- TypeScript
- node-cron — алерты по расписанию (позже)

## Доступ

Whitelist из двух Telegram ID (хозяин + папа). Хранится в `.env`, база не нужна.

## Архитектура

Каждый сервис реализует интерфейс:

```typescript
interface Service {
  name: string;
  getStatus(): Promise<string>;
  getLogs?(): Promise<string>;
}
```

Добавление нового сервиса = новый файл в `src/services/`, реализующий этот интерфейс.

## Сервисы (первая версия)

- **Docker** — статус контейнеров через `/var/run/docker.sock` (монтируется в контейнер бота)
- **Minecraft** — проверка порта / RCON
- **Nextcloud** — REST API, проверка дисков
- **Proxmox** — REST API `https://proxmox:8006/api2/json/nodes`
- **OMV** — системные метрики напрямую (df, smartctl), не через API
- **Backups** — уточнить чем делаются бэкапы

## Команды (v1)

- `/status` — общий статус всех сервисов

Алерты по расписанию — позже через node-cron.

## Структура проекта

```
src/
  services/
    docker.ts
    minecraft.ts
    nextcloud.ts
    proxmox.ts
    omv.ts
  bot/
    commands.ts
  index.ts
Dockerfile
docker-compose.yml
.env.example
.github/workflows/deploy.yml
```

## Что сделано

- Инициализирован npm проект
- Установлены зависимости: grammy, typescript, ts-node, @types/node
- Создан tsconfig.json

## Что делать дальше

1. Создать структуру папок `src/services/` и `src/bot/`
2. Написать `src/index.ts` — точка входа, whitelist middleware
3. Написать интерфейс `Service` и первый сервис — Docker
4. Команда `/status`
5. `Dockerfile`
6. `docker-compose.yml`
7. `.env.example`
8. `GitHub Actions` workflow
