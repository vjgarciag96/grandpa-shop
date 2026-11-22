package com.vjgarciag96.grandpashop.server.catalogue

import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

private const val MIN_QUERY_LENGTH = 2
private const val DEFAULT_LIMIT = 24
private const val MAX_LIMIT = 50
private val LIMITS = 1..MAX_LIMIT

fun Application.catalogueModule(catalogue: CardCatalogue) {
    install(ContentNegotiation) { json(Json { explicitNulls = false }) }
    routing {
        get("/api/cards") {
            val query =
                call.request.queryParameters["q"]
                    .orEmpty()
                    .trim()
            val limitParameter = call.request.queryParameters["limit"]
            val limit = if (limitParameter == null) DEFAULT_LIMIT else limitParameter.toIntOrNull()
            when {
                query.length < MIN_QUERY_LENGTH ->
                    call.respond(HttpStatusCode.BadRequest, "q needs at least $MIN_QUERY_LENGTH characters")
                limit == null || limit !in LIMITS ->
                    call.respond(HttpStatusCode.BadRequest, "limit must be a number from 1 to $MAX_LIMIT")
                else ->
                    call.respond(CardsResponse(catalogue.search(query, limit).map { it.toResponse() }))
            }
        }
    }
}

@Serializable
private class CardsResponse(
    val cards: List<CardResponse>,
)

@Serializable
private data class CardResponse(
    val passcode: Long,
    val name: String,
    val kind: String,
    val type: String,
    val text: String,
    val monster: MonsterResponse?,
    val printings: List<PrintingResponse>,
)

@Serializable
private data class MonsterResponse(
    val attribute: String,
    val race: String,
    val level: Int? = null,
    val rank: Int? = null,
    val linkRating: Int? = null,
    val atk: Int?,
    val def: Int?,
)

@Serializable
private class PrintingResponse(
    val setCode: String,
    val setName: String,
    val rarity: String,
)

private fun Card.toResponse() =
    CardResponse(
        passcode = passcode.value,
        name = name,
        kind = kind.name,
        type = type,
        text = text,
        monster = monster?.toResponse(),
        printings = printings.map { PrintingResponse(it.setCode, it.setName, it.rarity) },
    )

private fun MonsterStats.toResponse() =
    MonsterResponse(
        attribute = attribute,
        race = race,
        level = (rating as? MonsterRating.Level)?.value,
        rank = (rating as? MonsterRating.Rank)?.value,
        linkRating = (rating as? MonsterRating.LinkRating)?.value,
        atk = atk,
        def = def,
    )
