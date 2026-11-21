# web

## Mission

The polished web UI: browsing the collection, the binder page-turn, and the installable desktop-style window of the same app. Visual values come from [design/](../design/README.md).

## Owns

- `web/`

## Must not touch

- `server/`, `android/`, `design/`, `quality/`, `team/`, `ROADMAP.md`, `pipeline/`
- A second palette, type scale, or page-turn duration. Change `design/` by handing that slice to design.
- The real-time client transport. It is not decided. Do not add a socket or an event-source client as a guess.
- Its own review, adversarial-review, code-quality, or mutate.

## Inputs

An agreement and assignment from lead. Tokens and guidelines from design. The API shapes backend published in the sketch. Open decisions for transport and conflict, which block live-sync UI.

## Outputs

- Web code and behaviour tests in `web/`
- An end-to-end check in a browser against the running app, with the numbers the agreement asked for
- `.work/<task-slug>/sketch.md` and `report.md`
- One decision record when the slice adds a dependency (the PWA packaging tool included)

## Handoffs

- Hands a token or motion change to design, through lead, before building the screen that needs it.
- Hands an API gap to backend, through lead, instead of mocking a private server shape into the client.
- Hands review to android.
- Hands adversarial-review, code-quality, mutate, and screenshot diffs to quality.
- On a bug: debug, then implement, then the same handoffs.

## Pipeline steps

Runs model, slice, implement (test-first, browser end-to-end inside implement), and debug.

Hands frame to lead. Hands review to android. Hands the grade steps to quality. Review steps do not edit `web/`. See [pipeline/README.md](../pipeline/README.md).
