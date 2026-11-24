package com.vjgarciag96.grandpashop.server.files

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Path
import kotlin.io.path.readText
import kotlin.io.path.writeText

class CachedFileTest {
    @TempDir
    lateinit var dir: Path

    @Test
    fun downloads_and_keeps_the_text_when_the_file_is_missing() {
        val file = dir.resolve("nested/cardinfo.json")

        val text = cachedText(file) { "downloaded" }

        assertEquals("downloaded" to "downloaded", text to file.readText())
    }

    @Test
    fun reads_the_kept_text_without_downloading_again() {
        val file = dir.resolve("cardinfo.json").also { it.writeText("kept") }
        var downloads = 0

        val text = cachedText(file) { "fresh".also { downloads++ } }

        assertEquals("kept" to 0, text to downloads)
    }
}
