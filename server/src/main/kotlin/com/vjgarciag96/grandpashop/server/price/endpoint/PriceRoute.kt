package com.vjgarciag96.grandpashop.server.price.endpoint

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.PrintingKey
import com.vjgarciag96.grandpashop.server.price.domain.model.PriceLookup
import com.vjgarciag96.grandpashop.server.price.domain.usecase.GetPrintingPrice
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get

internal fun Route.priceRoutes(getPrintingPrice: GetPrintingPrice) {
    get("/api/printings/price") {
        val setCode = call.request.queryParameters["setCode"]
        val rarity = call.request.queryParameters["rarity"]
        when {
            setCode.isNullOrBlank() -> call.respond(HttpStatusCode.BadRequest, "setCode is required")
            rarity.isNullOrBlank() -> call.respond(HttpStatusCode.BadRequest, "rarity is required")
            else ->
                when (val lookup = getPrintingPrice(PrintingKey(setCode, rarity))) {
                    is PriceLookup.Found -> call.respond(lookup.toResponse())
                    PriceLookup.NoProduct, PriceLookup.NoTrend ->
                        call.respond(HttpStatusCode.NotFound, "No price for that printing")
                    PriceLookup.NoGuide ->
                        call.respond(HttpStatusCode.ServiceUnavailable, "The price guide is not available")
                }
        }
    }
}
