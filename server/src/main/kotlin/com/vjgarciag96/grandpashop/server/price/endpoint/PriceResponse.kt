package com.vjgarciag96.grandpashop.server.price.endpoint

import kotlinx.serialization.Serializable

@Serializable
internal class PriceResponse(
    val cents: Long,
    val currency: String,
    val guideDate: String,
    val product: Long,
)
