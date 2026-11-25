package com.vjgarciag96.grandpashop.server.core.http

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.response.respond
import kotlinx.serialization.Serializable

@Serializable
internal data class ErrorResponse(
    val message: String,
)

internal suspend fun ApplicationCall.respondError(
    status: HttpStatusCode,
    message: String,
) = respond(status, ErrorResponse(message))
