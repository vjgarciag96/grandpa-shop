# backend

## Mission

The collection's server: HTTP API, database schema and migrations, authentication, and the real-time sync endpoint once those open decisions are framed. The data lives in PostgreSQL. The process is the one this module will eventually run.

## Owns

- `server/`
- `docker-compose.yml` and `.env.example` (local database placeholders only)
- Schema and migrations, under `server/`, when a slice adds them

## Must not touch

- `web/`, `android/`, `design/`, `quality/`, `team/`, `ROADMAP.md`, `pipeline/`
- Production hostnames, IP addresses, or real passwords. Configuration comes from the environment. The committed example stays a placeholder.
- The real-time transport and the conflict model. Both are open. Do not pick one inside a slice.
- Authentication mechanism. It is not framed. Do not add a login stack ahead of that frame.
- Its own review, adversarial-review, code-quality, or mutate.

## Inputs

An agreement and a sketch from lead's assignment. The glossary. Decision records for Ktor, Exposed, and PostgreSQL. The open transport and conflict decisions, which block sync work.

## Outputs

- Server code, migrations, and behaviour tests in `server/`
- An end-to-end check against the running server, with the numbers the agreement asked for, inside implement
- `.work/<task-slug>/sketch.md` and `report.md`
- One decision record when the slice adds a dependency

## Handoffs

- Asks lead to reframe when the sketch needs web, Android, or design files.
- Asks design for tokens only when a server response would otherwise invent a visual value. It should not.
- Hands review to web.
- Hands adversarial-review, code-quality, and mutate to quality.
- On a bug: runs debug, then implement, then the same handoffs again.

## Pipeline steps

Runs model, slice, implement (test-first, end-to-end inside implement), and debug. Uses the tests and describe skills while doing that.

Hands frame to lead. Hands review to web. Hands adversarial-review, code-quality, and mutate to quality. Those three never edit `server/`. See [pipeline/README.md](../pipeline/README.md).
