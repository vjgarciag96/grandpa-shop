package com.vjgarciag96.grandpashop.server.price

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** A product as Cardmarket lists it: its name, the expansion it sits in, and when Cardmarket added it. */
data class CardmarketProduct(
    val id: CardmarketProductId,
    val name: String,
    val expansion: Long,
    val dateAdded: String,
)

/** Reads Cardmarket's `products_singles_3.json`. */
object CardmarketProductList {
    private val json = Json { ignoreUnknownKeys = true }

    fun parse(text: String): List<CardmarketProduct> =
        json.decodeFromString<Source>(text).products.map {
            CardmarketProduct(CardmarketProductId(it.idProduct), it.name, it.idExpansion, it.dateAdded)
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
