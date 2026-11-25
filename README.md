# Grandpa Shop

Grandpa Shop is Víctor's tracker for a Yu-Gi-Oh card collection.

The collection is stored in a database on a server you run yourself. A web app shows it, that same app can be installed as a desktop-style window, and an Android client shows it on a phone. An edit on one surface is meant to appear on the others live. How that live update travels, and what happens when two edits disagree, is not decided yet.

This repository is early. The server searches the card catalogue, and the web app fills a binder page from it. The binder turns pages and keeps copies in the current browser.

The repo is public: [github.com/vjgarciag96/grandpa-shop](https://github.com/vjgarciag96/grandpa-shop). It is MIT licensed.

[![ci](https://github.com/vjgarciag96/grandpa-shop/actions/workflows/ci.yml/badge.svg)](https://github.com/vjgarciag96/grandpa-shop/actions/workflows/ci.yml)

## Stack

| Surface | Choice | Record |
| --- | --- | --- |
| Server | Kotlin and Ktor on JDK 21 | [0001](docs/decisions/0001-server-is-kotlin-and-ktor.md) |
| Database | Exposed and PostgreSQL | [0002](docs/decisions/0002-persistence-is-exposed-and-postgresql.md) |
| Web | React, TypeScript, and Vite | [0003](docs/decisions/0003-web-is-react-and-vite.md) |
| Android | Jetpack Compose | [0004](docs/decisions/0004-android-is-jetpack-compose.md) |
| Local database | Docker Compose, configured from the environment | [0005](docs/decisions/0005-local-database-is-docker-compose.md) |
| Desktop window | The web app, installed | [0006](docs/decisions/0006-desktop-is-the-installed-web-app.md) |

Open, and not to be built as if they were closed:

- [Real-time transport](docs/decisions/0009-realtime-transport.md)
- [Sync and conflict model](docs/decisions/0010-sync-and-conflict-model.md)

## Working on it

Agents start at [AGENTS.md](AGENTS.md). The domain words are in [CONTEXT.md](CONTEXT.md). The milestones are in [ROADMAP.md](ROADMAP.md).

## Checks

You need JDK 21, Node.js 22, and an Android SDK with platform 37.2 and build-tools 36.0.0.

```sh
./gradlew :server:check :android:check :android:assembleDebug
cd web && npm ci && npm run format:check && npm run lint && npm test && npm run build
```

GitHub Actions runs those checks. Web behaviour tests use Vitest, and server tests use JUnit. For the Chromium test of the built binder, run these commands from `web/` after `npm run build`.

```sh
npx playwright install --only-shell chromium
npm run test:e2e
```

The server, which serves the card catalogue on `http://127.0.0.1:43124`:

```sh
./gradlew :server:run
```

On its first start it downloads the catalogue from [YGOPRODeck](https://ygoprodeck.com/api-guide/) into `server/.cache/` and reads it from there afterwards. `GRANDPA_SHOP_HOST`, `GRANDPA_SHOP_PORT`, and `GRANDPA_SHOP_CACHE_DIR` change where it listens and caches.

The web app, with the server running:

```sh
cd web && npm run dev
```

It serves on `http://127.0.0.1:43123` and forwards `/api` to the server. It shows the binder, and a slot is filled by searching the catalogue. Copies stay in the current browser across reloads.

## Local database

Docker Compose can start PostgreSQL with the placeholders in `.env.example`:

```sh
cp .env.example .env
docker compose up database
```

The server does not connect to it yet. Copy `.env` locally and change the password there. Do not commit `.env`, and do not put a real host, IP, or password in the repository.
