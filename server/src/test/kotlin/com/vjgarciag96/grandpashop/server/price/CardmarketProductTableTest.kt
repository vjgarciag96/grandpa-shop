package com.vjgarciag96.grandpashop.server.price

import com.vjgarciag96.grandpashop.server.catalogue.Card
import com.vjgarciag96.grandpashop.server.catalogue.CardKind
import com.vjgarciag96.grandpashop.server.catalogue.Passcode
import com.vjgarciag96.grandpashop.server.catalogue.Printing
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.time.LocalDate

class CardmarketProductTableTest {
    private val noRows = CardmarketProducts(emptyList())
    private val noTrends = guide()

    @Test
    fun maps_a_printing_to_the_only_product_of_its_name_when_one_expansion_lists_the_set() {
        val cards = listOf(card(1, "Jinzo", Printing("MIL1-EN008", "Millennium Pack", "Common")))
        val products = listOf(product(289403, "Jinzo", expansion = 1700))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(listOf(row("MIL1-EN008", "Common", 289403, Resolution.Unique)), generation.table.rows)
    }

    @Test
    fun gives_two_set_codes_of_one_rarity_the_same_product() {
        val cards =
            listOf(
                card(
                    1,
                    "Relinquished",
                    Printing("SRL-029", "Spell Ruler", "Ultra Rare"),
                    Printing("SRL-EN029", "Spell Ruler", "Ultra Rare"),
                ),
            )
        val products = listOf(product(579386, "Relinquished", expansion = 4416))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(
            listOf(
                row("SRL-029", "Ultra Rare", 579386, Resolution.Unique),
                row("SRL-EN029", "Ultra Rare", 579386, Resolution.Unique),
            ),
            generation.table.rows,
        )
    }

    @Test
    fun takes_the_expansion_cardmarket_added_first_when_several_list_the_set_and_marks_its_rows_inferred() {
        val cards = spellRuler()
        val products =
            spellRulerProducts(expansion = 100, firstId = 700001, added = LocalDate.of(2023, 3, 1)) +
                spellRulerProducts(expansion = 4416, firstId = 579386, added = LocalDate.of(2021, 10, 18))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(row("SRL-029", "Ultra Rare", 579386, Resolution.Inferred), generation.table.rows.first())
    }

    @Test
    fun takes_the_lowest_expansion_id_when_the_tied_expansions_were_added_the_same_day() {
        val cards = spellRuler()
        val products =
            spellRulerProducts(expansion = 4879, firstId = 700001) +
                spellRulerProducts(expansion = 1014, firstId = 105210)

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(CardmarketProductId(105210), generation.table.productOf(PrintingKey("SRL-029", "Ultra Rare")))
    }

    @Test
    fun leaves_a_set_of_fewer_than_three_names_unmatched_when_several_expansions_list_it() {
        val cards = listOf(card(1, "Machine King", Printing("DL4-001", "Duelist League 4", "Super Rare")))
        val products =
            listOf(
                product(245197, "Machine King", expansion = 1251),
                product(104331, "Machine King", expansion = 4449, added = LocalDate.of(2021, 1, 1)),
            )

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(emptyList<ProductRow>() to 1, generation.table.rows to generation.coverage.setsUnmatched)
    }

    @Test
    fun matches_an_expansion_whose_names_nearly_equal_the_set_when_none_equals_it() {
        val cards =
            listOf(
                card(1, "Jinzo", Printing("MIL1-EN008", "Millennium Pack", "Common")),
                card(2, "Relinquished", Printing("MIL1-EN009", "Millennium Pack", "Common")),
                card(3, "Kuriboh", Printing("MIL1-EN010", "Millennium Pack", "Common")),
                card(4, "Sangan", Printing("MIL1-EN011", "Millennium Pack", "Common")),
                card(5, "Raigeki", Printing("MIL1-EN012", "Millennium Pack", "Common")),
                card(6, "Mirror Force", Printing("MIL1-EN013", "Millennium Pack", "Common")),
                card(7, "Dark Hole", Printing("MIL1-EN014", "Millennium Pack", "Common")),
                card(8, "Pot of Greed", Printing("MIL1-EN015", "Millennium Pack", "Common")),
                card(9, "Monster Reborn", Printing("MIL1-EN016", "Millennium Pack", "Common")),
                card(10, "Exodia the Forbidden One", Printing("MIL1-EN017", "Millennium Pack", "Common")),
            )
        val products =
            listOf(
                product(1, "Jinzo", expansion = 1700),
                product(2, "Relinquished", expansion = 1700),
                product(3, "Kuriboh", expansion = 1700),
                product(4, "Sangan", expansion = 1700),
                product(5, "Raigeki", expansion = 1700),
                product(6, "Mirror Force", expansion = 1700),
                product(7, "Dark Hole", expansion = 1700),
                product(8, "Pot of Greed", expansion = 1700),
                product(9, "Monster Reborn", expansion = 1700),
            )

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(1 to 9, generation.coverage.setsMatched to generation.table.rows.size)
    }

