package com.vjgarciag96.grandpashop.server.price.endpoint

import com.vjgarciag96.grandpashop.server.price.data.repository.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.data.repository.PriceGuide
import com.vjgarciag96.grandpashop.server.price.data.repository.Resolution
import com.vjgarciag96.grandpashop.server.price.data.repository.row
import com.vjgarciag96.grandpashop.server.price.domain.model.CardmarketProductId
import com.vjgarciag96.grandpashop.server.price.domain.usecase.GetPrintingPrice
import com.vjgarciag96.grandpashop.server.testApi
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.LocalDate

class PriceRouteTest {
    private val table =
        CardmarketProducts(
            listOf(
                row("SRL-029", "Ultra Rare", 579386, Resolution.Inferred),
                row("DB1-EN015", "Super Rare", 105210, Resolution.Inferred),
            ),
        )
    private val guide = PriceGuide(LocalDate.of(2026, 11, 23), mapOf(CardmarketProductId(579386) to 4006L))

    private fun withPrices(
        guide: PriceGuide? = this.guide,
        block: suspend ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        testApi(prices = GetPrintingPrice(table, guide))
        block()
    }

    @Test
    fun answers_the_trend_in_cents_with_the_guide_day_and_the_product_for_a_mapped_printing() =
        withPrices {
            val response = client.get("/api/printings/price?setCode=SRL-029&rarity=Ultra%20Rare")

            assertEquals(
                HttpStatusCode.OK to
                    Json.parseToJsonElement(
                        """{"cents": 4006, "currency": "EUR", "guideDate": "2026-11-23", "product": 579386}""",
                    ),
                response.status to Json.parseToJsonElement(response.bodyAsText()),
            )
        }

    @Test
    fun answers_not_found_for_a_printing_with_no_row() =
        withPrices {
            val response = client.get("/api/printings/price?setCode=MRL-029&rarity=Ultra%20Rare")

            assertEquals(
                HttpStatusCode.NotFound to "No price for that printing",
                response.status to response.bodyAsText(),
            )
        }

    @Test
    fun answers_not_found_for_a_padded_set_code_since_lookups_are_exact() =
        withPrices {
            val response = client.get("/api/printings/price?setCode=%20SRL-029%20&rarity=Ultra%20Rare")

            assertEquals(
                HttpStatusCode.NotFound to "No price for that printing",
                response.status to response.bodyAsText(),
            )
        }

    @Test
    fun answers_not_found_for_a_printing_whose_product_has_no_trend() =
        withPrices {
            val response = client.get("/api/printings/price?setCode=DB1-EN015&rarity=Super%20Rare")

            assertEquals(
                HttpStatusCode.NotFound to "No price for that printing",
                response.status to response.bodyAsText(),
            )
        }

    @Test
    fun rejects_a_request_without_a_set_code() =
        withPrices {
            val response = client.get("/api/printings/price?rarity=Ultra%20Rare")

            assertEquals(HttpStatusCode.BadRequest to "setCode is required", response.status to response.bodyAsText())
        }

    @Test
    fun rejects_a_blank_set_code() =
        withPrices {
            val response = client.get("/api/printings/price?setCode=%20%20&rarity=Ultra%20Rare")

            assertEquals(HttpStatusCode.BadRequest to "setCode is required", response.status to response.bodyAsText())
        }

    @Test
    fun rejects_a_request_without_a_rarity() =
        withPrices {
            val response = client.get("/api/printings/price?setCode=SRL-029")

            assertEquals(HttpStatusCode.BadRequest to "rarity is required", response.status to response.bodyAsText())
        }

    @Test
    fun rejects_a_blank_rarity() =
        withPrices {
            val response = client.get("/api/printings/price?setCode=SRL-029&rarity=%20%20")

            assertEquals(HttpStatusCode.BadRequest to "rarity is required", response.status to response.bodyAsText())
        }

    @Test
    fun rejects_an_empty_rarity() =
        withPrices {
            val response = client.get("/api/printings/price?setCode=SRL-029&rarity=")

            assertEquals(HttpStatusCode.BadRequest to "rarity is required", response.status to response.bodyAsText())
        }

    @Test
    fun answers_service_unavailable_for_a_mapped_printing_when_no_guide_is_loaded() =
        withPrices(guide = null) {
            val response = client.get("/api/printings/price?setCode=SRL-029&rarity=Ultra%20Rare")

            assertEquals(
                HttpStatusCode.ServiceUnavailable to "The price guide is not available",
                response.status to response.bodyAsText(),
            )
        }

    @Test
    fun answers_not_found_for_a_printing_with_no_row_even_when_no_guide_is_loaded() =
        withPrices(guide = null) {
            val response = client.get("/api/printings/price?setCode=MRL-029&rarity=Ultra%20Rare")

            assertEquals(
                HttpStatusCode.NotFound to "No price for that printing",
                response.status to response.bodyAsText(),
            )
        }
}
