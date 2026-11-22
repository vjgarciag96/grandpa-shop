package com.vjgarciag96.grandpashop.server.catalogue

import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import java.util.zip.GZIPInputStream

/** The YGOPRODeck API v7. It asks callers to cache what they download, which the server does. */
object Ygoprodeck {
    private const val CARD_INFO = "https://db.ygoprodeck.com/api/v7/cardinfo.php"
    private const val USER_AGENT = "grandpa-shop (github.com/vjgarciag96/grandpa-shop)"
    private const val HTTP_OK = 200
    private const val CONNECT_TIMEOUT_SECONDS = 10L
    private const val DOWNLOAD_TIMEOUT_MINUTES = 2L
    private val CONNECT_TIMEOUT = Duration.ofSeconds(CONNECT_TIMEOUT_SECONDS)
    private val DOWNLOAD_TIMEOUT = Duration.ofMinutes(DOWNLOAD_TIMEOUT_MINUTES)
    private val client = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build()

    fun cardInfo(): String {
        val request =
            HttpRequest
                .newBuilder(URI.create(CARD_INFO))
                .header("User-Agent", USER_AGENT)
                .header("Accept-Encoding", "gzip")
                .timeout(DOWNLOAD_TIMEOUT)
                .build()
        val response = client.send(request, HttpResponse.BodyHandlers.ofInputStream())
        check(response.statusCode() == HTTP_OK) {
            "YGOPRODeck answered ${response.statusCode()} for the card catalogue"
        }
        val gzipped = response.headers().firstValue("Content-Encoding").orElse("") == "gzip"
        val body = if (gzipped) GZIPInputStream(response.body()) else response.body()
        return body.use { it.readBytes().decodeToString() }
    }
}
