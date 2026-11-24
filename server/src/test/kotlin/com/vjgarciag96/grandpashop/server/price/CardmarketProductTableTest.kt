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
        val cards = listOf(card(1, "Relinquished", Printing("SRL-029", "Spell Ruler", "Ultra Rare")))
        val products =
            listOf(
                product(700001, "Relinquished", expansion = 5341, dateAdded = "2023-03-01 00:00:00"),
                product(579386, "Relinquished", expansion = 4416, dateAdded = "2021-10-18 00:00:00"),
            )

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(listOf(row("SRL-029", "Ultra Rare", 579386, Resolution.Inferred)), generation.table.rows)
    }

    @Test
    fun takes_the_lowest_expansion_id_when_the_tied_expansions_were_added_the_same_day() {
        val cards = listOf(card(1, "Jinzo", Printing("DB1-EN015", "Dark Beginning 1", "Super Rare")))
        val products =
            listOf(
                product(700001, "Jinzo", expansion = 4879),
                product(105210, "Jinzo", expansion = 1014),
            )

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(CardmarketProductId(105210), generation.table.productOf(PrintingKey("DB1-EN015", "Super Rare")))
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
                card(2, "Relinquished", Printing("SRL-029", "Spell Ruler", "Ultra Rare")),
                card(3, "Kuriboh", Printing("SD1-EN001", "Starter Deck", "Common")),
            )
        val products =
            listOf(
                product(289403, "Jinzo", expansion = 1700),
                product(700001, "Relinquished", expansion = 5341, dateAdded = "2023-03-01 00:00:00"),
                product(579386, "Relinquished", expansion = 4416, dateAdded = "2021-10-18 00:00:00"),
            )

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(
            Coverage(
                sets = 3,
                setsMatched = 2,
                setsTied = 1,
                setsUnmatched = 1,
                printings = 3,
                unique = 1,
                inferred = 1,
                excluded = 0,
                unmapped = 1,
            ),
            generation.coverage,
        )
    }

    private fun card(
        passcode: Long,
        name: String,
        vararg printings: Printing,
    ) = Card(Passcode(passcode), name, CardKind.Monster, "Effect Monster", "", null, printings.toList())

    private fun product(
        id: Long,
        name: String,
        expansion: Long,
        dateAdded: String = "2007-01-01 00:00:00",
    ) = CardmarketProduct(CardmarketProductId(id), name, expansion, dateAdded)

    private fun guide(vararg trends: Pair<Int, Int>) =
        PriceGuide(
            LocalDate.of(2026, 11, 23),
            trends.associate { (product, cents) -> CardmarketProductId(product.toLong()) to cents.toLong() },
        )

    private fun row(
        setCode: String,
        rarity: String,
        product: Long,
        how: Resolution,
    ) = ProductRow(PrintingKey(setCode, rarity), CardmarketProductId(product), how)
}
