package com.vjgarciag96.grandpashop.server.price

import java.time.LocalDate

@JvmInline
value class CardmarketProductId(
    val value: Long,
)

/** How a client and the product table name a printing: set code and rarity exactly as the catalogue serves them. */
data class PrintingKey(
    val setCode: String,
    val rarity: String,
)

/** A trend price in euro cents and the day of the guide it came from. */
data class Price(
    val cents: Long,
    val guideDate: LocalDate,
)
