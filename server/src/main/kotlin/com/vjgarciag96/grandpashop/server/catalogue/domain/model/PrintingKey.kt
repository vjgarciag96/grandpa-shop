package com.vjgarciag96.grandpashop.server.catalogue.domain.model

/** How a client and the product table name a printing: set code and rarity exactly as the catalogue serves them. */
data class PrintingKey(
    val setCode: String,
    val rarity: String,
)
