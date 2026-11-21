# Team

Six bots. Lead routes. Backend, web, Android, and design build what they own. Quality grades, and it does not build features.

The pipeline every bot follows is [pipeline/README.md](../pipeline/README.md). Skills are in [skills/](../skills/README.md). If this roster and the pipeline disagree about who grades a change, the pipeline wins.

## Roster

| Bot | Definition | Role |
| --- | --- | --- |
| lead | [lead.md](lead.md) | Frames requests, owns the roadmap, assigns slices. Writes no feature code. |
| backend | [backend.md](backend.md) | API, schema, migrations, auth, real-time sync server. |
| web | [web.md](web.md) | Web UI, binder motion, installable desktop-style window. |
| android | [android.md](android.md) | Phone client. |
| design | [design.md](design.md) | Tokens, type, colour, motion, component guidelines. |
| quality | [quality.md](quality.md) | Reviews, screenshot diffs, mutation testing, tooling proposals. Outside the build loop. |

## Ownership map

| Path | Owner |
| --- | --- |
| `ROADMAP.md`, `team/`, `pipeline/`, `AGENTS.md`, `CONTRIBUTING.md`, `CONTEXT.md` | lead |
| `docs/decisions/` | lead, plus one new record from the bot whose slice adds a dependency |
| `server/`, `docker-compose.yml`, `.env.example` | backend |
| `web/` | web |
| `android/` | android |
| `design/` | design |
| `quality/`, `.github/workflows/` | quality |
| `skills/`, `.cursor/skills/` | lead, and only to resync the vendor pin |

A bot does not edit its own definition to widen what it may touch. Lead owns `team/`.

## Routing rules

1. A request enters through lead. Lead runs frame, updates the roadmap, and names one owner, the peer reviewer, and the paths.
2. The owner runs model, slice, and implement. For a bug, the owner runs debug and then implement.
3. The peer in the table below runs review. Quality runs adversarial-review, code-quality, and mutate. None of those steps edit code.
4. A finding goes back to the owner. The owner fixes it. The same peer and the same graders run again.
5. No bot grades its own work. The author never runs review, adversarial-review, code-quality, or mutate on that change.
6. When quality authored the change, lead runs review and backend runs the three grade steps.
7. A slice that needs another bot's paths goes back to lead. Lead splits it into stacked slices, or names a one-slice exception. The author still does not grade it.
8. End-to-end checks against the real artifact, with numbers, happen inside implement.
9. A new dependency needs a decision record in the same change. See [docs/decisions](../docs/decisions/README.md).
10. `.work/` is scratch. It is never committed.

## Who reviews whom

| Author | Peer review | Adversarial review, code quality, mutate |
| --- | --- | --- |
| lead | design | quality |
| backend | web | quality |
| web | android | quality |
| android | web | quality |
| design | web | quality |
| quality | lead | backend |
