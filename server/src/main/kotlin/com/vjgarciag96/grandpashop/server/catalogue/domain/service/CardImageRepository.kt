package com.vjgarciag96.grandpashop.server.catalogue.domain.service

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Passcode
import java.io.IOException

/** Where a card's printed image comes from. */
interface CardImageRepository {
    /** The card's image as a JPEG. Throws [IOException] when the source cannot give it. */
    suspend fun image(passcode: Passcode): ByteArray
}
