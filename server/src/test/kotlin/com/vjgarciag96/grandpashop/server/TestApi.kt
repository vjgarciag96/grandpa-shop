package com.vjgarciag96.grandpashop.server

import com.vjgarciag96.grandpashop.server.catalogue.CardCatalogue
import com.vjgarciag96.grandpashop.server.catalogue.CardImages
import com.vjgarciag96.grandpashop.server.price.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.Prices
import io.ktor.server.testing.ApplicationTestBuilder
import java.nio.file.Path

/** The catalogue in the `cardinfo.json` fixture. */
fun fixtureCatalogue(): CardCatalogue =
    CardCatalogue.fromYgoprodeckJson(checkNotNull(CardCatalogue::class.java.getResource("/cardinfo.json")).readText())

/** Images no route under test fetches. */
fun noImages(catalogue: CardCatalogue): CardImages =
    CardImages(Path.of("unused"), catalogue) {
        error("this test never fetches an image")
    }

/** Prices with no table rows and no guide, for routes that never ask for one. */
val noPrices: Prices = Prices(CardmarketProducts(emptyList()), guide = null)

/** The whole API as [apiModule] wires it, with nothing behind the areas a test does not exercise. */
fun ApplicationTestBuilder.testApi(
    catalogue: CardCatalogue = fixtureCatalogue(),
    images: CardImages = noImages(catalogue),
    prices: Prices = noPrices,
) = application { apiModule(catalogue, images, prices) }
