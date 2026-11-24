package com.vjgarciag96.grandpashop.server.catalogue

import com.vjgarciag96.grandpashop.server.http.Downloads

/**
 * The YGOPRODeck API v7. It asks callers to cache what they download and not to hotlink images,
 * which the server keeps to.
 */
object Ygoprodeck {
    private const val CARD_INFO = "https://db.ygoprodeck.com/api/v7/cardinfo.php"
    private const val SMALL_IMAGES = "https://images.ygoprodeck.com/images/cards_small"
    private const val NAME = "YGOPRODeck"

    fun cardInfo(): String = Downloads.get(CARD_INFO, NAME).use { it.readBytes().decodeToString() }

    fun smallImage(passcode: Passcode): ByteArray {
        val url = "$SMALL_IMAGES/${passcode.value}.jpg"
        return Downloads.get(url, NAME).use { it.readBytes() }
    }
}
