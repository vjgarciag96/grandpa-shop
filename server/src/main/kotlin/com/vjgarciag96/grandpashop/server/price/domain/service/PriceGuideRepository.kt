package com.vjgarciag96.grandpashop.server.price.domain.service

import com.vjgarciag96.grandpashop.server.price.domain.model.CardmarketProductId
import com.vjgarciag96.grandpashop.server.price.domain.model.Price

interface PriceGuideRepository {
    fun trend(product: CardmarketProductId): Price?
}
