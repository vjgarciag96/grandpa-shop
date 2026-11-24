package com.vjgarciag96.grandpashop.server

import com.vjgarciag96.grandpashop.server.catalogue.CardCatalogue
import com.vjgarciag96.grandpashop.server.catalogue.CardImages
import com.vjgarciag96.grandpashop.server.catalogue.catalogueRoutes
import com.vjgarciag96.grandpashop.server.price.Prices
import com.vjgarciag96.grandpashop.server.price.priceRoutes
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.routing.routing
import kotlinx.serialization.json.Json

/** The whole HTTP API. Content negotiation is installed once here, and each area adds its routes. */
fun Application.apiModule(
    catalogue: CardCatalogue,
    images: CardImages,
    prices: Prices,
) {
    install(ContentNegotiation) { json(Json { explicitNulls = false }) }
    routing {
        catalogueRoutes(catalogue, images)
        priceRoutes(prices)
    }
}
