package com.vjgarciag96.grandpashop.server.catalogue

import java.io.IOException
import java.io.InputStream
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import java.util.zip.GZIPInputStream

/**
 * The YGOPRODeck API v7. It asks callers to cache what they download and not to hotlink images,
 * which the server keeps to.
 */
object Ygoprodeck {
    private const val CARD_INFO = "https://db.ygoprodeck.com/api/v7/cardinfo.php"
    private const val SMALL_IMAGES = "https://images.ygoprodeck.com/images/cards_small"
    private const val USER_AGENT = "grandpa-shop (github.com/vjgarciag96/grandpa-shop)"
    private const val HTTP_OK = 200
    private const val CONNECT_TIMEOUT_SECONDS = 10L
    private const val DOWNLOAD_TIMEOUT_MINUTES = 2L
    private val CONNECT_TIMEOUT = Duration.ofSeconds(CONNECT_TIMEOUT_SECONDS)
    private val DOWNLOAD_TIMEOUT = Duration.ofMinutes(DOWNLOAD_TIMEOUT_MINUTES)
    private val client = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build()

    fun cardInfo(): String = get(CARD_INFO).use { it.readBytes().decodeToString() }

    fun smallImage(passcode: Passcode): ByteArray = get("$SMALL_IMAGES/${passcode.value}.jpg").use { it.readBytes() }

    private fun get(url: String): InputStream {
        val request =
            HttpRequest
                .newBuilder(URI.create(url))
                .header("User-Agent", USER_AGENT)
                .header("Accept-Encoding", "gzip")
                .timeout(DOWNLOAD_TIMEOUT)
                .build()
        val response = client.send(request, HttpResponse.BodyHandlers.ofInputStream())
        if (response.statusCode() != HTTP_OK) {
            response.body().close()
            throw IOException("YGOPRODeck answered ${response.statusCode()} for $url")
        }
        val gzipped = response.headers().firstValue("Content-Encoding").orElse("") == "gzip"
        return if (gzipped) GZIPInputStream(response.body()) else response.body()
    }
}
