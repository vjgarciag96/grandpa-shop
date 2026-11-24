package com.vjgarciag96.grandpashop.server.price

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import kotlinx.serialization.Serializable

fun Route.priceRoutes(prices: Prices) {
    get("/api/printings/price") {
        val setCode = call.request.queryParameters["setCode"]
        val rarity = call.request.queryParameters["rarity"]
        when {
            setCode.isNullOrBlank() -> call.respond(HttpStatusCode.BadRequest, "setCode is required")
            rarity.isNullOrBlank() -> call.respond(HttpStatusCode.BadRequest, "rarity is required")
            else ->
                when (val lookup = prices.of(PrintingKey(setCode, rarity))) {
                    is PriceLookup.Found -> call.respond(lookup.toResponse())
                    PriceLookup.NoProduct, PriceLookup.NoTrend ->
                        call.respond(HttpStatusCode.NotFound, "No price for that printing")
                    PriceLookup.NoGuide ->
                        call.respond(HttpStatusCode.ServiceUnavailable, "The price guide is not available")
                }
        }
    }
}

@Serializable
private class PriceResponse(
    val cents: Long,
    val currency: String,
    val guideDate: String,
    val product: Long,
)

private fun PriceLookup.Found.toResponse() =
    PriceResponse(
        cents = price.cents,
        currency = "EUR",
        guideDate = price.guideDate.toString(),
        product = product.value,
    )
