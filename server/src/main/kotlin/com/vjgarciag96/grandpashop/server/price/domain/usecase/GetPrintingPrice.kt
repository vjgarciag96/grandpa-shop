package com.vjgarciag96.grandpashop.server.price.domain.usecase

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.PrintingKey
import com.vjgarciag96.grandpashop.server.price.domain.model.PriceLookup
import com.vjgarciag96.grandpashop.server.price.domain.service.CardmarketProductRepository
import com.vjgarciag96.grandpashop.server.price.domain.service.PriceGuideRepository

/** Today's price of a printing: its product from the committed table, priced by the one loaded guide, if any. */
class GetPrintingPrice(
    private val products: CardmarketProductRepository,
    private val guide: PriceGuideRepository?,
) {
    operator fun invoke(key: PrintingKey): PriceLookup {
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
