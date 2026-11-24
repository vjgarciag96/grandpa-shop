package com.vjgarciag96.grandpashop.server.price

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate

/** One day's Cardmarket price guide: the trend in euro cents per product, and the day Cardmarket made it. */
class PriceGuide(
    val createdOn: LocalDate,
    private val trends: Map<CardmarketProductId, Long>,
) {
    /** The product's trend price on this guide's day, or null when the guide has no trend for it. */
    fun trend(product: CardmarketProductId): Price? = trends[product]?.let { Price(it, createdOn) }

    companion object {
        private val json = Json { ignoreUnknownKeys = true }
        private const val DATE_LENGTH = "2026-11-23".length

        /**
         * Reads Cardmarket's `price_guide_3.json`. A row with a null or negative trend leaves its product without
         * a price: a price below nothing is a guide defect, not a value to show.
         */
        fun parse(text: String): PriceGuide {
            val guide = json.decodeFromString<Source>(text)
            val trends =
                guide.priceGuides
                    .mapNotNull { row -> row.trend?.takeIf { it >= 0 }?.let { row.idProduct to it } }
                    .associate { (product, euros) -> CardmarketProductId(product) to cents(euros) }
            return PriceGuide(LocalDate.parse(guide.createdAt.take(DATE_LENGTH)), trends)
        }

        // Decimal text, not binary arithmetic, so 40.06 becomes 4006 and never 4005.
        private fun cents(euros: Double): Long =
            BigDecimal(euros.toString()).movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact()

        @Serializable
        private class Source(
            val createdAt: String,
            val priceGuides: List<SourceRow>,
        )

        @Serializable
        private class SourceRow(
            val idProduct: Long,
            val trend: Double? = null,
        )
    }
}
