package com.vjgarciag96.grandpashop.server

import com.vjgarciag96.grandpashop.server.catalogue.CardCatalogue
import com.vjgarciag96.grandpashop.server.catalogue.CardImages
import com.vjgarciag96.grandpashop.server.catalogue.Ygoprodeck
import com.vjgarciag96.grandpashop.server.catalogue.cachedText
import com.vjgarciag96.grandpashop.server.catalogue.catalogueModule
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import kotlin.io.path.Path

private const val DEFAULT_PORT = 43124

fun main() {
    val environment = System.getenv()
    val host = environment["GRANDPA_SHOP_HOST"] ?: "127.0.0.1"
    val port = environment["GRANDPA_SHOP_PORT"]?.toInt() ?: DEFAULT_PORT
    val cacheDir = Path(environment["GRANDPA_SHOP_CACHE_DIR"] ?: ".cache")

    val catalogueJson = cachedText(cacheDir.resolve("cardinfo.json"), Ygoprodeck::cardInfo)
    val catalogue = CardCatalogue.fromYgoprodeckJson(catalogueJson)

    val images = CardImages(cacheDir.resolve("images"), catalogue, Ygoprodeck::smallImage)

    embeddedServer(Netty, host = host, port = port) { catalogueModule(catalogue, images) }.start(wait = true)
}
