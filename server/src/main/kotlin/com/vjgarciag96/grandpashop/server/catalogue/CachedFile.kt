package com.vjgarciag96.grandpashop.server.catalogue

import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import kotlin.io.path.createDirectories
import kotlin.io.path.exists
import kotlin.io.path.readText
import kotlin.io.path.writeText

/** Returns the text kept in [file], or downloads it and keeps it there for the next start. */
fun cachedText(
    file: Path,
    download: () -> String,
): String {
    if (file.exists()) return file.readText()
    val text = download()
    file.parent.createDirectories()
    // Written beside the target and moved, so a crash mid-write never leaves a half file to be read later.
    val partial = Files.createTempFile(file.parent, file.fileName.toString(), ".partial")
    partial.writeText(text)
    Files.move(partial, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
    return text
}
