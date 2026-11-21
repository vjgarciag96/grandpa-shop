# Contributing

Grandpa Shop is public. Treat every file as something a stranger will read. Do not commit a secret, a hostname, an IP address, or any detail of a personal server. Local configuration goes in `.env`, copied from `.env.example`, and `.env` stays untracked.

The working agreements for people and for the bots in [team/](team/README.md):

- Branch off `main`, and keep the branch short-lived.
- Open a small vertical pull request. One behaviour, with the tests that prove it. Stack the next behaviour on top instead of folding it in.
- Squash-merge, and only when CI is green.
- Title the commit and the pull request as one plain imperative sentence in domain words. No conventional-commit prefix, no trailing period. [skills/describe/SKILL.md](skills/describe/SKILL.md) is the writing rule.
- Test behaviour a caller can see. Do not assert on private helpers or call order. Never weaken a test, delete an assertion, or loosen a timeout to make a run pass.
- When a change has a running surface, check the real artifact and record the numbers. A unit test is not a substitute for that.
- Do not add a dependency without a decision record in [docs/decisions](docs/decisions/README.md).
- Use the words in [CONTEXT.md](CONTEXT.md). Add a term there before coining a type. Model the domain in types so illegal states are hard to represent.
- Cross a boundary through a small interface. The web and Android clients talk to the API. They do not share the server's database types. The server does not know how a page flips.
- Keep scratch in `.work/`. Do not commit it.
- Follow [pipeline/README.md](pipeline/README.md). The author of a change does not review, adversarially review, grade code quality, or run mutation testing on it. Those steps write reports and do not edit code.

Bots stop at the paths in their definition. A change that needs another path goes back to lead.
