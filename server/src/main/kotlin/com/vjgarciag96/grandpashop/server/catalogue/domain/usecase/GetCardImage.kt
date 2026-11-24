package com.vjgarciag96.grandpashop.server.catalogue.domain.usecase

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Passcode
import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardImageRepository
import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardRepository

class GetCardImage(
    private val cards: CardRepository,
    private val images: CardImageRepository,
) {
    // Only a card in the catalogue reaches the image source, so a request cannot make the server fetch and keep
    // whatever passcode it names.
    suspend operator fun invoke(passcode: Passcode): ByteArray? {
        if (!cards.contains(passcode)) return null
        return images.image(passcode)
    }
}
