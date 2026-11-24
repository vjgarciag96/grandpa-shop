# Roadmap

Nothing here is implemented. Lead frames an item before anyone builds it, and assigns it with [team/README.md](team/README.md). An item is not done until its slice has tests and has been graded by someone other than the author.

Live sync is blocked. [0009](docs/decisions/0009-realtime-transport.md) and [0010](docs/decisions/0010-sync-and-conflict-model.md) are open. Do not start the sync milestone by picking a transport in a pull request.

## 1. Persist one copy

Store one copy in PostgreSQL, using the Card, Printing, Copy, Binder, Page, and Slot that milestone 3 models first, and frame the Collection type.

Also frame, before any private route exists: how a request authenticates, and which tool runs schema migrations. Neither is decided.

Done when a caller can save one copy and read it back. Not started.

## 2. List the collection on the web

Show the copies the server stored, on a plain web page, using the design tokens.

Done when the page shows the copy from milestone 1, including an empty collection. Not started.

## 3. Fill and turn a binder spread

Browse one binder of 20 sheets (40 pages of nine slots, 360 slots) spread by spread, fill a slot by searching the catalogue and picking a printing, see and edit the copy in a slot, and turn spreads with the page-turn from [design/guidelines.md](design/guidelines.md), including reduced motion. The server serves the catalogue from YGOPRODeck. Copies stay in the page's memory until milestone 1 saves them.

Built ahead of milestones 1 and 2, because Víctor wants to see the binder before persistence. Framed in [#1](https://github.com/vjgarciag96/grandpa-shop/issues/1). Owners: design, backend, web.

Done when a slot filled from the catalogue shows its card; its detail shows the printing and condition, the condition can be changed, and the copy can be removed; a gesture moves to the next spread and a reduced-motion setting cuts instead; and there is no turn before the first spread or after the last. The full checks are in [#1](https://github.com/vjgarciag96/grandpa-shop/issues/1). In progress.

## 4. Show the collection on the phone

The Android client lists the same copies as the web.

Done when the phone shows the copy from milestone 1, including an empty collection. Not started.

## 5. Make one edit show up live

Frame the transport and the conflict model first. Then one edit on one surface appears on the other.

Done when those two decisions are accepted, and an edit made on one running client is visible on the other without a manual refresh. Not started. Blocked on the open decisions.

## 6. Install the web app as a window

Package the web app so it installs and opens like a desktop window.

Done when the installed window shows the collection list from milestone 2. Not started. The packaging tool is not chosen. See [0006](docs/decisions/0006-desktop-is-the-installed-web-app.md).

## 7. File cards from a catalogue panel

Replace the one-slot picker with a catalogue panel beside the binder. Search by card name or open a set, which lists its printings in set-code order, then place a printing in a slot by tapping or by dragging it there. A printing dragged onto a filled slot with a mouse or pen replaces the copy there, and that copy leaves the binder. Holding a printing and then tapping or choosing a filled slot with the keyboard still refuses it. Replace in a copy's detail aims the panel at that slot, so the next printing chosen replaces the copy. Copies stay in the page's memory, as in milestone 3.

Built on milestone 3, because filling a binder from a set card by card is too slow. Framed in [#11](https://github.com/vjgarciag96/grandpa-shop/issues/11). Owners: design, web, backend.

Done when typing "lost" lists The Lost Millennium, opening it lists all 85 of its printings in set-code order from TLM-EN001, and a printing dragged onto an empty slot, or picked up and placed with the keyboard, fills it. The panel and the full spread fit side by side on a desktop, and the panel is a bottom sheet on a phone. The full checks are in [#11](https://github.com/vjgarciag96/grandpa-shop/issues/11) and its design comment. In progress.

## 8. Move a copy within a binder spread

Drag a filed copy with a mouse or pen to an empty pocket on either visible page. The original pocket becomes empty, and the copy keeps its printing and condition. Dropping it on another filed copy swaps the two, and each keeps its printing and condition. Dragging it until the card no longer touches the open pages or the spine and releasing it there takes the copy out of the binder, as Remove does, with no confirmation; a release in a gap between pockets or over the spine changes nothing. Owner: web.

## 9. Show a filed copy's Cardmarket price

A copy's detail on the web shows the price of its printing: Cardmarket's trend price in euros and the date of the guide it came from, as "40.06 € · Cardmarket, 23 Nov 2026". The server downloads Cardmarket's public daily price guide once and keeps it, and maps a printing to its Cardmarket product with a table generated in the repo from the card names of each set. Ties in that table are settled when it is generated, and a wrong row is fixed by editing the table. See [0013](docs/decisions/0013-prices-come-from-cardmarket-price-guide.md). Owners: lead (glossary and decision), backend (generator, table, price route), web (the detail line).

Done when the generated table maps SRL-029 Ultra Rare to Cardmarket product 579386 and at least 35,000 printings in all; the server answers the trend price of SRL-029 Ultra Rare from the kept guide and 404 for a printing with no row; and a filed Spell Ruler Relinquished shows that price in its detail while a copy with no row shows no price line. History, totals, refresh cadence, and corrections from the client are not in this item. In progress.
