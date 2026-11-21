# Roadmap

Nothing here is implemented. Lead frames an item before anyone builds it, and assigns it with [team/README.md](team/README.md). An item is not done until its slice has tests and has been graded by someone other than the author.

Live sync is blocked. [0009](docs/decisions/0009-realtime-transport.md) and [0010](docs/decisions/0010-sync-and-conflict-model.md) are open. Do not start the sync milestone by picking a transport in a pull request.

## 1. Persist one copy

Frame the types for Card, Printing, Copy, Binder, Page, Slot, and Collection, and store one copy in PostgreSQL.

Also frame, before any private route exists: how a request authenticates, and which tool runs schema migrations. Neither is decided.

Done when a caller can save one copy and read it back. Not started.

## 2. List the collection on the web

Show the copies the server stored, on a plain web page, using the design tokens.

Done when the page shows the copy from milestone 1, including an empty collection. Not started.

## 3. Turn a binder page

Browse one binder as a spread, with the page-turn from [design/guidelines.md](design/guidelines.md), including reduced motion.

Done when a gesture moves to the next spread and a reduced-motion setting cuts instead. Not started.

## 4. Show the collection on the phone

The Android client lists the same copies as the web.

Done when the phone shows the copy from milestone 1, including an empty collection. Not started.

## 5. Make one edit show up live

Frame the transport and the conflict model first. Then one edit on one surface appears on the other.

Done when those two decisions are accepted, and an edit made on one running client is visible on the other without a manual refresh. Not started. Blocked on the open decisions.

## 6. Install the web app as a window

Package the web app so it installs and opens like a desktop window.

Done when the installed window shows the collection list from milestone 2. Not started. The packaging tool is not chosen. See [0006](docs/decisions/0006-desktop-is-the-installed-web-app.md).
