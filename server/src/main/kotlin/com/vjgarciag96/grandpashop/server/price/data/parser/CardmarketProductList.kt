package com.vjgarciag96.grandpashop.server.price.data.parser

import com.vjgarciag96.grandpashop.server.price.domain.model.CardmarketProductId
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/** A product as Cardmarket lists it: its name, the expansion it sits in, and when Cardmarket added it. */
data class CardmarketProduct(
    val id: CardmarketProductId,
    val name: String,
    val expansion: Long,
    val dateAdded: LocalDateTime,
)

/** Reads Cardmarket's `products_singles_3.json`. */
object CardmarketProductList {
    private val json = Json { ignoreUnknownKeys = true }
    private val dateAdded = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")

    fun parse(text: String): List<CardmarketProduct> =
        json.decodeFromString<Source>(text).products.map {
            val added = LocalDateTime.parse(it.dateAdded, dateAdded)
            CardmarketProduct(CardmarketProductId(it.idProduct), it.name, it.idExpansion, added)
        }

    @Serializable
    private class Source(
        val products: List<SourceProduct>,
    )

    @Serializable
    private class SourceProduct(
        val idProduct: Long,
        val name: String,
        val idExpansion: Long,
        val dateAdded: String,
    )
}
