# Vendored agent skills

These `SKILL.md` files are copied from [vjgarciag96/skills](https://github.com/vjgarciag96/skills) at commit `5362e0384daa01e7abf41147b3b908f602aaf0a0`.

That commit had no license file. They are vendored here so an agent in this public repository can load the pipeline without cloning another repo. Do not edit the skill text. A resync is its own framed change, and it updates this commit pin.

Cursor loads the same bytes from `.cursor/skills/`. `scripts/check-skills.sh` fails when the two copies differ. CI runs that check.

When a skill mentions `~/.agents/skills/<name>/SKILL.md`, read `skills/<name>/SKILL.md` in this repo instead.

The chain this project runs is frame, model, slice, implement, review, adversarial-review, code-quality, and mutate, with debug for bugs. `describe` and `tests` are used inside that chain. See [pipeline/README.md](../pipeline/README.md).
