package com.vjgarciag96.grandpashop.server.price

import com.vjgarciag96.grandpashop.server.files.writeAtomically
import kotlinx.serialization.SerializationException
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.time.format.DateTimeParseException
import kotlin.io.path.listDirectoryEntries
import kotlin.io.path.name
import kotlin.io.path.readText

/** Keeps price guides beside the catalogue, one file per guide day: `price-guide-2026-11-23.json`. */
object PriceGuides {
    private const val PREFIX = "price-guide-"
    private const val SUFFIX = ".json"
    private val keptName = Regex("""price-guide-\d{4}-\d{2}-\d{2}\.json""")

    /**
     * The newest kept guide by name, or else one download kept under the day Cardmarket made it.
     * A kept file that does not hold a guide is passed over for the download.
     * Throws [IOException], and nothing else, when the download fails or does not hold a guide; nothing is kept then.
     */
    fun keep(
        cacheDir: Path,
        download: () -> String,
    ): PriceGuide {
        val newest = keptGuides(cacheDir).maxByOrNull { it.name }
        val kept =
            newest?.let { file ->
                try {
                    read(file.readText())
                } catch (ignored: IOException) {
                    null
                }
            }
        if (kept != null) return kept
        val text = download()
        val guide = read(text)
        writeAtomically(cacheDir.resolve("$PREFIX${guide.createdOn}$SUFFIX"), text.encodeToByteArray())
        return guide
    }

    private fun keptGuides(cacheDir: Path): List<Path> =
        if (Files.isDirectory(cacheDir)) {
            cacheDir.listDirectoryEntries().filter { keptName.matches(it.name) }
        } else {
            emptyList()
        }

    private fun read(text: String): PriceGuide =
        try {
            PriceGuide.parse(text)
        } catch (e: SerializationException) {
            throw IOException("Cardmarket's price guide could not be read", e)
        } catch (e: DateTimeParseException) {
            throw IOException("Cardmarket's price guide is not dated by day", e)
        } catch (e: ArithmeticException) {
            throw IOException("Cardmarket's price guide holds a trend too large for cents", e)
        }
}
