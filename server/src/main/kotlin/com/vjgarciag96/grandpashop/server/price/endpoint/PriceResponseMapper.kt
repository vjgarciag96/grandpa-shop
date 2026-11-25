package com.vjgarciag96.grandpashop.server.price.endpoint

import com.vjgarciag96.grandpashop.server.price.domain.model.PriceLookup

internal fun PriceLookup.Found.toResponse() =
    PriceResponse(
        cents = price.cents,
        currency = "EUR",
        guideDate = price.guideDate.toString(),
        product = product.value,
    )