    @Test
    fun leaves_a_set_unmatched_when_the_nearest_expansion_shares_fewer_than_nine_names_in_ten() {
        val cards =
            listOf(
                card(1, "Jinzo", Printing("MIL1-EN008", "Millennium Pack", "Common")),
                card(2, "Relinquished", Printing("MIL1-EN009", "Millennium Pack", "Common")),
                card(3, "Kuriboh", Printing("MIL1-EN010", "Millennium Pack", "Common")),
                card(4, "Sangan", Printing("MIL1-EN011", "Millennium Pack", "Common")),
                card(5, "Raigeki", Printing("MIL1-EN012", "Millennium Pack", "Common")),
                card(6, "Mirror Force", Printing("MIL1-EN013", "Millennium Pack", "Common")),
                card(7, "Dark Hole", Printing("MIL1-EN014", "Millennium Pack", "Common")),
                card(8, "Pot of Greed", Printing("MIL1-EN015", "Millennium Pack", "Common")),
                card(9, "Monster Reborn", Printing("MIL1-EN016", "Millennium Pack", "Common")),
                card(10, "Exodia the Forbidden One", Printing("MIL1-EN017", "Millennium Pack", "Common")),
            )
        val products =
            listOf(
                product(1, "Jinzo", expansion = 1700),
                product(2, "Relinquished", expansion = 1700),
                product(3, "Kuriboh", expansion = 1700),
                product(4, "Sangan", expansion = 1700),
                product(5, "Raigeki", expansion = 1700),
                product(6, "Mirror Force", expansion = 1700),
                product(7, "Dark Hole", expansion = 1700),
                product(8, "Pot of Greed", expansion = 1700),
            )

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(1 to 0, generation.coverage.setsUnmatched to generation.table.rows.size)
    }

    @Test
    fun matches_names_that_differ_only_in_quoting_case_and_accents() {
        val printing = Printing("FOTB-EN001", "Force of the Breaker", "Common")
        val cards = listOf(card(1, "\"A\" Cell Breeding Device", printing))
        val products = listOf(product(101788, "\"\"A\"\" CELL Breeding Dévice", expansion = 1011))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(CardmarketProductId(101788), generation.table.productOf(PrintingKey("FOTB-EN001", "Common")))
    }

    @Test
    fun pairs_products_in_trend_order_with_rarities_in_rank_order() {
        val cards =
            listOf(
                card(
                    1,
                    "Jinzo",
                    Printing("PSV-000", "Pharaoh's Servant", "Secret Rare"),
                    Printing("PSV-EN000", "Pharaoh's Servant", "Common"),
                ),
            )
        val products = listOf(product(11, "Jinzo", expansion = 1), product(12, "Jinzo", expansion = 1))
        val guide = guide(11 to 5000, 12 to 50)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(
            listOf(
                row("PSV-000", "Secret Rare", 11, Resolution.Inferred),
                row("PSV-EN000", "Common", 12, Resolution.Inferred),
            ),
            generation.table.rows,
        )
    }

