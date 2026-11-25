package com.vjgarciag96.grandpashop.server.catalogue.domain.usecase

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.CardSet
import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardRepository

class SearchSets(
    private val repository: CardRepository,
) {
    suspend operator fun invoke(
        query: String,
        limit: Int,
    ): List<CardSet> = repository.searchSets(query, limit)
}
