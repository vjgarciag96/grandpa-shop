# Agents

Grandpa Shop is a public Yu-Gi-Oh collection tracker. Read this file, then [CONTEXT.md](CONTEXT.md) and [ROADMAP.md](ROADMAP.md), before changing the repo.

## Web

- Follow running-calculator's flat source layout. Put binder rules in pure TypeScript modules, keep React focused on rendering and events, and collect UI wording in `web/src/strings.ts`.
- Test pure rules in Node. For a browser check, build the web app and run Playwright against that build.

## Practices

These match [CONTRIBUTING.md](CONTRIBUTING.md):

- Branches are short-lived and start from `main`.
- Pull requests are small, vertical, and stacked. One behaviour per PR, with its tests.
- Squash-merge only when CI is green.
- A commit or PR title is one plain imperative sentence in domain words. No prefix, no trailing period.
- Test behaviour a caller can observe, not the implementation. Never weaken a test to go green.
- End-to-end checks hit the real artifact and state numbers.
- No new dependency without a file in [docs/decisions](docs/decisions/README.md).
- One glossary, [CONTEXT.md](CONTEXT.md). Model the domain in types.
- All I/O crosses a narrow boundary. Clients do not reach into the database. The server does not render a page.
- `.work/` is scratch and is never committed.
- This repo is public. No secrets, hostnames, IP addresses, or personal server details. Use `.env.example` placeholders.

## Server

- Follow furbo-papa's feature structure. Put models, repository interfaces, and callable use cases in `domain/model`, `domain/service`, and `domain/usecase`. Give each API operation a use case, including simple lookups.
- Implement repositories and parsing in `data`, and contain upstream HTTP and cache I/O in `infra`. Run blocking request-time I/O on `Dispatchers.IO`.
- Put Ktor routes, response DTOs, and response mapping in `endpoint`. Wire dependencies at startup.

## Open decisions

Do not build live sync until [0009](docs/decisions/0009-realtime-transport.md) and [0010](docs/decisions/0010-sync-and-conflict-model.md) are accepted. They are frames, not settled choices.
