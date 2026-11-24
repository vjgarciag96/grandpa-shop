package com.vjgarciag96.grandpashop.server

import com.vjgarciag96.grandpashop.server.price.data.repository.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.data.repository.Resolution
import com.vjgarciag96.grandpashop.server.price.data.repository.row
import com.vjgarciag96.grandpashop.server.price.domain.usecase.GetPrintingPrice
import io.ktor.client.request.get
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.io.IOException

/** The API as `main` builds it when keeping the price guide fails at start. */
class StartWithoutGuideTest {
    private val table = CardmarketProducts(listOf(row("SRL-029", "Ultra Rare", 579386, Resolution.Inferred)))

    private fun withGuideThatCannotBeKept(block: suspend ApplicationTestBuilder.() -> Unit) =
        testApplication {
            val guide = priceGuideOrNone { throw IOException("Cardmarket's price guide could not be read") }
            testApi(prices = GetPrintingPrice(table, guide))
            block()
        }

    @Test
    fun serves_the_catalogue_when_the_price_guide_could_not_be_kept() =
        withGuideThatCannotBeKept {
            val status = client.get("/api/cards?q=relinquished").status

            assertEquals(HttpStatusCode.OK, status)
        }

    @Test
    fun lets_a_failure_other_than_a_read_failure_stop_the_start() {
        val failure = IllegalStateException("the keeper is broken")

        val thrown = assertThrows(IllegalStateException::class.java) { priceGuideOrNone { throw failure } }

        assertSame(failure, thrown, "only a read failure leaves the server without a guide")
    }

    @Test
    fun answers_service_unavailable_for_a_mapped_printing_when_the_price_guide_could_not_be_kept() =
        withGuideThatCannotBeKept {
            val response = client.get("/api/printings/price?setCode=SRL-029&rarity=Ultra%20Rare")

            assertEquals(
                HttpStatusCode.ServiceUnavailable to "The price guide is not available",
                response.status to response.errorMessage(),
            )
        }
}
