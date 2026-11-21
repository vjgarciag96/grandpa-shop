# Screenshot diffs

Visual regression for the web and Android surfaces. Quality runs it. The author does not grade their own screenshots.

## Baselines

[baselines/](baselines/README.md) is empty. There is no UI to photograph yet.

When a slice has a visible surface, quality stores the accepted images here and compares the next build against them. A diff is a finding in the review report. Quality does not edit the client to make the diff go away.

## Not configured

No capture tool, no pixel threshold, and no CI job. Proposing one belongs in [the tooling log](../tooling-proposals/LOG.md), and adopting it needs a decision record.
