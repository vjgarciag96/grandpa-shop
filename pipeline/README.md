# Pipeline

Every change to Grandpa Shop follows this chain. The skills are vendored in [skills/](../skills/README.md) from [vjgarciag96/skills](https://github.com/vjgarciag96/skills) at `5362e0384daa01e7abf41147b3b908f602aaf0a0`. Load `skills/<name>/SKILL.md`. When a skill says `~/.agents/skills`, use that vendored path instead.

Scratch for a change lives in `.work/<task-slug>/` and is never committed.

## The chain

For a new behaviour:

1. **frame** — agree the goal, the decisions, done-when, and what is out of scope. Write `.work/<task-slug>/agreement.md`. No code.
2. **model** — turn the agreement into a design: diagram, domain model, public shapes, decisions with a one-line why. Write `.work/<task-slug>/sketch.md`. No product code.
3. **slice** — split the design into thin vertical slices, each one shippable on its own. Record them as `- [ ]` units on the sketch. No code.
4. **implement** — test first, one slice at a time. Tests follow [skills/tests/SKILL.md](../skills/tests/SKILL.md). End-to-end checks against the real artifact, with numbers, happen inside implement, not as a later optional pass. Commit messages follow [skills/describe/SKILL.md](../skills/describe/SKILL.md). Write `.work/<task-slug>/report.md`.
5. **review** — a peer reads the change against the agreement and the sketch. Findings need a proof for correctness and tests. Write `.work/<task-slug>/review.md`.
6. **adversarial-review** — a different bot hunts lies, logic errors, missing edges, and tests that cannot fail. Write `.work/<task-slug>/adversarial-review.md`.
7. **code-quality** — readability, tests, encapsulation, SOLID, cohesion, and API depth. Write `.work/<task-slug>/code-quality.md`.
8. **mutate** — run the project's mutation command on the changed files only. If none is configured, say so in one line and stop. Write `.work/<task-slug>/mutation.md` when there is a command.

For a bug, skip frame and model:

1. **debug** — reproduce it, find the root cause, and add a failing test. Do not fix it. Write the sketch.
2. **implement** — make that test pass, and nothing else.
3. Then the same review, adversarial-review, code-quality, and mutate as above.

Findings from any review go back to the author through implement (or debug, when the finding is a bug). The reviewer does not land the fix.

## Hard rule

No bot grades its own work. The bot that implemented a change never runs review, adversarial-review, code-quality, or mutate on it.

Review steps never edit code. review, adversarial-review, code-quality, and mutate produce a report and stop. Screenshot diffs, when a surface is visible, are the same kind of step: quality reports the diff and does not patch the client.

## Who does which step

| Step | Who runs it |
| --- | --- |
| frame | lead |
| model, slice, implement, debug | the owner lead assigned |
| review | the peer in the table below, never the author |
| adversarial-review, code-quality, mutate | quality, except when quality authored the change |
| screenshot diff | quality, when the change has a web or Android surface |

`describe` and `tests` are not grades. The author uses them while implementing.

### Who reviews whom

| Author of the change | Peer review | Adversarial review, code quality, mutate |
| --- | --- | --- |
| lead | design | quality |
| backend | web | quality |
| web | android | quality |
| android | web | quality |
| design | web | quality |
| quality | lead | backend |

Quality runs the three grade steps on everyone else's changes, and a peer runs review. When the change is quality's own (a tooling proposal, a baseline, a CI workflow edit), quality runs none of the four grade steps. Lead runs review. Backend runs adversarial-review, code-quality, and mutate.

A grade that finds something sends the change back to the author. The same pair of graders runs again after the fix. They still do not edit the code.

## What each bot runs, and what it hands off

The bot files in [team/](../team/README.md) repeat this so a bot can start from its own page. The table above wins if they ever disagree.

- **Lead** runs frame, updates [ROADMAP.md](../ROADMAP.md), and names the owner, the peer reviewer, and the paths. Lead hands model, slice, implement, and debug to that owner. Lead hands review to the peer and the three grade steps to quality. Lead writes no feature code.
- **Backend, web, and Android** run model, slice, implement, and debug on work they own. They hand review to their peer and the three grade steps to quality. They do not review their own change.
- **Design** runs model and the design-folder half of implement (tokens and guidelines, not client code). Web runs review. Quality runs the three grade steps.
- **Quality** runs adversarial-review, code-quality, mutate, and screenshot diffs. It never runs implement for a feature. It hands findings back to the author. It does not grade its own commits.

## Done

A change is done when implement's done-when checks have been run, the peer review and quality's three steps have reported, and any finding they kept has been fixed and graded again. Squash-merge only happens after CI is green. See [CONTRIBUTING.md](../CONTRIBUTING.md).
