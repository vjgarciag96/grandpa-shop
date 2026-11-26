# Visual guidelines

Grandpa Shop presents a physical binder on a desk. The cover and spine are flat black, the pages frame the catalogue artwork, and the controls use a light Material 3 palette. Use [tokens.json](tokens.json) for colour, type, shape, spacing, and motion.

## Colour

Blue-Eyes-inspired sapphire and ice blue mark primary actions and selections, with parchment surfaces and muted antique gold for secondary controls.

| Token | Use |
| --- | --- |
| `primary`, `onPrimary` | A filled action and its label. |
| `primaryContainer`, `onPrimaryContainer` | A held printing, the pocket a drag would drop into, and their contents. |
| `secondaryContainer`, `onSecondaryContainer` | Tonal controls, selected filter toggles, and their labels. |
| `surface`, `surfaceContainer*` | The desk, dialogs, and the distinct layers within them. |
| `onSurface`, `onSurfaceVariant` | Main and supporting content on surfaces. |
| `outline`, `outlineVariant` | Visible control boundaries and quiet dividers, respectively. |
| `error` | Destructive actions, error messages on light surfaces, and a filed copy about to leave the binder by drag. |
| `binderBoard`, `binderPage` | The physical cover, spine, and sheet surfaces. |
| `shelfBoard` | The boards of the shelf the binders stand on. It carries no text. |
| `foil` | A decorative rarity mark beside its text label. |

## Typography

Use the shared sans-serif family. Use the headline or title for an app or dialog heading, the body styles for card labels and descriptions, and the small label style for pocket destinations. The font stacks fall back to system fonts. Ship a font file only with a dependency decision.

## Layout

`space.slot` (8px) is the spacing unit for anything the layout tokens below do not name. Card corners use `radius.cardPx`.

Each binder has a 2×2, 3×3, or 4×4 grid of pockets on `page`, with `layout.pagePaddingPx` inside its edge and `layout.pocketGapPx` between pockets. Each pocket fills its grid column and keeps the card's shape, `layout.pocketAspect` (59 by 86 mm). One pocket is one slot: it holds one copy or is empty.

A spread is what an open binder shows (see Spread in [CONTEXT.md](../CONTEXT.md)): two facing pages, with the spine between them, `layout.spinePx` wide, on boards that show `layout.boardPaddingPx` around the pages. The first spread has only its right page and the last spread of an even-paged binder only its left page. The missing side shows bare boards, not an empty page.

Below a viewport width of `layout.stackBelowPx`, the pages of a spread stack, left page first, and the spine is not drawn.

A filled slot shows the card's image in its pocket and nothing else. The rarity, set code, and condition belong to the copy's detail, which opens from the slot. An empty slot shows a dashed outline `layout.emptySlotStrokePx` wide and a plus in a tonal circle.

## Shelf

The app opens on the shelf (see Shelf in [CONTEXT.md](../CONTEXT.md)), never straight into a binder. Under the app title it shows the "Binder shelf" heading and the note that cards are kept in this browser.

- **Boards.** The binders stand on boards in `shelfBoard`, `space.slot * 2` deep, each spanning the full width like a bookcase. When the binders do not fit on one board they wrap onto the next, so the page never scrolls sideways. Every board has the same height: a spine plus `space.slot * 3` of headroom.
- **Spines.** Each binder is one spine, `layout.shelfSpineWidthPx` by `layout.shelfSpineHeightPx`, in `binderBoard` with its name in `binderPage`, in shelf order with `space.slot` between them. The name is the only content. It reads top to bottom along the spine in the body-small style at weight 600, and a name too long for the spine is cut off with an ellipsis. The spine's accessible name and tooltip are always the full name. The top corners use half of `radius.cardPx`. Choosing a spine opens that binder at page 1 with the catalogue closed and focus on the binder's name. Back to shelf, a text action with a back chevron at the start of the desk's actions, returns to the shelf with focus on that binder's spine.
- **Last opened.** The binder opened last carries a small "Last opened" label over the foot of its spine, in `primaryContainer` and `onPrimaryContainer`, label-small, reading along the spine. The label describes the spine. It does not open the binder or take focus when the shelf loads.
- **New binder.** After the last spine, on the same board, stands a spine-sized spot with the empty-pocket look: a dashed outline `layout.emptySlotStrokePx` wide, a plus in a tonal circle, and "New binder" along it. It opens the New binder dialog, which names the binder and sets its pockets per page and pages. A new binder goes to the end of the shelf and opens. Closing the dialog returns focus to New binder.

