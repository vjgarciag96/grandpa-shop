package com.vjgarciag96.grandpashop.server.catalogue.domain.usecase

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.SetContents
import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardRepository

class GetSetContents(
    private val repository: CardRepository,
) {
    suspend operator fun invoke(name: String): SetContents? = repository.findSet(name)
}
