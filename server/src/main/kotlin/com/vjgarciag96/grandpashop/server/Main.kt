package com.vjgarciag96.grandpashop.server

import com.vjgarciag96.grandpashop.server.catalogue.CardCatalogue
import com.vjgarciag96.grandpashop.server.catalogue.CardImages
import com.vjgarciag96.grandpashop.server.catalogue.Ygoprodeck
import com.vjgarciag96.grandpashop.server.price.Cardmarket
import com.vjgarciag96.grandpashop.server.price.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.PriceGuide
import com.vjgarciag96.grandpashop.server.price.PriceGuides
import com.vjgarciag96.grandpashop.server.price.Prices
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import org.slf4j.LoggerFactory
import java.io.IOException
import java.nio.file.Path
import kotlin.io.path.Path

private const val DEFAULT_PORT = 43124

fun main() {
    val environment = System.getenv()
    val host = environment["GRANDPA_SHOP_HOST"] ?: "127.0.0.1"
    val port = environment["GRANDPA_SHOP_PORT"]?.toInt() ?: DEFAULT_PORT
    val cacheDir = Path(environment["GRANDPA_SHOP_CACHE_DIR"] ?: ".cache")

    val catalogue = CardCatalogue.fromYgoprodeckJson(Ygoprodeck.keptCardInfo(cacheDir))

    val images = CardImages(cacheDir.resolve("images"), catalogue, Ygoprodeck::smallImage)

    val prices = Prices(CardmarketProducts.fromResource(), priceGuideOrNone(cacheDir))

    embeddedServer(Netty, host = host, port = port) { apiModule(catalogue, images, prices) }.start(wait = true)
}

/** The kept or downloaded guide, or none when Cardmarket cannot be reached: prices then answer 503, nothing crashes. */
private fun priceGuideOrNone(cacheDir: Path): PriceGuide? =
    try {
        PriceGuides.keep(cacheDir, Cardmarket::priceGuide)
    } catch (e: IOException) {
        LoggerFactory.getLogger("Main").warn("Could not load Cardmarket's price guide; prices are unavailable", e)
        null
    }
