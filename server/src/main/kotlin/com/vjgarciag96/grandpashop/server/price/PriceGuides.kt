package com.vjgarciag96.grandpashop.server.price

import kotlinx.serialization.SerializationException
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import kotlin.io.path.createDirectories
import kotlin.io.path.listDirectoryEntries
import kotlin.io.path.name
import kotlin.io.path.readText
import kotlin.io.path.writeText

/** Keeps price guides beside the catalogue, one file per guide day: `price-guide-2026-11-23.json`. */
object PriceGuides {
    private const val PREFIX = "price-guide-"
    private const val SUFFIX = ".json"

    /**
     * The newest kept guide by name, or else one download kept under the day Cardmarket made it.
     * Throws [IOException] when the download fails or does not hold a guide; nothing is kept then.
     */
    fun keep(
        cacheDir: Path,
        download: () -> String,
    ): PriceGuide {
        val newest = keptGuides(cacheDir).maxByOrNull { it.name }
        if (newest != null) return PriceGuide.parse(newest.readText())
        val text = download()
        val guide =
            try {
                PriceGuide.parse(text)
            } catch (e: SerializationException) {
                throw IOException("Cardmarket's price guide could not be read", e)
            }
        write(cacheDir.resolve("$PREFIX${guide.createdOn}$SUFFIX"), text)
        return guide
    }

    private fun keptGuides(cacheDir: Path): List<Path> =
        if (Files.isDirectory(cacheDir)) {
            cacheDir.listDirectoryEntries("$PREFIX*$SUFFIX")
        } else {
            emptyList()
        }

    // Written beside the target and moved, like the catalogue, so a crash mid-write never leaves a half guide.
    private fun write(
        file: Path,
        text: String,
    ) {
        file.parent.createDirectories()
        val partial = Files.createTempFile(file.parent, file.name, ".partial")
        partial.writeText(text)
        Files.move(partial, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
    }
}