    @Test
    fun pairs_three_rarities_from_the_middle_of_the_rank_list_by_trend() {
        val cards =
            listOf(
                card(
                    1,
                    "Jinzo",
                    Printing("JUSH-EN057", "Justice Hunters", "Ultra Rare"),
                    Printing("JUSH-EN057", "Justice Hunters", "Rare"),
                    Printing("JUSH-EN057", "Justice Hunters", "Super Rare"),
                ),
            )
        val products =
            listOf(
                product(11, "Jinzo", expansion = 1),
                product(12, "Jinzo", expansion = 1),
                product(13, "Jinzo", expansion = 1),
            )
        val guide = guide(11 to 500, 12 to 5, 13 to 50)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(
            listOf(
                row("JUSH-EN057", "Rare", 12, Resolution.Inferred),
                row("JUSH-EN057", "Super Rare", 13, Resolution.Inferred),
                row("JUSH-EN057", "Ultra Rare", 11, Resolution.Inferred),
            ),
            generation.table.rows,
        )
    }

    @Test
    fun gives_no_row_when_two_products_to_pair_share_a_trend() {
        val cards =
            listOf(
                card(
                    1,
                    "Jinzo",
                    Printing("JUSH-EN057", "Justice Hunters", "Rare"),
                    Printing("JUSH-EN057", "Justice Hunters", "Super Rare"),
                ),
            )
        val products = listOf(product(837608, "Jinzo", expansion = 1), product(840049, "Jinzo", expansion = 1))
        val guide = guide(837608 to 18, 840049 to 18)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(emptyList<ProductRow>(), generation.table.rows)
    }

    @Test
    fun ranks_a_rarity_regardless_of_its_case() {
        val cards =
            listOf(
                card(
                    1,
                    "Jinzo",
                    Printing("RA01-EN001", "Rarity Collection", "PLatinum Secret Rare"),
                    Printing("RA01-EN001", "Rarity Collection", "Common"),
                ),
            )
        val products = listOf(product(11, "Jinzo", expansion = 1), product(12, "Jinzo", expansion = 1))
        val guide = guide(11 to 5000, 12 to 50)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        val product = generation.table.productOf(PrintingKey("RA01-EN001", "PLatinum Secret Rare"))
        assertEquals(CardmarketProductId(11), product)
    }

    @Test
    fun gives_no_row_when_one_product_has_several_rarities() {
        val cards =
            listOf(
                card(
                    1,
                    "Jinzo",
                    Printing("PSV-000", "Pharaoh's Servant", "Secret Rare"),
                    Printing("PSV-000", "Pharaoh's Servant", "Ultra Rare"),
                ),
            )
        val products = listOf(product(11, "Jinzo", expansion = 1))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(emptyList<ProductRow>(), generation.table.rows)
    }

    @Test
    fun gives_no_row_when_a_card_has_more_rarities_than_products() {
        val cards =
            listOf(
                card(
                    1,
                    "Jinzo",
                    Printing("PSV-000", "Pharaoh's Servant", "Secret Rare"),
                    Printing("PSV-000", "Pharaoh's Servant", "Ultra Rare"),
                    Printing("PSV-000", "Pharaoh's Servant", "Common"),
                ),
            )
        val products = listOf(product(11, "Jinzo", expansion = 1), product(12, "Jinzo", expansion = 1))
        val guide = guide(11 to 5000, 12 to 50)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(emptyList<ProductRow>(), generation.table.rows)
    }

    @Test
    fun gives_no_row_when_a_rarity_to_pair_has_no_rank() {
        val cards =
            listOf(
                card(
                    1,
                    "Jinzo",
                    Printing("PSV-000", "Pharaoh's Servant", "New"),
                    Printing("PSV-EN000", "Pharaoh's Servant", "Common"),
                ),
            )
        val products = listOf(product(11, "Jinzo", expansion = 1), product(12, "Jinzo", expansion = 1))
        val guide = guide(11 to 5000, 12 to 50)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(emptyList<ProductRow>(), generation.table.rows)
    }

    @Test
    fun gives_no_row_when_a_product_to_pair_has_no_trend() {
        val cards =
            listOf(
                card(
                    1,
                    "Jinzo",
                    Printing("PSV-000", "Pharaoh's Servant", "Secret Rare"),
                    Printing("PSV-EN000", "Pharaoh's Servant", "Common"),
                ),
            )
        val products = listOf(product(11, "Jinzo", expansion = 1), product(12, "Jinzo", expansion = 1))
        val guide = guide(11 to 5000)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(emptyList<ProductRow>(), generation.table.rows)
    }

