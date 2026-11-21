#!/bin/sh
# The Cursor-facing copies must stay identical to the vendored skills.
set -eu

fail=0

for skill in skills/*/; do
  name=$(basename "$skill")
  left="skills/$name/SKILL.md"
  right=".cursor/skills/$name/SKILL.md"

  if [ ! -f "$left" ]; then
    echo "missing $left"
    fail=1
    continue
  fi

  if [ ! -f "$right" ]; then
    echo "missing $right"
    fail=1
    continue
  fi

  if ! cmp -s "$left" "$right"; then
    echo "$left and $right differ"
    fail=1
  fi
done

exit "$fail"
