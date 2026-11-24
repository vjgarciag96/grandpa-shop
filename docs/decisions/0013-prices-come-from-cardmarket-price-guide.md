# Prices come from Cardmarket's public price guide

Status: accepted

Cardmarket publishes two files for Yu-Gi-Oh (game id 3) without authentication, refreshed daily:

- `https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_3.json`, the price guide: one row per Cardmarket product with trend, low, and average prices in euros, and the `createdAt` of the guide. The server serves prices from it.
- `https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_3.json`, the product list: one row per product with its name, its expansion id, and the date it was added. Only the generator of the product table reads it.

The server fetches the guide with the JDK `HttpClient` it already uses for YGOPRODeck, with the same User-Agent, and keeps the download on disk under a name carrying the guide's date. Nothing refreshes it yet.

The product table maps a printing (set code and rarity) to a Cardmarket product. It is a data file generated in this repo and committed. The generator matches each set of the catalogue to the Cardmarket expansion whose product names are the same card names, and when several expansions tie it takes the one added to Cardmarket first. Within a set it pairs a card's products, in price order, with its rarities, in rarity order. It records how each row was settled, so inferred rows can be audited. New sets are appended by running it again; a wrong row is edited by hand.

Why: Cardmarket closed its API to new applicants, and these files are the only first-party source of Cardmarket prices. YGOPRODeck's price fields are per card name or often zero, which does not value a printing. The price guide is what Víctor wants to see.

What this costs: the files are undocumented and may change or vanish without notice, so the server serves the last good download and the feature degrades to "no price". Products carry no set code or rarity, so the product table is a best effort on ambiguous printings. Prices are per product: no condition, edition, language, or finish split.

The same technique is used by MrDocMoris/cardscan-daten, whose data is not copied because it has no license. No new library is added for this.
