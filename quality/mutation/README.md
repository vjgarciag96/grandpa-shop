# Mutation testing

Mutation testing looks for tests that stay green when the behaviour they claim to protect is broken.

## Current command

There is no mutation command in this repository. The [mutate skill](../../skills/mutate/SKILL.md) says to stop in one line when the project has none. Do not install a tool from inside a review.

## When a tool exists

Record the command here, including how to limit it to the changed files. The mutate skill forbids a whole-repo run. Quality runs the command, writes `.work/<task-slug>/mutation.md`, and does not add the missing tests. The author does that, in a new implement pass, and does not run mutate on their own fix.

Survivors matter only when a user of the code would notice the behaviour break. Do not chase a score.
