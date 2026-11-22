package com.vjgarciag96.grandpashop.server.catalogue

import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import kotlin.io.path.createDirectories
import kotlin.io.path.exists
import kotlin.io.path.readBytes
import kotlin.io.path.writeBytes

/** Returns the text kept in [file], or downloads it and keeps it there for the next start. */
fun cachedText(
    file: Path,
    download: () -> String,
): String = cachedBytes(file) { download().encodeToByteArray() }.decodeToString()

/** Returns the bytes kept in [file], or downloads them and keeps them there for the next request. */
fun cachedBytes(
    file: Path,
    download: () -> ByteArray,
): ByteArray {
    if (file.exists()) return file.readBytes()
    val bytes = download()
    file.parent.createDirectories()
    // Written beside the target and moved, so a crash mid-write never leaves a half file to be read later.
    val partial = Files.createTempFile(file.parent, file.fileName.toString(), ".partial")
    partial.writeBytes(bytes)
    Files.move(partial, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
    return bytes
}
