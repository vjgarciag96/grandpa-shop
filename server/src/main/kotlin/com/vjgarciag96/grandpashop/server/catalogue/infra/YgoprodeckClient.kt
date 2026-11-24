package com.vjgarciag96.grandpashop.server.catalogue.infra

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Passcode
import com.vjgarciag96.grandpashop.server.core.Downloads
import com.vjgarciag96.grandpashop.server.core.cachedText
import java.nio.file.Path

/**
 * The YGOPRODeck API v7. It asks callers to cache what they download and not to hotlink images,
 * which the server keeps to.
 */
object YgoprodeckClient {
    private const val CARD_INFO = "https://db.ygoprodeck.com/api/v7/cardinfo.php"
    private const val SMALL_IMAGES = "https://images.ygoprodeck.com/images/cards_small"
    private const val NAME = "YGOPRODeck"
    private const val CARD_INFO_FILE = "cardinfo.json"

    /** The card dump kept in [cacheDir] as `cardinfo.json`, downloaded once when it is not there yet. */
    fun keptCardInfo(cacheDir: Path): String = cachedText(cacheDir.resolve(CARD_INFO_FILE), ::cardInfo)

    private fun cardInfo(): String = Downloads.text(CARD_INFO, NAME)

    fun smallImage(passcode: Passcode): ByteArray = Downloads.bytes("$SMALL_IMAGES/${passcode.value}.jpg", NAME)
}
