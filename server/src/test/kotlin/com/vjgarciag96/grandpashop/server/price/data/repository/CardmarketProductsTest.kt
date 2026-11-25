package com.vjgarciag96.grandpashop.server.price.data.repository

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.PrintingKey
import com.vjgarciag96.grandpashop.server.price.data.repository.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.domain.model.CardmarketProductId
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

class CardmarketProductsTest {
    private val relinquished = row("SRL-029", "Ultra Rare", 579386, Resolution.Inferred)
    private val jinzo = row("MIL1-EN008", "Common", 289403, Resolution.Unique)
    private val rareJinzo = row("MIL1-EN008", "Ultra Rare", 289404, Resolution.Unique)
    private val commonRelinquished = row("SRL-029", "Common", 579385, Resolution.Unique)

    @Test
    fun writes_rows_sorted_by_set_code_then_rarity_under_a_header() {
        val table = CardmarketProducts(listOf(relinquished, rareJinzo, commonRelinquished, jinzo))

        val csv = table.toCsv()

        assertEquals(
            "set_code,rarity,product,how\n" +
                "MIL1-EN008,Common,289403,unique\n" +
                "MIL1-EN008,Ultra Rare,289404,unique\n" +
                "SRL-029,Common,579385,unique\n" +
                "SRL-029,Ultra Rare,579386,inferred\n",
            csv,
        )
    }

    @Test
    fun reads_the_rows_it_wrote() {
        val csv = CardmarketProducts(listOf(relinquished, jinzo)).toCsv()

        val table = CardmarketProducts.fromCsv(csv)

        assertEquals(listOf(jinzo, relinquished), table.rows)
    }

    @Test
    fun finds_the_product_of_a_key() {
        val table = CardmarketProducts(listOf(relinquished, jinzo))

        val product = table.productOf(PrintingKey("SRL-029", "Ultra Rare"))

        assertEquals(CardmarketProductId(579386), product)
    }

    @Test
    fun finds_no_product_for_a_key_outside_the_table() {
        val table = CardmarketProducts(listOf(relinquished))

        val product = table.productOf(PrintingKey("SRL-029", "Common"))

        assertNull(product, "a key outside the table has no product")
    }

    @Test
    fun refuses_two_rows_for_one_key() {
        val other = relinquished.copy(product = CardmarketProductId(1))

        assertThrows(IllegalArgumentException::class.java) { CardmarketProducts(listOf(relinquished, other)) }
    }

    @Test
    fun refuses_a_key_that_holds_a_comma() {
        val withComma = row("SRL-029", "Ultra Rare, 1st", 1, Resolution.Unique)

        assertThrows(IllegalArgumentException::class.java) { CardmarketProducts(listOf(withComma)) }
    }

    @Test
    fun refuses_a_key_that_holds_a_tab() {
        val withTab = row("SRL-029", "Ultra\tRare", 1, Resolution.Unique)

        assertThrows(IllegalArgumentException::class.java) { CardmarketProducts(listOf(withTab)) }
    }

    @Test
    fun refuses_a_key_that_holds_a_quote() {
        val withQuote = row("SRL-029", "\"Ultra Rare\"", 1, Resolution.Unique)

        assertThrows(IllegalArgumentException::class.java) { CardmarketProducts(listOf(withQuote)) }
    }

    @Test
    fun refuses_a_key_that_holds_a_line_break() {
        val withLineBreak = row("SRL-029\nMIL1-EN008", "Ultra Rare", 1, Resolution.Unique)

        assertThrows(IllegalArgumentException::class.java) { CardmarketProducts(listOf(withLineBreak)) }
    }

    @Test
    fun refuses_a_table_without_the_header() {
        val csv = "SRL-029,Ultra Rare,579386,inferred\n"

        assertThrows(IllegalArgumentException::class.java) { CardmarketProducts.fromCsv(csv) }
    }

    @Test
    fun refuses_a_line_whose_product_is_not_a_number() {
        val csv = "set_code,rarity,product,how\nSRL-029,Ultra Rare,relinquished,inferred\n"

        val failure = assertThrows(IllegalArgumentException::class.java) { CardmarketProducts.fromCsv(csv) }

        assertEquals("Line 2: 'relinquished' is not a product id", failure.message)
    }

    @Test
    fun refuses_a_line_with_the_wrong_number_of_fields() {
        val csv = "set_code,rarity,product,how\nSRL-029,Ultra Rare,579386\n"

        val failure = assertThrows(IllegalArgumentException::class.java) { CardmarketProducts.fromCsv(csv) }

        assertEquals("Line 2 has 3 fields, not 4", failure.message)
    }

    @Test
    fun refuses_a_line_whose_resolution_is_unknown() {
        val csv = "set_code,rarity,product,how\nSRL-029,Ultra Rare,579386,guessed\n"

        val failure = assertThrows(IllegalArgumentException::class.java) { CardmarketProducts.fromCsv(csv) }

        assertEquals("Line 2: 'guessed' is not a resolution", failure.message)
    }
}
