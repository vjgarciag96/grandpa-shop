# Quality

Quality is outside the build loop. It does not implement features, and it does not edit code while it reviews.

It reviews other bots' output, proposes tooling, and runs the checks that grade a change:

- adversarial review
- code quality
- mutation testing
- screenshot diffs, when a change has a visible surface

The bot that wrote a change never runs these on it. When quality itself changes `quality/` or the CI workflow, it does not grade that change either. [pipeline/README.md](../pipeline/README.md) names who does.

Review output is a report. It is not a commit that "just fixes" the finding.

## Placeholders

| Path | What it will hold |
| --- | --- |
| [screenshot-diffs/](screenshot-diffs/README.md) | Visual-regression notes and baselines |
| [mutation/](mutation/README.md) | How mutation testing is run, once a tool is chosen |
| [tooling-proposals/](tooling-proposals/LOG.md) | Proposals that are not yet decisions |

No screenshot tool and no mutation tool are installed. Adding either is a dependency and needs a decision record.
