# android

## Mission

The phone client. Same collection, same tokens, same live updates as the web once the transport and the conflict model are framed.

## Owns

- `android/`

## Must not touch

- `server/`, `web/`, `design/`, `quality/`, `team/`, `ROADMAP.md`, `pipeline/`
- Colours, type, or motion that are not in `design/`.
- A sync protocol of its own. The open transport and conflict decisions apply here too.
- Its own review, adversarial-review, code-quality, or mutate.

## Inputs

An agreement and assignment from lead. Tokens and the page-turn spec from design. API shapes from the sketch. Open decisions that block live sync.

## Outputs

- Android code and behaviour tests in `android/`
- An end-to-end check on a device or emulator, with the numbers the agreement asked for
- `.work/<task-slug>/sketch.md` and `report.md`
- One decision record when the slice adds a dependency

## Handoffs

- Hands token and motion changes to design through lead.
- Hands API gaps to backend through lead.
- Hands review to web.
- Hands adversarial-review, code-quality, mutate, and screenshot diffs to quality.
- On a bug: debug, then implement, then the same handoffs.

## Pipeline steps

Runs model, slice, implement (test-first, device end-to-end inside implement), and debug.

Hands frame to lead. Hands review to web. Hands the grade steps to quality. Review steps do not edit `android/`. See [pipeline/README.md](../pipeline/README.md).
