# CI is GitHub Actions

Status: accepted

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests, with `contents: read`. It checks the server (`:server:check`), Android (`:android:check` and `:android:assembleDebug`), the web format, lint, test, and build, and that the two skill copies match.

Why: the repo is public on GitHub, and Actions is the CI that public GitHub repos already have.

Kotlin format is ktlint 14.2.0 (`ktlintCheck` inside `check`). Kotlin lint is detekt 1.23.8. Screenshot diffs and mutation testing are not CI jobs until a decision adds the tools.
