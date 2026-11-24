package com.vjgarciag96.grandpashop.server.http

import java.io.IOException
import java.io.InputStream
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import java.util.zip.GZIPInputStream

/** The one HTTP client the server downloads reference data with: one User-Agent, gzip, and the same timeouts. */
internal object Downloads {
    private const val USER_AGENT = "grandpa-shop (github.com/vjgarciag96/grandpa-shop)"
    private const val HTTP_OK = 200
    private const val CONNECT_TIMEOUT_SECONDS = 10L
    private const val DOWNLOAD_TIMEOUT_MINUTES = 2L
    private val CONNECT_TIMEOUT = Duration.ofSeconds(CONNECT_TIMEOUT_SECONDS)
    private val DOWNLOAD_TIMEOUT = Duration.ofMinutes(DOWNLOAD_TIMEOUT_MINUTES)
    private val client = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build()

    /** The body of [url] as UTF-8 text. [source] names who answered in the error. */
    fun text(
        url: String,
        source: String,
    ): String = bytes(url, source).decodeToString()

    /** The whole body of [url], gunzipped when the server gzipped it. [source] names who answered in the error. */
    fun bytes(
        url: String,
        source: String,
    ): ByteArray = open(url, source).use { it.readBytes() }

    private fun open(
        url: String,
        source: String,
    ): InputStream {
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
            throw IOException("$source answered ${response.statusCode()} for $url")
        }
        val gzipped = response.headers().firstValue("Content-Encoding").orElse("") == "gzip"
        return if (gzipped) GZIPInputStream(response.body()) else response.body()
    }
}