## Binder page-turn

- A turn moves one spread. It starts from a previous or next control, the left or right arrow key, or a horizontal swipe on the spread of at least `motion.swipeThresholdPx`.
- The arrow keys turn only while a binder is open, no dialog is open, and focus is not in a text field, so typing in a search never turns the binder and the shelf never turns one.
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
- At or above `layout.panelBesideFromPx` the panel is a column `layout.panelWidthPx` wide on the right of the binder, as tall as the viewport, on `surfaceContainer` with `radius.surfacePx`. The binder shrinks so that the whole spread and the panel are visible together, with no horizontal scroll. Pockets keep `layout.pocketAspect`. With a 4×4 grid, the available width after any vertical scrollbar must fit eight pockets of `layout.minTargetPx` across the two facing pages, plus their gaps, the binder, desk spacing, and the panel.
- Below the beside-panel threshold for the binder’s grid, the panel is a bottom sheet `layout.sheetHeightPercent` of the viewport tall, with `radius.dialogPx` on its top corners. The binder scrolls above it, and the desk gets the same space at its bottom so every pocket can be scrolled clear of the sheet.

### Head and results

- The panel head says where the next printing goes, and holds the close button:
  - with a target: "Adding to page 1, slot 3", or "Replacing Dark Magician" when the target is a filled pocket being replaced;
  - with nothing targeted or held: "Add cards", with the hint "Pick up a printing, then choose an empty slot";
  - while holding: "Holding TLM-EN001", with the hint "Choose an empty slot".
- Search sits under the head, and results scroll beneath it. Matching sets come first, under a "Sets" label, then matching cards under "Cards".
- A set row shows the set name above its prefix and printing count, such as "TLM · 85 printings". Opening it shows the set's printings in set-code order under a head with a back action, the set name, and the count.
- An opened set with two or more rarities shows a "Rarity" group of toggle buttons above its printings, one per rarity with its count, Common, Rare, Super Rare, Ultra Rare, and Secret Rare first, then the rest alphabetically. A selected toggle is `secondaryContainer` with a leading check; `primaryContainer` stays for a held printing. While any is selected, a text "Clear" action sits beside the label.
- An opened set with two or more print runs shows a "Print run" group under the Rarity group, alike in look and behaviour, one toggle per print run in set-code order, such as "LOB- 126", "LOB-E 103", and "LOB-EN 129". Each group counts what the other group leaves, and a toggle with nothing left stays, showing 0. While a rarity or print run is chosen, "11 of 85 printings" shows under the groups, above the list.
- A card row opens to that card's printings inside the panel, under a head with a back action and the card's name.
- A printing row shows the card's thumbnail, the set code above the rarity, and the card name in a set, or the set name in a card.

### Picking up and placing

Printing rows and pockets are buttons, so each step works by tapping, by clicking, or with Enter or Space on the focused control. The aim outline below is drawn inside a pocket's edge. Keyboard focus on a pocket is a ring outside its edge, offset by `layout.aimStrokePx`, in `onSurface`, so a focused pocket stands out from the other aimed pockets.

- With a target, choosing a printing places it in the target at once. The target clears.
- With no target, choosing a printing picks it up. The row turns `primaryContainer`. Choosing the held row again, or pressing Escape, puts it down. Choosing another row holds that one instead.
- While holding, every empty pocket shows a `primary` outline `layout.aimStrokePx` wide. Choosing one places the held printing there and puts it down.
- With nothing held, choosing an empty pocket makes it the target. The target shows the same outline, including a filled pocket being replaced. Escape clears it. With nothing held or targeted, Escape does nothing.
- Closing the panel puts down what is held and clears the target.
- A filled pocket never takes a printing from the panel by tap or keyboard, except the one being replaced. While holding, choosing a filled pocket keeps holding, opens nothing, and says "Page 1, slot 2 is filled". A filled pocket shows no outline, except the one being replaced.
- Every placement is announced in words, such as "Placed TLM-EN001 in page 1, slot 3". A placement that replaces a copy names it, whether it comes from the copy's detail or from a drag: "Placed LOB-EN119 in page 1, slot 1, replacing SDY-006".

