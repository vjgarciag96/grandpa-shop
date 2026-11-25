package com.vjgarciag96.grandpashop.server

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.io.path.Path

class ServerConfigTest {
    @Test
    fun uses_local_defaults_when_the_environment_is_empty() {
        val config = ServerConfig.fromEnvironment(emptyMap())

        assertEquals(ServerConfig("127.0.0.1", 43124, Path(".cache")), config)
    }

    @Test
    fun accepts_port_zero_to_let_the_os_choose_a_port() {
        val config = ServerConfig.fromEnvironment(mapOf("GRANDPA_SHOP_PORT" to "0"))

        assertEquals(0, config.port)
    }

    @Test
    fun names_the_setting_when_the_port_is_not_a_number() {
        val error =
            assertThrows<IllegalArgumentException> {
                ServerConfig.fromEnvironment(mapOf("GRANDPA_SHOP_PORT" to "http"))
            }

        assertEquals("GRANDPA_SHOP_PORT must be an integer from 0 to 65535", error.message)
    }

    @Test
    fun names_the_setting_when_the_port_is_out_of_range() {
        val error =
            assertThrows<IllegalArgumentException> {
                ServerConfig.fromEnvironment(mapOf("GRANDPA_SHOP_PORT" to "65536"))
            }

        assertEquals("GRANDPA_SHOP_PORT must be an integer from 0 to 65535", error.message)
    }

    @Test
    fun names_the_setting_when_the_host_is_blank() {
        val error =
            assertThrows<IllegalArgumentException> {
                ServerConfig.fromEnvironment(mapOf("GRANDPA_SHOP_HOST" to " "))
            }

        assertEquals("GRANDPA_SHOP_HOST must not be blank", error.message)
    }

    @Test
    fun names_the_setting_when_the_cache_directory_is_blank() {
        val error =
            assertThrows<IllegalArgumentException> {
                ServerConfig.fromEnvironment(mapOf("GRANDPA_SHOP_CACHE_DIR" to ""))
            }

        assertEquals("GRANDPA_SHOP_CACHE_DIR must not be blank", error.message)
    }
}
