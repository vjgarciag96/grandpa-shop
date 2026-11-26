# Roadmap

Frame an item before building it. An item is not done until its slice has tests and has been reviewed.

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

A copy's detail on the web shows the price of its printing, as "40.06 € · Cardmarket, 23 Nov 2026". The server downloads Cardmarket's price guide once and keeps it under a name carrying the guide's date, and finds a printing's Cardmarket product in the product table. Ties in the table are settled when it is generated, and a wrong row is fixed by editing the table. Framed in `.work/cardmarket-price/agreement.md` under autonomous delivery. See [0013](docs/decisions/0013-prices-come-from-cardmarket-price-guide.md). Owners: lead (glossary and decision), backend (generator, product table, price route), web (the detail line).

Done when the generated product table maps SRL-029 Ultra Rare to Cardmarket product 579386 and at least 35,000 printings in all; the kept guide file is named with the guide's date; the server answers the price of SRL-029 Ultra Rare from the kept guide, 404 for a printing with no price, and 400 for a missing set code or rarity; and a filed Spell Ruler Relinquished shows that price in its detail while a copy with no price shows no price line. History, totals, refresh cadence, and corrections from the client are not in this item. In progress.

## 10. Place an opened set's listed printings in one go

An opened set's printing list in the catalogue panel offers one button, "Place all 11", that files a Near Mint copy of every printing it lists, narrowed by the chosen rarities when any are, in set-code order. The run starts at the targeted pocket, or at slot 1 of the leftmost page of the open spread, and walks forward pocket by pocket onto later pages. Filled pockets are skipped, never replaced. If too few empty pockets follow the start, nothing is placed and the panel says how many there are. The aim is cleared and the panel stays open on the same set. A card's printing list from a name search has no such button. Framed in `.work/bulk-add/agreement.md` under autonomous delivery. Owner: web.

Done when, in an empty Binder 1, choosing Super Rare and Ultra Rare in The Lost Millennium and pressing "Place all 11" fills page 1 slots 1–9 with TLM-EN050–058 and page 2 slots 1–2 with TLM-EN059 and TLM-EN060, the copies survive a reload, and the panel stays open as a bottom sheet on a phone.
