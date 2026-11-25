package com.vjgarciag96.grandpashop.server.core

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
    writeAtomically(file, bytes)
    return bytes
}

/** Keeps [bytes] in [file], creating its directory; a crash mid-write never leaves a half file to be read later. */
fun writeAtomically(
    file: Path,
    bytes: ByteArray,
) {
    file.parent.createDirectories()
    // Written beside the target and moved, since a move within one directory is atomic.
    val partial = Files.createTempFile(file.parent, file.fileName.toString(), ".partial")
    partial.writeBytes(bytes)
    Files.move(partial, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
}
