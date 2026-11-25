package com.vjgarciag96.grandpashop.server.price.data.repository

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.PrintingKey
import com.vjgarciag96.grandpashop.server.price.data.repository.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.domain.model.CardmarketProductId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/** The committed product table, on the rows whose products are known from Cardmarket itself. */
class CardmarketProductsResourceTest {
    private val table = CardmarketProducts.fromResource()

    @Test
    fun gives_spell_ruler_relinquished_its_cardmarket_product() {
        val product = table.productOf(PrintingKey("SRL-029", "Ultra Rare"))

        assertEquals(CardmarketProductId(579386), product)
    }

    @Test
    fun gives_the_later_set_code_of_spell_ruler_relinquished_the_same_product() {
        val product = table.productOf(PrintingKey("SRL-EN029", "Ultra Rare"))

        assertEquals(CardmarketProductId(579386), product)
    }

    @Test
    fun gives_dark_beginning_jinzo_the_product_of_the_expansion_cardmarket_added_first() {
        val product = table.productOf(PrintingKey("DB1-EN015", "Super Rare"))

        assertEquals(CardmarketProductId(105210), product)
    }

    @Test
    fun gives_millennium_pack_jinzo_its_only_product() {
        val product = table.productOf(PrintingKey("MIL1-EN008", "Common"))

        assertEquals(CardmarketProductId(289403), product)
    }

    @Test
    fun covers_at_least_thirty_five_thousand_printings() {
        val rows = table.rows.size

        assertTrue(rows >= 35_000, "the table holds $rows rows, fewer than 35,000")
    }
}
