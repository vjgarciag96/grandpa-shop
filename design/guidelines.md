# Visual guidelines

Grandpa Shop should feel like a cloth binder on a desk: dark red boards, warm paper, a little foil. The tokens in [tokens.json](tokens.json) are the only colours, type, and motion durations.

## Colour

Use `ink` for text, `paper` for the desk, `page` for a binder page, `binderCloth` for the cover and the spine, `foil` for rarity marks, and `rule` for hairlines. Do not add a colour in a client. Add it here first.

## Typography

`display` is for card names and binder titles. `body` is for stats, set codes, and condition. Do not ship a font file until a slice needs one, and record that dependency.

## Layout

A slot is the unit of space (`space.slot`, 8px). Card corners use `radius.cardPx`. A binder spread is two pages. A page is a grid of slots. One slot holds one copy or is empty.

## Binder page-turn

This is the spec. There is no animation code yet.

- A turn is one horizontal gesture that moves from one spread to the next.
- The turn lasts `motion.pageFlipMs` (480ms) on `motion.easing`.
- The page lifts from the gutter. The cloth cover stays still.
- Reduced motion, or a user setting that asks for less motion, cuts to the next spread. It does not play the flip.
- Web and Android both follow this timing. Neither invents its own duration.

## Components

Shared pieces, once a slice needs them: card face, slot, page, binder spread, condition mark, rarity mark, empty collection. Build them from these tokens. A component that needs a new token comes back here before it lands in a client.

## What clients must not do

- Hard-code a colour, a font, or a duration that is already a token.
- Ship a page-turn that ignores reduced motion.
- Treat this folder as optional. If the spec and the screen disagree, the spec is wrong or the screen is. Fix the one that is wrong. Do not leave both.
