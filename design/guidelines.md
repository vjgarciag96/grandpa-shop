# Visual guidelines

Grandpa Shop should feel like a binder on a desk: plain black boards, warm paper, and the cards doing the talking. The tokens in [tokens.json](tokens.json) are the only colours, type, sizes, and motion values.

## Colour

| Token | Use |
| --- | --- |
| `ink` | Text on `paper` and `page`. |
| `paper` | The desk behind the binder. |
| `binderBoard` | The cover and the spine. One flat colour: no texture, stripes, or gradient. |
| `page` | A binder page, and any text or control drawn on the boards (18:1 on `binderBoard`). |
| `slotEdge` | The outline and plus of an empty slot (4.2:1 on `page`, so the place to click is visible). |
| `rule` | Hairlines that mark no action, such as a divider in the copy detail. |
| `foil` | The rarity mark in the copy detail. It is a mark beside an `ink` label, never text on its own (3.1:1 on `page` is too faint for text). |

Do not add a colour in a client. Add it here first.

## Typography

`display` is for card names and binder titles. `body` is for stats, set codes, and condition. Do not ship a font file until a slice needs one, and record that dependency.

## Layout

`space.slot` (8px) is the spacing unit for anything the layout tokens below do not name. Card corners use `radius.cardPx`.

A page is a 3×3 grid of pockets on `page`, with `layout.pagePaddingPx` inside its edge and `layout.pocketGapPx` between pockets. Each pocket fills its grid column and keeps the card's shape, `layout.pocketAspect` (59 by 86 mm). One pocket is one slot: it holds one copy or is empty.

A spread is what an open binder shows (see Spread in [CONTEXT.md](../CONTEXT.md)): two facing pages, with the spine between them, `layout.spinePx` wide, on boards that show `layout.boardPaddingPx` around the pages. The first spread has only its right page and the last spread of an even-paged binder only its left page. The missing side shows bare boards, not an empty page.

Below a viewport width of `layout.stackBelowPx`, the pages of a spread stack, left page first, and the spine is not drawn.

A filled slot shows the card's image in its pocket and nothing else. The rarity, set code, and condition belong to the copy's detail, which opens from the slot. An empty slot shows a dashed outline `layout.emptySlotStrokePx` wide and a plus, both in `slotEdge`.

## Binder page-turn

This is the spec. There is no animation code yet.

- A turn moves one spread. It starts from a previous or next control, the left or right arrow key, or a horizontal swipe on the spread of at least `motion.swipeThresholdPx`.
- The arrow keys turn only while no dialog is open and focus is not in a text field, so typing in a search never turns the binder.
- There is no turn before the first spread or after the last. The control for it is disabled.
- The turn lasts `motion.pageFlipMs` on `motion.easing`. The page lifts from the gutter. The boards stay still.
- When the pages are stacked there is no gutter to lift from: the turn cuts. Swipe still turns.
- Reduced motion, or a user setting that asks for less motion, cuts to the destination spread, forward or back. It does not play the flip.
- Web and Android both follow this timing. Neither invents its own duration.

## Components

Shared pieces, once a slice needs them: card face, slot, page, binder spread, copy detail, condition mark, rarity mark, empty collection. Build them from these tokens. A component that needs a new token comes back here before it lands in a client.

## What clients must not do

- Hard-code a colour, a font, a size, or a duration that is already a token.
- Ship a page-turn that ignores reduced motion.
- Treat this folder as optional. If the spec and the screen disagree, the spec is wrong or the screen is. Fix the one that is wrong. Do not leave both.
