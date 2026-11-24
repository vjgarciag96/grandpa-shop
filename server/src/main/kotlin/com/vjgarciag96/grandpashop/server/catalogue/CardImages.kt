package com.vjgarciag96.grandpashop.server.catalogue

import com.vjgarciag96.grandpashop.server.files.cachedBytes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.nio.file.Path

/** Card images, fetched from the source once per card and kept in [cacheDir] after that. */
class CardImages(
    private val cacheDir: Path,
    private val catalogue: CardCatalogue,
    private val fetch: (Passcode) -> ByteArray,
) {
    /**
     * The card's image, or null when the passcode is not in the catalogue.
     * The download and file write run on the IO pool so the request thread stays free.
     */
    suspend fun image(passcode: Passcode): ByteArray? =
        if (catalogue.contains(passcode)) {
            withContext(Dispatchers.IO) { cachedBytes(cacheDir.resolve("${passcode.value}.jpg")) { fetch(passcode) } }
        } else {
            null
        }
}
