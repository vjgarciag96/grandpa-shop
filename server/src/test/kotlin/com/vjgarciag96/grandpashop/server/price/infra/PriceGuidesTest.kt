package com.vjgarciag96.grandpashop.server.price.infra

import com.vjgarciag96.grandpashop.server.price.infra.PriceGuides
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

    /** A guide whose one trend, in cents, is past what a Long holds. */
    private fun tooLargeGuideJson(createdAt: String): String {
        val rows = """[{"idProduct":1,"trend":1e17}]"""
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
    fun ignores_kept_files_that_are_not_a_guide_of_one_day() {
        dir.resolve("price-guide-2026-11-23.json").writeText(guideJson("2026-11-23"))
        dir.resolve("price-guide-latest.json").writeText(guideJson("2020-01-01"))
        dir.resolve("price-guide-2026-11-24.json1234.partial").writeText(guideJson("2026-11-24"))
        dir.resolve("cardinfo.json").writeText("{}")

        val guide = PriceGuides.keep(dir) { guideJson("2026-11-25") }

        assertEquals(LocalDate.of(2026, 11, 23), guide.createdOn)
    }

    @Test
    fun downloads_when_the_newest_kept_guide_cannot_be_read() {
        dir.resolve("price-guide-2026-11-23.json").writeText("")

        val guide = PriceGuides.keep(dir) { guideJson("2026-11-24") }

        assertEquals(LocalDate.of(2026, 11, 24), guide.createdOn)
    }

    @Test
    fun downloads_when_the_newest_kept_guide_holds_a_trend_too_large_for_cents() {
        dir.resolve("price-guide-2026-11-23.json").writeText(tooLargeGuideJson("2026-11-23"))

        val guide = PriceGuides.keep(dir) { guideJson("2026-11-24") }

        assertEquals(LocalDate.of(2026, 11, 24), guide.createdOn)
    }

    @Test
    fun surfaces_a_download_with_a_trend_too_large_for_cents_as_an_io_exception() {
        val cacheDir = dir.resolve("cache")

        val failure =
            assertThrows(IOException::class.java) {
                PriceGuides.keep(cacheDir) { tooLargeGuideJson("2026-11-24") }
            }

        assertEquals("Cardmarket's price guide holds a trend too large for cents", failure.message)
    }

    @Test
    fun surfaces_an_unreadable_kept_guide_and_a_failed_download_as_an_io_exception() {
        dir.resolve("price-guide-2026-11-23.json").writeText("")

        assertThrows(IOException::class.java) { PriceGuides.keep(dir) { throw IOException("unreachable") } }
    }

    @Test
    fun surfaces_a_download_not_dated_by_day_as_an_io_exception() {
        val cacheDir = dir.resolve("cache")

        assertThrows(IOException::class.java) {
            PriceGuides.keep(cacheDir) { """{"createdAt":"23/11/2026 02:46","priceGuides":[]}""" }
        }
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
