# Visual guidelines

Grandpa Shop should feel like a binder on a desk: plain black boards, warm paper, and the cards doing the talking. The tokens in [tokens.json](tokens.json) are the only colours, type, and motion durations.

## Colour

Use `ink` for text, `paper` for the desk, `page` for a binder page, `binderBoard` for the cover and the spine, `foil` for the rarity in a copy's detail, and `rule` for hairlines and empty slots. The boards are one flat colour: no texture, stripes, or gradient. Do not add a colour in a client. Add it here first.

## Typography

`display` is for card names and binder titles. `body` is for stats, set codes, and condition. Do not ship a font file until a slice needs one, and record that dependency.

## Layout

A slot is the unit of space (`space.slot`, 8px). Card corners use `radius.cardPx`. A page is a 3×3 grid of slots. One slot holds one copy or is empty.

A spread is two pages side by side, with the spine between them on the boards. On a screen too narrow for two pages, the pages stack, left page first, and the spine is not drawn.

A filled slot shows the card's image in its pocket and nothing else: no rarity mark, badge, or label on the page. An empty slot shows a dashed `rule` outline and a plus. Rarity, set code, and condition belong to the copy's detail, which opens from the slot.

## Binder page-turn

This is the spec. There is no animation code yet.

- A turn moves one spread. It starts from a previous or next control, the left or right arrow key, or a horizontal swipe on the spread.
- There is no turn before the first spread or after the last. The control for it is disabled.
- The turn lasts `motion.pageFlipMs` (480ms) on `motion.easing`.
- The page lifts from the gutter. The boards stay still.
- Reduced motion, or a user setting that asks for less motion, cuts to the next spread. It does not play the flip.
- Web and Android both follow this timing. Neither invents its own duration.

## Components

Shared pieces, once a slice needs them: card face, slot, page, binder spread, copy detail, condition mark, rarity mark (in the copy detail only), empty collection. Build them from these tokens. A component that needs a new token comes back here before it lands in a client.

## What clients must not do

- Hard-code a colour, a font, or a duration that is already a token.
- Ship a page-turn that ignores reduced motion.
- Treat this folder as optional. If the spec and the screen disagree, the spec is wrong or the screen is. Fix the one that is wrong. Do not leave both.
