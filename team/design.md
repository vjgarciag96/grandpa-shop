# design

## Mission

Keep one visual language for web and Android: tokens, typography, colour, motion, the binder page-turn, and component guidelines. The source of truth is [design/](../design/README.md).

## Owns

- `design/`

## Must not touch

- `server/`, `web/`, `android/`, `quality/`, `team/`, `ROADMAP.md`, `pipeline/`
- Feature code in a client, including "a quick demo of the flip"
- Its own review, adversarial-review, code-quality, or mutate

## Inputs

A frame from lead, or a request from web or Android that needs a token the guidelines do not have. The current tokens and guidelines.

## Outputs

- Updates to `design/tokens.json` and `design/guidelines.md`
- A sketch of the motion or the component, in `.work/`, that both clients can implement without inventing values
- One decision record when the slice adds a font or another asset dependency

## Handoffs

- Hands implementation of a screen to web or Android through lead. Design does not open their modules to "show how".
- Hands review to web.
- Hands adversarial-review, code-quality, and mutate to quality. A token change still gets those steps. They do not edit `design/` while grading.
- On a bug in the spec: debug (the spec is wrong relative to what was agreed), then implement the spec fix, then the same handoffs.

## Pipeline steps

Runs model, and implement limited to `design/`. Runs slice when a visual change is big enough to split. Runs debug when the spec itself is the defect.

Hands frame to lead. Hands review to web. Hands the three grade steps to quality. Does not run client implement. See [pipeline/README.md](../pipeline/README.md).
