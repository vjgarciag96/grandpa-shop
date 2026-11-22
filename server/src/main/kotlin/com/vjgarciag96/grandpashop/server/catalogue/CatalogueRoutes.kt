package com.vjgarciag96.grandpashop.server.catalogue

import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.response.header
import io.ktor.server.response.respond
import io.ktor.server.response.respondBytes
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.IOException

private const val MIN_QUERY_LENGTH = 2
private const val DEFAULT_LIMIT = 24
private const val MAX_LIMIT = 50
private val LIMITS = 1..MAX_LIMIT

// A card's printed image never changes, so a browser may keep it for a week.
private const val IMAGE_CACHE_CONTROL = "public, max-age=604800, immutable"

fun Application.catalogueModule(
    catalogue: CardCatalogue,
    images: CardImages,
) {
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
        get("/api/cards/{passcode}/image") {
            val passcode = call.parameters["passcode"]?.toLongOrNull()?.let(::Passcode)
            val image =
                try {
                    passcode?.let(images::image)
                } catch (e: IOException) {
                    call.application.environment.log
                        .warn("Could not fetch the image of card ${passcode?.value}", e)
                    call.respond(HttpStatusCode.BadGateway, "The card image source did not answer")
                    return@get
                }
            if (image == null) {
                call.respond(HttpStatusCode.NotFound, "No card with that passcode")
            } else {
                call.response.header(HttpHeaders.CacheControl, IMAGE_CACHE_CONTROL)
                call.respondBytes(image, ContentType.Image.JPEG)
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
