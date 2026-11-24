package com.vjgarciag96.grandpashop.server.catalogue

import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.response.header
import io.ktor.server.response.respond
import io.ktor.server.response.respondBytes
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import kotlinx.serialization.Serializable
import java.io.IOException

private const val MIN_QUERY_LENGTH = 2
private const val DEFAULT_LIMIT = 24
private const val MAX_LIMIT = 50
private val LIMITS = 1..MAX_LIMIT

// A card's printed image never changes, so a browser may keep it for a week.
private const val IMAGE_CACHE_CONTROL = "public, max-age=604800, immutable"

fun Route.catalogueRoutes(
    catalogue: CardCatalogue,
    images: CardImages,
) {
    get("/api/cards") {
        val search = call.searchParameters() ?: return@get
        call.respond(CardsResponse(catalogue.search(search.query, search.limit).map { it.toResponse() }))
    }
    get("/api/sets") {
        val search = call.searchParameters() ?: return@get
        call.respond(SetsResponse(catalogue.searchSets(search.query, search.limit).map { it.toResponse() }))
    }
    get("/api/sets/printings") {
        val name = call.request.queryParameters["name"]
        val found = name?.let(catalogue::setPrintings)
        when {
            name == null -> call.respond(HttpStatusCode.BadRequest, "name is required")
            found == null -> call.respond(HttpStatusCode.NotFound, "No set with that name")
            else -> call.respond(found.toResponse())
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

private class SearchParameters(
    val query: String,
    val limit: Int,
)

/** Reads q and limit, or answers 400 and returns null when either is unusable. */
private suspend fun ApplicationCall.searchParameters(): SearchParameters? {
    val query =
        request.queryParameters["q"]
            .orEmpty()
            .trim()
    val limitParameter = request.queryParameters["limit"]
    val limit = if (limitParameter == null) DEFAULT_LIMIT else limitParameter.toIntOrNull()
    return when {
        query.length < MIN_QUERY_LENGTH -> {
            respond(HttpStatusCode.BadRequest, "q needs at least $MIN_QUERY_LENGTH characters")
            null
        }
        limit == null || limit !in LIMITS -> {
            respond(HttpStatusCode.BadRequest, "limit must be a number from 1 to $MAX_LIMIT")
            null
        }
        else -> SearchParameters(query, limit)
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

@Serializable
private class SetsResponse(
    val sets: List<SetResponse>,
)

@Serializable
private class SetResponse(
    val name: String,
    val prefix: String,
    val printings: Int,
)

@Serializable
private class SetPrintingsResponse(
    val name: String,
    val prefix: String,
    val cards: List<CardResponse>,
    val printings: List<SetPrintingResponse>,
)

@Serializable
private class SetPrintingResponse(
    val setCode: String,
    val rarity: String,
    val passcode: Long,
)

private fun CardSet.toResponse() = SetResponse(name, prefix, printingCount)

private fun SetContents.toResponse() =
    SetPrintingsResponse(
        name = set.name,
        prefix = set.prefix,
        cards = printings.map { it.card }.distinctBy { it.passcode }.map { it.toResponse() },
        printings =
            printings.map {
                SetPrintingResponse(it.printing.setCode, it.printing.rarity, it.card.passcode.value)
            },
    )