## Dragging

### Both

- While dragging, the card's full image follows the pointer at the size of a pocket on the open spread, with `radius.cardPx`, at `layout.dragGhostOpacity` so the pocket beneath shows through. It stays held at the point where it was grabbed, so a copy's card starts exactly over its pocket.
- The drop target is the pocket the card covers most, empty or filled, on the open spread; on equal cover the earlier page and slot win. Only the part of a pocket you can see counts, and a pocket counts only when that part covers at least `layout.dropMinCoverShare` of the card, so a graze never arms a drop. If the pocket covered most cannot take the drag (below), there is no target: a neighbouring pocket never wins instead.
- An empty target fills with `primaryContainer`. A filled target shows the `primary` outline `layout.aimStrokePx` wide, inside its edge. Other filled pockets show nothing.
- A release drops only on the pocket shown as the target at that moment. When the spread turns mid-drag, no pocket is a target until the pointer moves again.
- A drag does not turn the spread. Turning stays on its controls, the arrow keys, and a swipe.

### Dragging a printing

- Dragging a printing is offered only while the panel is beside the binder. In the bottom sheet, pick up and place is the way to add a card.
- A press on a printing becomes a drag once the pointer moves `motion.dragStartPx`. A shorter movement is a tap.
- While dragging, every empty pocket shows the `primary` outline, as when holding.
- Any pocket can be the target of a mouse or pen drag. In a touch drag, a filled pocket covered most is no target, so it shows nothing.
- Releasing on an empty target places the printing there and announces it.
- Releasing a mouse or pen drag on a filled target files a new Near Mint copy of the printing there, and the copy that was there leaves the binder, as with Remove. There is no confirmation. The replace is announced as "Placed LOB-EN119 in page 1, slot 1, replacing SDY-006". A touch drag never replaces a copy.
- Releasing with no target, off the binder included, pressing Escape, letting go of the primary button, or releasing another button drops nothing. There is no animation back to the panel.

### Dragging a filed copy

- A filed copy can be dragged with a mouse or pen, with the panel open or closed. Touch never drags a copy: a touch press opens its detail, and a touch swipe turns the spread.
- A press on a copy becomes a drag once the pointer moves `motion.dragStartPx`. A shorter movement is a tap, which opens its detail.
- While dragging, every empty pocket on the open spread shows the `primary` outline.
- The copy's own pocket is never a target: while the card covers it most, nothing is lit and a release changes nothing.
- Releasing on an empty target on either visible page moves the copy there. The original pocket becomes empty, the copy keeps its printing and condition, and the move is announced as "Moved SDY-006 to page 1, slot 3".
- Releasing on a filled target swaps the two. Each keeps its printing and condition. The swap is announced as "Swapped SDY-006 to page 1, slot 2 and LOB-EN005 to page 1, slot 1".
- The binder is the open pages and the spine, as far as you can see them. The card is off the binder once no part of it touches them. The board around the pages, the bare inside cover on the first or last spread, the catalogue panel, and the bottom sheet are off the binder.
- While the card is off the binder, the copy's own pocket shows as empty and the card shows at `layout.dragGhostRemovingOpacity` with the `error` outline `layout.aimStrokePx` wide, inside its edge. Bringing the card back over the binder restores the normal look.
- Releasing with the card off the binder takes the copy out of the binder, as with Remove. There is no confirmation and no undo. The removal is announced as "Removed SDY-006 from page 1, slot 1". A replace target on that pocket stays the target, now empty.
- Releasing with no target while the card still touches the binder, such as in a gap between pockets or over the spine, pressing Escape, letting go of the primary button, releasing another button, or opening a copy's detail changes nothing. Turning the spread mid-drag cancels the drag: a copy does not leave its spread.

## What clients must not do

- Hard-code a colour, a font, a size, or a duration that is already a token.
- Ship a page-turn that ignores reduced motion.
- Treat this folder as optional. If the spec and the screen disagree, the spec is wrong or the screen is. Fix the one that is wrong. Do not leave both.
