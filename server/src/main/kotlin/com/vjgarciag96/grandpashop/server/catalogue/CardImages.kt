package com.vjgarciag96.grandpashop.server.catalogue

import com.vjgarciag96.grandpashop.server.files.cachedBytes
import java.nio.file.Path

/** Card images, fetched from the source once per card and kept in [cacheDir] after that. */
class CardImages(
    private val cacheDir: Path,
    private val catalogue: CardCatalogue,
    private val fetch: (Passcode) -> ByteArray,
) {
    /** The card's image, or null when the passcode is not in the catalogue. */
    fun image(passcode: Passcode): ByteArray? =
        if (catalogue.contains(passcode)) {
            cachedBytes(cacheDir.resolve("${passcode.value}.jpg")) { fetch(passcode) }
        } else {
            null
        }
}
