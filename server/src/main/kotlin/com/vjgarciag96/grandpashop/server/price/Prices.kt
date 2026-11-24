package com.vjgarciag96.grandpashop.server.price

/** What asking for a printing's price can come to. */
sealed interface PriceLookup {
    data class Found(
        val price: Price,
        val product: CardmarketProductId,
    ) : PriceLookup

    /** The table has no row for the printing. */
    data object NoProduct : PriceLookup

    /** The table names a product, but the loaded guide has no trend for it. */
    data object NoTrend : PriceLookup

    /** The table names a product, but no guide was loaded this run. */
    data object NoGuide : PriceLookup
}

/** Today's price of a printing: its product from the committed table, priced by the one loaded guide, if any. */
class Prices(
    private val products: CardmarketProducts,
    private val guide: PriceGuide?,
) {
    fun of(key: PrintingKey): PriceLookup {
        val product = products.productOf(key)
        val price = product?.let { guide?.trend(it) }
        return when {
            product == null -> PriceLookup.NoProduct
            guide == null -> PriceLookup.NoGuide
            price == null -> PriceLookup.NoTrend
            else -> PriceLookup.Found(price, product)
        }
    }
}
