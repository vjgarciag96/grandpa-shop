# Agents

Grandpa Shop is a public Yu-Gi-Oh collection tracker. The modules are empty on purpose. Read this file, then [CONTEXT.md](CONTEXT.md), [ROADMAP.md](ROADMAP.md), [team/README.md](team/README.md), and [pipeline/README.md](pipeline/README.md) before changing the repo.

## Pipeline

Every change follows [pipeline/README.md](pipeline/README.md):

frame, then model, then slice, then implement (test-first, and end-to-end against the real artifact inside implement), then review, then adversarial-review, then code-quality, then mutate.

A bug takes debug, then implement, then those same four grade steps.

Load each skill from `skills/<name>/SKILL.md`. The files are vendored from [vjgarciag96/skills](https://github.com/vjgarciag96/skills) at `5362e0384daa01e7abf41147b3b908f602aaf0a0`. A skill that mentions `~/.agents/skills` means `skills/` in this repo. Cursor also sees them at `.cursor/skills/`. The two copies must match.

## No bot grades its own work

The bot that implemented a change never runs review, adversarial-review, code-quality, or mutate on it. A peer runs review. Quality runs the other three, except when quality authored the change. Then lead reviews and backend runs the three grade steps. The full table is in the pipeline doc.

Review steps never edit code. They write a report under `.work/` and stop. Findings go back to the author.

## Who works where

Lead frames and assigns. Lead does not write feature code. Backend owns `server/`. Web owns `web/`. Android owns `android/`. Design owns `design/`. Quality owns `quality/` and the CI workflow, and it does not build features. Paths and routing are in [team/README.md](team/README.md).

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

## Open decisions

Do not build live sync until [0009](docs/decisions/0009-realtime-transport.md) and [0010](docs/decisions/0010-sync-and-conflict-model.md) are accepted. They are frames, not settled choices.
