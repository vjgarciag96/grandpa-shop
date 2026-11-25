package com.vjgarciag96.grandpashop.server

import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals

internal suspend fun HttpResponse.errorMessage(): String {
    assertEquals(ContentType.Application.Json, contentType()?.withoutParameters())
    return Json
        .parseToJsonElement(bodyAsText())
        .jsonObject
        .getValue("message")
        .jsonPrimitive.content
}
