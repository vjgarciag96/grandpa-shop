package com.vjgarciag96.grandpashop.server.catalogue.domain.usecase

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Card
import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardRepository

class SearchCards(
    private val repository: CardRepository,
) {
    suspend operator fun invoke(
        query: String,
        limit: Int,
    ): List<Card> = repository.search(query, limit)
}
