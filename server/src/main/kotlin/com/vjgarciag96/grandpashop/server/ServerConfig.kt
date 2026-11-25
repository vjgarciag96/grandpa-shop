package com.vjgarciag96.grandpashop.server

import java.nio.file.InvalidPathException
import java.nio.file.Path
import kotlin.io.path.Path

internal data class ServerConfig(
    val host: String,
    val port: Int,
    val cacheDir: Path,
) {
    companion object {
        private const val HOST = "GRANDPA_SHOP_HOST"
        private const val PORT = "GRANDPA_SHOP_PORT"
        private const val CACHE_DIR = "GRANDPA_SHOP_CACHE_DIR"
        private const val DEFAULT_PORT = 43124
        private const val MAX_PORT = 65535

        fun fromEnvironment(environment: Map<String, String>): ServerConfig {
            val host = environment[HOST] ?: "127.0.0.1"
            require(host.isNotBlank()) { "$HOST must not be blank" }

            val port =
                environment[PORT]?.let {
                    val value = it.toIntOrNull()
                    require(value != null && value in 0..MAX_PORT) { "$PORT must be an integer from 0 to $MAX_PORT" }
                    value
                } ?: DEFAULT_PORT

            val directory = environment[CACHE_DIR] ?: ".cache"
            require(directory.isNotBlank()) { "$CACHE_DIR must not be blank" }
            val cacheDir =
                try {
                    Path(directory)
                } catch (e: InvalidPathException) {
                    throw IllegalArgumentException("$CACHE_DIR must be a valid path", e)
                }

            return ServerConfig(host, port, cacheDir)
        }
    }
}
