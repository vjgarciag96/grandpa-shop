package com.vjgarciag96.grandpashop.server

import com.vjgarciag96.grandpashop.server.catalogue.CardCatalogue
import com.vjgarciag96.grandpashop.server.catalogue.CardImages
import com.vjgarciag96.grandpashop.server.price.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.Prices
import com.vjgarciag96.grandpashop.server.price.Resolution
import com.vjgarciag96.grandpashop.server.price.row
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.io.IOException
import java.nio.file.Path

/** The API as `main` builds it when keeping the price guide fails at start. */
class StartWithoutGuideTest {
    private val table = CardmarketProducts(listOf(row("SRL-029", "Ultra Rare", 579386, Resolution.Inferred)))

    private fun withGuideThatCannotBeKept(block: suspend ApplicationTestBuilder.() -> Unit) =
        testApplication {
            val fixture = checkNotNull(javaClass.getResource("/cardinfo.json")).readText()
            val catalogue = CardCatalogue.fromYgoprodeckJson(fixture)
            val noImages = CardImages(Path.of("unused"), catalogue) { error("this test never fetches an image") }
            val guide = priceGuideOrNone { throw IOException("Cardmarket's price guide could not be read") }
            application { apiModule(catalogue, noImages, Prices(table, guide)) }
            block()
        }

    @Test
    fun serves_the_catalogue_when_the_price_guide_could_not_be_kept() =
        withGuideThatCannotBeKept {
            val status = client.get("/api/cards?q=relinquished").status

            assertEquals(HttpStatusCode.OK, status)
        }

    @Test
    fun answers_service_unavailable_for_a_mapped_printing_when_the_price_guide_could_not_be_kept() =
        withGuideThatCannotBeKept {
            val response = client.get("/api/printings/price?setCode=SRL-029&rarity=Ultra%20Rare")

            assertEquals(
                HttpStatusCode.ServiceUnavailable to "The price guide is not available",
                response.status to response.bodyAsText(),
            )
        }
}