    @Test
    fun gives_no_row_when_two_cards_reach_one_key_with_different_products() {
        val cards =
            listOf(
                card(1, "Jinzo", Printing("LOB-001", "Legend of Blue Eyes", "Common")),
                card(2, "Kuriboh", Printing("LOB-001", "Legend of Blue Eyes", "Common")),
            )
        val products = listOf(product(11, "Jinzo", expansion = 1), product(12, "Kuriboh", expansion = 1))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(emptyList<ProductRow>() to 1, generation.table.rows to generation.coverage.excluded)
    }

    @Test
    fun keeps_an_existing_row_over_what_it_would_decide_now() {
        val cards = listOf(card(1, "Jinzo", Printing("MIL1-EN008", "Millennium Pack", "Common")))
        val products = listOf(product(289403, "Jinzo", expansion = 1700), product(999, "Other", expansion = 2))
        val existing = CardmarketProducts(listOf(row("MIL1-EN008", "Common", 999, Resolution.Unique)))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, existing)

        assertEquals(listOf(row("MIL1-EN008", "Common", 999, Resolution.Unique)), generation.table.rows)
    }

    @Test
    fun stops_when_an_existing_row_names_a_product_cardmarket_does_not_list() {
        val products = listOf(product(289403, "Jinzo", expansion = 1700))
        val existing = CardmarketProducts(listOf(row("MIL1-EN008", "Common", 1, Resolution.Unique)))

        assertThrows(IllegalArgumentException::class.java) {
            CardmarketProductTable.generate(emptyList(), products, noTrends, existing)
        }
    }

    @Test
    fun stops_when_a_set_code_holds_a_comma() {
        val cards = listOf(card(1, "Jinzo", Printing("MIL1,EN008", "Millennium Pack", "Common")))
        val products = listOf(product(289403, "Jinzo", expansion = 1700))

        assertThrows(IllegalArgumentException::class.java) {
            CardmarketProductTable.generate(cards, products, noTrends, noRows)
        }
    }

    @Test
    fun counts_sets_and_printings_by_how_they_were_settled() {
        val cards =
            listOf(
                card(1, "Jinzo", Printing("MIL1-EN008", "Millennium Pack", "Common")),
                card(3, "Kuriboh", Printing("SD1-EN001", "Starter Deck", "Common")),
            ) + spellRuler()
        val products =
            listOf(product(289403, "Jinzo", expansion = 1700)) +
                spellRulerProducts(expansion = 5341, firstId = 700001, added = LocalDate.of(2023, 3, 1)) +
                spellRulerProducts(expansion = 4416, firstId = 579386, added = LocalDate.of(2021, 10, 18))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(
            Coverage(
                sets = 3,
                setsMatched = 2,
                setsTied = 1,
                setsUnmatched = 1,
                printings = 5,
                unique = 1,
                inferred = 3,
                excluded = 0,
                unmapped = 1,
            ),
            generation.coverage,
        )
    }

    /** Three Spell Ruler cards, one printing each, enough names for a tied set to join. */
    private fun spellRuler() =
        listOf(
            card(1, "Relinquished", Printing("SRL-029", "Spell Ruler", "Ultra Rare")),
            card(2, "Toon World", Printing("SRL-073", "Spell Ruler", "Super Rare")),
            card(3, "Megamorph", Printing("SRL-079", "Spell Ruler", "Super Rare")),
        )

    private fun spellRulerProducts(
        expansion: Long,
        firstId: Long,
        added: LocalDate = LocalDate.of(2007, 1, 1),
    ) = listOf(
        product(firstId, "Relinquished", expansion, added),
        product(firstId + 1, "Toon World", expansion, added),
        product(firstId + 2, "Megamorph", expansion, added),
    )

    private fun card(
        passcode: Long,
        name: String,
        vararg printings: Printing,
    ) = Card(Passcode(passcode), name, CardKind.Monster, "Effect Monster", "", null, printings.toList())

    private fun product(
        id: Long,
        name: String,
        expansion: Long,
        added: LocalDate = LocalDate.of(2007, 1, 1),
    ) = CardmarketProduct(CardmarketProductId(id), name, expansion, added.atStartOfDay())

    private fun guide(vararg trends: Pair<Int, Int>) =
        PriceGuide(
            LocalDate.of(2026, 11, 23),
            trends.associate { (product, cents) -> CardmarketProductId(product.toLong()) to cents.toLong() },
        )
}
