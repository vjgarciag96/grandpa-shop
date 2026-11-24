package com.vjgarciag96.grandpashop.server.price.domain.model

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
