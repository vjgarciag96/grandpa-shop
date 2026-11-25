package com.vjgarciag96.grandpashop.server

import com.vjgarciag96.grandpashop.server.catalogue.data.repository.InMemoryCardRepository
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Passcode
import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardImageRepository
import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardRepository
import com.vjgarciag96.grandpashop.server.price.data.repository.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.domain.usecase.GetPrintingPrice
import io.ktor.server.testing.ApplicationTestBuilder

/** The catalogue in the `cardinfo.json` fixture. */
fun fixtureCatalogue(): InMemoryCardRepository {
    val fixture = checkNotNull(InMemoryCardRepository::class.java.getResource("/cardinfo.json"))
    return InMemoryCardRepository.fromYgoprodeckJson(fixture.readText())
}

/** Images no route under test fetches. */
private val noImages =
    object : CardImageRepository {
        override suspend fun image(passcode: Passcode): ByteArray = error("this test never fetches an image")
    }

/** GetPrintingPrice with no table rows and no guide, for routes that never ask for one. */
val noPrices: GetPrintingPrice = GetPrintingPrice(CardmarketProducts(emptyList()), guide = null)

/** The whole API as [apiModule] wires it, with nothing behind the areas a test does not exercise. */
fun ApplicationTestBuilder.testApi(
    catalogue: CardRepository = fixtureCatalogue(),
    images: CardImageRepository = noImages,
    prices: GetPrintingPrice = noPrices,
) = application { apiModule(catalogue, images, prices) }
