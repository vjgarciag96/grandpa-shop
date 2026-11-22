# Visual guidelines

Grandpa Shop presents a physical binder on a desk. The cover and spine are flat black, the pages frame the catalogue artwork, and the controls use a light Material 3 palette. Use [tokens.json](tokens.json) for colour, type, shape, spacing, and motion.

## Colour

| Token | Use |
| --- | --- |
| `primary`, `onPrimary` | A filled action and its label. |
| `primaryContainer`, `onPrimaryContainer` | A selected printing and its contents. |
| `secondaryContainer`, `onSecondaryContainer` | Tonal controls and their labels. |
| `surface`, `surfaceContainer*` | The desk, dialogs, and the distinct layers within them. |
| `onSurface`, `onSurfaceVariant` | Main and supporting content on surfaces. |
| `outline`, `outlineVariant` | Visible control boundaries and quiet dividers, respectively. |
| `error` | Destructive actions and error messages on light surfaces. |
| `binderBoard`, `binderPage` | The physical cover, spine, and sheet surfaces. |
| `foil` | A decorative rarity mark beside its text label. |

## Typography

Use the shared sans-serif family. Use the headline or title for an app or dialog heading, the body styles for card labels and descriptions, and the small label style for pocket destinations. The font stacks fall back to system fonts. Ship a font file only with a dependency decision.

## Layout

`space.slot` (8px) is the spacing unit for anything the layout tokens below do not name. Card corners use `radius.cardPx`.

A page is a 3×3 grid of pockets on `page`, with `layout.pagePaddingPx` inside its edge and `layout.pocketGapPx` between pockets. Each pocket fills its grid column and keeps the card's shape, `layout.pocketAspect` (59 by 86 mm). One pocket is one slot: it holds one copy or is empty.

A spread is what an open binder shows (see Spread in [CONTEXT.md](../CONTEXT.md)): two facing pages, with the spine between them, `layout.spinePx` wide, on boards that show `layout.boardPaddingPx` around the pages. The first spread has only its right page and the last spread of an even-paged binder only its left page. The missing side shows bare boards, not an empty page.

Below a viewport width of `layout.stackBelowPx`, the pages of a spread stack, left page first, and the spine is not drawn.

A filled slot shows the card's image in its pocket and nothing else. The rarity, set code, and condition belong to the copy's detail, which opens from the slot. An empty slot shows a dashed outline `layout.emptySlotStrokePx` wide and a plus in a tonal circle.

## Binder page-turn

- A turn moves one spread. It starts from a previous or next control, the left or right arrow key, or a horizontal swipe on the spread of at least `motion.swipeThresholdPx`.
- The arrow keys turn only while no dialog is open and focus is not in a text field, so typing in a search never turns the binder.
- There is no turn before the first spread or after the last. The control for it is disabled.
- The turn lasts `motion.pageFlipMs` on `motion.easing`. The page lifts from the gutter. The boards stay still.
- When the pages are stacked there is no gutter to lift from: the turn cuts. Swipe still turns.
- Reduced motion, or a user setting that asks for less motion, cuts to the destination spread, forward or back. It does not play the flip.
- Web and Android both follow this timing. Neither invents its own duration.

## Components

Use pill shapes for filled and tonal actions, circles for icon controls, and `layout.minTargetPx` for their touch targets. Use the filled action for confirming a printing, tonal actions for secondary choices, and text actions for back or remove. Search uses a full-radius surface with a leading search symbol and a trailing clear button when there is text. Card and printing rows place the identifying label above or beside the supporting information.

Dialogs use `radius.dialogPx` and a distinct container tone. Keep the picker destination and confirmation in view while results or printings scroll. At short heights, compact the controls and allow the dialog itself to scroll if they need more room.

## What clients must not do

- Hard-code a colour, a font, a size, or a duration that is already a token.
- Ship a page-turn that ignores reduced motion.
- Treat this folder as optional. If the spec and the screen disagree, the spec is wrong or the screen is. Fix the one that is wrong. Do not leave both.
