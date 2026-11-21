# Design

This folder is the visual source of truth for Grandpa Shop. Web and Android read it. They do not invent a second palette, type scale, or page-turn.

- [tokens.json](tokens.json) holds colour, type, spacing, radius, and motion.
- [guidelines.md](guidelines.md) says how those tokens are used, including the binder page-turn.

The font families are named here and are not bundled. Nothing in `web/` or `android/` applies these tokens yet. The first visual slice wires them.
