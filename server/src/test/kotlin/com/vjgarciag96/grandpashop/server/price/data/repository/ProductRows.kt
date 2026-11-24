package com.vjgarciag96.grandpashop.server.price.data.repository

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.PrintingKey
import com.vjgarciag96.grandpashop.server.price.domain.model.CardmarketProductId

/** A table row from plain values, for fixtures and expected rows alike. */
fun row(
    setCode: String,
    rarity: String,
    product: Long,
    how: Resolution,
) = ProductRow(PrintingKey(setCode, rarity), CardmarketProductId(product), how)
