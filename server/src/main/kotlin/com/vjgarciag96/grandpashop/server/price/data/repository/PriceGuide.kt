package com.vjgarciag96.grandpashop.server.price.data.repository

import com.vjgarciag96.grandpashop.server.price.domain.model.CardmarketProductId
import com.vjgarciag96.grandpashop.server.price.domain.model.Price
import com.vjgarciag96.grandpashop.server.price.domain.service.PriceGuideRepository
import java.time.LocalDate

/** One day's Cardmarket price guide: the trend in euro cents per product, and the day Cardmarket made it. */
class PriceGuide(
    val createdOn: LocalDate,
    private val trends: Map<CardmarketProductId, Long>,
) : PriceGuideRepository {
    /** The product's trend price on this guide's day, or null when the guide has no trend for it. */
    override fun trend(product: CardmarketProductId): Price? = trends[product]?.let { Price(it, createdOn) }
}
