package com.vjgarciag96.grandpashop.server.price

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.time.LocalDate
import kotlin.io.path.listDirectoryEntries
import kotlin.io.path.name
import kotlin.io.path.readText
import kotlin.io.path.writeText

class PriceGuidesTest {
    @TempDir
    lateinit var dir: Path

    private fun guideJson(createdAt: String): String {
        val rows = """[{"idProduct":1,"trend":1.5}]"""
        return """{"createdAt":"${createdAt}T02:46:00+0100","priceGuides":$rows}"""
    }

    @Test
    fun keeps_the_downloaded_guide_under_the_day_cardmarket_made_it() {
        val cacheDir = dir.resolve("cache")

        PriceGuides.keep(cacheDir) { guideJson("2026-11-23") }

        val kept = cacheDir.listDirectoryEntries().map { it.name }
        assertEquals(listOf("price-guide-2026-11-23.json"), kept)
    }

    @Test
    fun keeps_the_guide_text_as_downloaded() {
        val cacheDir = dir.resolve("cache")

        PriceGuides.keep(cacheDir) { guideJson("2026-11-23") }

        assertEquals(guideJson("2026-11-23"), cacheDir.resolve("price-guide-2026-11-23.json").readText())
    }

    @Test
    fun loads_the_newest_kept_guide_without_downloading() {
        dir.resolve("price-guide-2026-11-22.json").writeText(guideJson("2026-11-22"))
        dir.resolve("price-guide-2026-11-23.json").writeText(guideJson("2026-11-23"))
        var downloads = 0

        val guide = PriceGuides.keep(dir) { guideJson("2026-11-24").also { downloads++ } }

        assertEquals(LocalDate.of(2026, 11, 23) to 0, guide.createdOn to downloads)
    }

    @Test
    fun surfaces_a_failed_download_as_an_io_exception_and_keeps_nothing() {
        val cacheDir = dir.resolve("cache")

        val failure =
            assertThrows(IOException::class.java) {
                PriceGuides.keep(cacheDir) { throw IOException("unreachable") }
            }

        assertEquals("unreachable" to false, failure.message to Files.exists(cacheDir))
    }

    @Test
    fun surfaces_a_download_that_is_not_a_guide_as_an_io_exception() {
        val cacheDir = dir.resolve("cache")

        assertThrows(IOException::class.java) { PriceGuides.keep(cacheDir) { "<html>maintenance</html>" } }
    }
}
