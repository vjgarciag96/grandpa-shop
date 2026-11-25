package com.vjgarciag96.grandpashop.server.catalogue.infra

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Passcode
import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardImageRepository
import com.vjgarciag96.grandpashop.server.core.cachedBytes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.nio.file.Path

/** Card images, fetched from the source once per card and kept in [cacheDir] after that. */
class CachedCardImageRepository(
    private val cacheDir: Path,
    private val fetch: (Passcode) -> ByteArray,
) : CardImageRepository {
    override suspend fun image(passcode: Passcode): ByteArray =
        withContext(Dispatchers.IO) { cachedBytes(cacheDir.resolve("${passcode.value}.jpg")) { fetch(passcode) } }
}
