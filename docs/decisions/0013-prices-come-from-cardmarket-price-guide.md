# Prices come from Cardmarket's public price guide

Status: accepted

Prices come from the two files Cardmarket publishes for Yu-Gi-Oh (game id 3) without authentication, refreshed daily:

- `https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_3.json`, the price guide: one row per Cardmarket product with trend, low, and average prices in euros, and the `createdAt` of the guide.
- `https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_3.json`, the product list: one row per product with its name and expansion id.

The server fetches the guide with the JDK `HttpClient` it already uses for YGOPRODeck, with the same User-Agent, and keeps the download on disk under a name carrying the guide's date, as it keeps the catalogue. Nothing refreshes it yet.

The map from a printing (set code and rarity) to a Cardmarket product is a data file generated in this repo and committed. The generator matches each set of the catalogue to the Cardmarket expansion whose product names are the same card names, then pairs a card's products with its rarities. It records how each row was settled. New sets are appended by running it again; a wrong row is edited by hand.

Why: Cardmarket closed its API to new applicants, and these files are the only first-party source of Cardmarket prices. YGOPRODeck's price fields are per card name or often zero, which does not value a printing. The price guide is what Víctor wants to see.

What this costs: the files are undocumented and may change or vanish without notice, so the server serves the last good download and the feature degrades to "no price". Products carry no set code or rarity, so the generated map is a best effort on ambiguous printings, and its inferred rows are marked for audit. Prices are per product: no condition, edition, language, or foil split. The same technique is used by MrDocMoris/cardscan-daten, whose data is not copied because it has no license.

No new library is added for this.
