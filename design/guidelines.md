# Visual guidelines

Grandpa Shop presents a physical binder on a desk. The cover and spine are flat black, the pages frame the catalogue artwork, and the controls use a light Material 3 palette. Use [tokens.json](tokens.json) for colour, type, shape, spacing, and motion.

## Colour

Blue-Eyes-inspired sapphire and ice blue mark primary actions and selections, with parchment surfaces and muted antique gold for secondary controls.

| Token | Use |
| --- | --- |
| `primary`, `onPrimary` | A filled action and its label. |
| `primaryContainer`, `onPrimaryContainer` | A held printing, the pocket under a drag, and their contents. |
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

Use pill shapes for filled and tonal actions, circles for icon controls, and `layout.minTargetPx` for their touch targets. Use the filled action for the main action of a dialog, tonal actions for secondary choices, and text actions for back or remove. Search uses a full-radius surface with a leading search symbol and a trailing clear button when there is text. Card and printing rows place the identifying label above or beside the supporting information.

Dialogs use `radius.dialogPx` and a distinct container tone. At short heights, compact the controls and allow the dialog itself to scroll if they need more room.

## Catalogue panel

Cards are added from a catalogue panel, not from a dialog per pocket. The panel stays open while you fill the binder, and the binder stays usable beside it: the spread still turns, and a filled pocket still opens its copy's detail.

### Opening and placement

- An "Add cards" tonal action with a leading plus sits in the desk head, before the turn controls. It opens the panel with no target. Tapping an empty pocket while the panel is closed opens it with that pocket as the target.
- At or above `layout.panelBesideFromPx` the panel is a column `layout.panelWidthPx` wide on the right of the binder, as tall as the viewport, on `surfaceContainer` with `radius.surfacePx`. The binder shrinks so that the whole spread and the panel are visible together, with no horizontal scroll. Pockets keep `layout.pocketAspect`. The threshold keeps a pocket at least `layout.minTargetPx` wide beside the panel.
- Below `layout.panelBesideFromPx` the panel is a bottom sheet `layout.sheetHeightPercent` of the viewport tall, with `radius.dialogPx` on its top corners. The binder scrolls above it, and the desk gets the same space at its bottom so every pocket can be scrolled clear of the sheet.

### Head and results

- The panel head says where the next printing goes, and holds the close button:
  - with a target: "Adding to page 1, slot 3", or "Replacing Dark Magician" when the target is a filled pocket being replaced;
  - with nothing targeted or held: "Add cards", with the hint "Pick up a printing, then choose an empty slot";
  - while holding: "Holding TLM-EN001", with the hint "Choose an empty slot".
- Search sits under the head, and results scroll beneath it. Matching sets come first, under a "Sets" label, then matching cards under "Cards".
- A set row shows the set name above its prefix and printing count, such as "TLM · 85 printings". Opening it shows the set's printings in set-code order under a head with a back action, the set name, and the count.
- A card row opens to that card's printings inside the panel, under a head with a back action and the card's name.
- A printing row shows the card's thumbnail, the set code above the rarity, and the card name in a set, or the set name in a card.

### Picking up and placing

Printing rows and pockets are buttons, so each step works by tapping, by clicking, or with Enter or Space on the focused control. The aim outline below is drawn inside a pocket's edge. Keyboard focus on a pocket is a ring outside its edge, offset by `layout.aimStrokePx`, in `onSurface`, so a focused pocket stands out from the other aimed pockets.

- With a target, choosing a printing places it in the target at once. The target clears.
- With no target, choosing a printing picks it up. The row turns `primaryContainer`. Choosing the held row again, or pressing Escape, puts it down. Choosing another row holds that one instead.
- While holding, every empty pocket shows a `primary` outline `layout.aimStrokePx` wide. Choosing one places the held printing there and puts it down.
- With nothing held, choosing an empty pocket makes it the target. The target shows the same outline, including a filled pocket being replaced. Escape clears it. With nothing held or targeted, Escape does nothing.
- Closing the panel puts down what is held and clears the target.
- A filled pocket never takes a printing from the panel, except the one being replaced. While holding, choosing a filled pocket keeps holding, opens nothing, and says "Page 1, slot 2 is filled". A filled pocket shows no outline, except the one being replaced.
- Every placement is announced in words, such as "Placed TLM-EN001 in page 1, slot 3".

## Dragging

- Dragging is offered only while the panel is beside the binder. In the bottom sheet, pick up and place is the way to add a card.
- A press on a printing becomes a drag once the pointer moves `motion.dragStartPx`. A shorter movement is a tap.
- While dragging, the card's thumbnail follows the pointer, `layout.dragGhostWidthPx` wide at `layout.pocketAspect`, with `radius.cardPx`, at `layout.dragGhostOpacity` so the pocket beneath shows through. Every empty pocket shows the `primary` outline, as when holding.
- An empty pocket under the pointer also fills with `primaryContainer`. A filled pocket does not change while a printing is dragged.
- Releasing over an empty pocket places the printing there and announces it. Releasing anywhere else, or pressing Escape, drops nothing. There is no animation back to the panel.
- A dragged printing only fills an empty pocket. Replacing a copy stays a tap, from its detail.
- A filed copy dragged with a mouse or pen onto another filled pocket on the open spread swaps the two. Each keeps its printing and condition. The swap is announced as "Swapped SDY-006 to page 1, slot 2 and LOB-EN005 to page 1, slot 1". Releasing on the copy's own pocket changes nothing.
- While dragging a copy, a filled pocket under the pointer shows the `primary` outline `layout.aimStrokePx` wide, inside its edge. Other filled pockets and the source show nothing.
- The drag does not turn the spread. Turning stays on its controls, the arrow keys, and a swipe.

## What clients must not do

- Hard-code a colour, a font, a size, or a duration that is already a token.
- Ship a page-turn that ignores reduced motion.
- Treat this folder as optional. If the spec and the screen disagree, the spec is wrong or the screen is. Fix the one that is wrong. Do not leave both.
