package com.vjgarciag96.grandpashop.server

import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardImageRepository
import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardRepository
import com.vjgarciag96.grandpashop.server.catalogue.domain.usecase.GetCardImage
import com.vjgarciag96.grandpashop.server.catalogue.domain.usecase.GetSetContents
import com.vjgarciag96.grandpashop.server.catalogue.domain.usecase.SearchCards
import com.vjgarciag96.grandpashop.server.catalogue.domain.usecase.SearchSets
import com.vjgarciag96.grandpashop.server.catalogue.endpoint.catalogueRoutes
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
    catalogue: CardRepository,
    images: CardImageRepository,
    prices: Prices,
) {
    install(ContentNegotiation) { json(Json { explicitNulls = false }) }
    routing {
        catalogueRoutes(
            SearchCards(catalogue),
            SearchSets(catalogue),
            GetSetContents(catalogue),
            GetCardImage(catalogue, images),
        )
        priceRoutes(prices)
    }
}
