package com.vjgarciag96.grandpashop.server.price.domain.service

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.PrintingKey
import com.vjgarciag96.grandpashop.server.price.domain.model.CardmarketProductId

interface CardmarketProductRepository {
    fun productOf(key: PrintingKey): CardmarketProductId?
}
