package com.vjgarciag96.grandpashop.server.price.domain.model

import java.time.LocalDate

@JvmInline
value class CardmarketProductId(
    val value: Long,
)

/** A trend price in euro cents and the day of the guide it came from. */
data class Price(
    val cents: Long,
    val guideDate: LocalDate,
)
