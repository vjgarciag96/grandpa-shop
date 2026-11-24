package com.vjgarciag96.grandpashop.server.catalogue.endpoint

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Passcode
import com.vjgarciag96.grandpashop.server.catalogue.domain.usecase.GetCardImage
import com.vjgarciag96.grandpashop.server.catalogue.domain.usecase.GetSetContents
import com.vjgarciag96.grandpashop.server.catalogue.domain.usecase.SearchCards
import com.vjgarciag96.grandpashop.server.catalogue.domain.usecase.SearchSets
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.response.header
import io.ktor.server.response.respond
import io.ktor.server.response.respondBytes
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import java.io.IOException

private const val MIN_QUERY_LENGTH = 2
private const val DEFAULT_LIMIT = 24
private const val MAX_LIMIT = 50
private val LIMITS = 1..MAX_LIMIT

// A card's printed image never changes, so a browser may keep it for a week.
private const val IMAGE_CACHE_CONTROL = "public, max-age=604800, immutable"

internal fun Route.catalogueRoutes(
    searchCards: SearchCards,
    searchSets: SearchSets,
    getSetContents: GetSetContents,
    getCardImage: GetCardImage,
) {
    get("/api/cards") {
        val search = call.searchParameters() ?: return@get
        call.respond(CardsResponse(searchCards(search.query, search.limit).map { it.toResponse() }))
    }
    get("/api/sets") {
        val search = call.searchParameters() ?: return@get
        call.respond(SetsResponse(searchSets(search.query, search.limit).map { it.toResponse() }))
    }
    get("/api/sets/printings") {
        val name = call.request.queryParameters["name"]
        val found = name?.let { getSetContents(it) }
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
                passcode?.let { getCardImage(it) }
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
