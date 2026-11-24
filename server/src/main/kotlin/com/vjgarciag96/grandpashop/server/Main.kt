package com.vjgarciag96.grandpashop.server

import com.vjgarciag96.grandpashop.server.catalogue.data.repository.InMemoryCardRepository
import com.vjgarciag96.grandpashop.server.catalogue.infra.CachedCardImageRepository
import com.vjgarciag96.grandpashop.server.catalogue.infra.YgoprodeckClient
import com.vjgarciag96.grandpashop.server.price.Cardmarket
import com.vjgarciag96.grandpashop.server.price.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.PriceGuide
import com.vjgarciag96.grandpashop.server.price.PriceGuides
import com.vjgarciag96.grandpashop.server.price.Prices
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import org.slf4j.LoggerFactory
import java.io.IOException
import kotlin.io.path.Path

private const val DEFAULT_PORT = 43124

fun main() {
    val environment = System.getenv()
    val host = environment["GRANDPA_SHOP_HOST"] ?: "127.0.0.1"
    val port = environment["GRANDPA_SHOP_PORT"]?.toInt() ?: DEFAULT_PORT
    val cacheDir = Path(environment["GRANDPA_SHOP_CACHE_DIR"] ?: ".cache")

    val catalogue = InMemoryCardRepository.fromYgoprodeckJson(YgoprodeckClient.keptCardInfo(cacheDir))

    val images = CachedCardImageRepository(cacheDir.resolve("images"), YgoprodeckClient::smallImage)

    val guide = priceGuideOrNone { PriceGuides.keep(cacheDir, Cardmarket::priceGuide) }
    val prices = Prices(CardmarketProducts.fromResource(), guide)

    embeddedServer(Netty, host = host, port = port) { apiModule(catalogue, images, prices) }.start(wait = true)
}

/**
 * The guide [keep] gives, or none when it cannot (Cardmarket unreachable, a guide that does not read): mapped
 * printings then answer 503 and the rest of the API serves. [keep] throws [IOException] and nothing else.
 */
internal fun priceGuideOrNone(keep: () -> PriceGuide): PriceGuide? =
    try {
        keep()
    } catch (e: IOException) {
        LoggerFactory.getLogger("Main").warn("Could not load Cardmarket's price guide; prices are unavailable", e)
        null
    }
