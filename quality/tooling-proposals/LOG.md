# Tooling proposals

Proposals only. A proposal is not a decision, and it does not add a dependency. Accepted tools land in [docs/decisions](../../docs/decisions/README.md).

## 2026-11-21 — Skeleton checks

The skeleton's CI runs format, lint, unit tests, and build for the empty modules. That is the implement-side check, not a grade.

Not configured, and not chosen:

- a mutation-testing tool
- a screenshot-diff tool

Quality will propose both when a slice has behaviour or a visible surface worth grading. Until then, mutate stops because there is no command, and screenshot diffs have no baselines.
