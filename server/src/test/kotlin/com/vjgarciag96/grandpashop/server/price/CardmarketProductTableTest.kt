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
        val jinzo = card(1, "Jinzo", Printing("MIL1-EN008", "Millennium Pack", "Common"))
        val cards = listOf(jinzo) + fillers("Millennium Pack", "MIL1")
        val products = listOf(product(289403, "Jinzo", expansion = 1700)) + fillerProducts(1700)

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(
            listOf(row("MIL1-EN008", "Common", 289403, Resolution.Unique)) + fillerRows("MIL1", 1700),
            generation.table.rows,
        )
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
            ) + fillers("Spell Ruler", "SRL")
        val products = listOf(product(579386, "Relinquished", expansion = 4416)) + fillerProducts(4416)

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(
            listOf(
                row("SRL-029", "Ultra Rare", 579386, Resolution.Unique),
                row("SRL-EN029", "Ultra Rare", 579386, Resolution.Unique),
            ) + fillerRows("SRL", 4416),
            generation.table.rows,
        )
    }

    @Test
    fun pairs_set_codes_of_one_rarity_with_products_in_the_order_cardmarket_added_them() {
        val cards = listOf(summonedSkull("MRD-003", "MRD-E003", "MRD-EN003")) + fillers("Metal Raiders", "MRD")
        val products =
            listOf(
                product(105790, "Summoned Skull", expansion = 1016, added = LocalDate.of(2021, 10, 19)),
                product(578977, "Summoned Skull", expansion = 1016, added = LocalDate.of(2007, 1, 1)),
                product(579183, "Summoned Skull", expansion = 1016, added = LocalDate.of(2021, 10, 18)),
            ) + fillerProducts(1016)

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(
            listOf(
                row("MRD-003", "Ultra Rare", 578977, Resolution.Inferred),
                row("MRD-E003", "Ultra Rare", 579183, Resolution.Inferred),
                row("MRD-EN003", "Ultra Rare", 105790, Resolution.Inferred),
            ) + fillerRows("MRD", 1016),
            generation.table.rows,
        )
    }

    @Test
    fun pairs_set_codes_with_products_added_the_same_day_by_product_id() {
        val cards = listOf(summonedSkull("MRD-003", "MRD-E003")) + fillers("Metal Raiders", "MRD")
        val products =
            listOf(
                product(578977, "Summoned Skull", expansion = 1016),
                product(105790, "Summoned Skull", expansion = 1016),
            ) + fillerProducts(1016)

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(
            listOf(
                row("MRD-003", "Ultra Rare", 105790, Resolution.Inferred),
                row("MRD-E003", "Ultra Rare", 578977, Resolution.Inferred),
            ) + fillerRows("MRD", 1016),
            generation.table.rows,
        )
    }

    @Test
    fun gives_no_row_when_a_card_has_a_product_per_rarity_and_set_code() {
        val cards =
            listOf(
                card(
                    1,
                    "Summoned Skull",
                    Printing("MRD-003", "Metal Raiders", "Ultra Rare"),
                    Printing("MRD-E003", "Metal Raiders", "Ultra Rare"),
                    Printing("MRD-003", "Metal Raiders", "Common"),
                    Printing("MRD-E003", "Metal Raiders", "Common"),
                ),
            ) + fillers("Metal Raiders", "MRD")
        val products = (11L..14L).map { product(it, "Summoned Skull", expansion = 1016) } + fillerProducts(1016)
        val guide = guide(11 to 5000, 12 to 4000, 13 to 50, 14 to 40)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(fillerRows("MRD", 1016), generation.table.rows)
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
    fun leaves_a_set_of_one_name_unmatched_when_one_expansion_alone_lists_it() {
        val printing = Printing("LDPP-EN001", "Light and Darkness Dragon Promo", "Ultra Rare")
        val cards = listOf(card(1, "Light and Darkness Dragon", printing))
        val products = listOf(product(253171, "Light and Darkness Dragon", expansion = 1353))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(emptyList<ProductRow>() to 1, generation.table.rows to generation.coverage.setsUnmatched)
    }

    @Test
    fun leaves_a_set_of_two_names_unmatched_when_one_expansion_alone_lists_it() {
        val cards =
            listOf(
                card(1, "Relinquished", Printing("SRL-029", "Spell Ruler", "Ultra Rare")),
                card(2, "Toon World", Printing("SRL-073", "Spell Ruler", "Super Rare")),
            )
        val products = listOf(product(579386, "Relinquished", 4416), product(579387, "Toon World", 4416))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(emptyList<ProductRow>() to 1, generation.table.rows to generation.coverage.setsUnmatched)
    }

    @Test
    fun matches_an_expansion_whose_names_nearly_equal_the_set_when_none_equals_it() {
        val cards = millenniumPack(names = 10)
        val products = millenniumProducts(expansion = 1700, names = 9)

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(1 to 9, generation.coverage.setsMatched to generation.table.rows.size)
    }

    @Test
    fun leaves_a_set_unmatched_when_the_nearest_expansion_shares_fewer_than_nine_names_in_ten() {
        val cards = millenniumPack(names = 10)
        val products = millenniumProducts(expansion = 1700, names = 8)

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(1 to 0, generation.coverage.setsUnmatched to generation.table.rows.size)
    }

    @Test
    fun leaves_a_set_unmatched_when_the_nearest_expansion_shares_eight_names_in_nine() {
        val cards = millenniumPack(names = 9)
        val products = millenniumProducts(expansion = 1700, names = 8)

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(1 to 0, generation.coverage.setsUnmatched to generation.table.rows.size)
    }

    @Test
    fun prefers_the_expansion_that_lists_the_set_exactly_over_an_older_near_one() {
        val cards = millenniumPack(names = 10)
        val products =
            millenniumProducts(expansion = 1700, names = 9, added = LocalDate.of(2007, 1, 1)) +
                millenniumProducts(expansion = 1800, names = 10, added = LocalDate.of(2023, 3, 1))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(row("MIL1-EN008", "Common", 180001, Resolution.Unique), generation.table.rows.first())
    }

    @Test
    fun matches_names_that_differ_only_in_quoting_case_and_accents() {
        val printing = Printing("FOTB-EN001", "Force of the Breaker", "Common")
        val cards = listOf(card(1, "\"A\" Cell Breeding Device", printing)) + fillers("Force of the Breaker", "FOTB")
        val products =
            listOf(product(101788, "\"\"A\"\" CELL Breeding Dévice", expansion = 1011)) + fillerProducts(1011)

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
            ) + fillers("Pharaoh's Servant", "PSV")
        val products =
            listOf(product(11, "Jinzo", expansion = 1), product(12, "Jinzo", expansion = 1)) + fillerProducts(1)
        val guide = guide(11 to 5000, 12 to 50)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(
            listOf(
                row("PSV-000", "Secret Rare", 11, Resolution.Inferred),
                row("PSV-EN000", "Common", 12, Resolution.Inferred),
            ) + fillerRows("PSV", 1),
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
            ) + fillers("Justice Hunters", "JUSH")
        val products =
            listOf(
                product(11, "Jinzo", expansion = 1),
                product(12, "Jinzo", expansion = 1),
                product(13, "Jinzo", expansion = 1),
            ) + fillerProducts(1)
        val guide = guide(11 to 500, 12 to 5, 13 to 50)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(
            listOf(
                row("JUSH-EN057", "Rare", 12, Resolution.Inferred),
                row("JUSH-EN057", "Super Rare", 13, Resolution.Inferred),
                row("JUSH-EN057", "Ultra Rare", 11, Resolution.Inferred),
            ) + fillerRows("JUSH", 1),
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
            ) + fillers("Justice Hunters", "JUSH")
        val products =
            listOf(product(837608, "Jinzo", expansion = 1), product(840049, "Jinzo", expansion = 1)) + fillerProducts(1)
        val guide = guide(837608 to 18, 840049 to 18)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(fillerRows("JUSH", 1), generation.table.rows)
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
            ) + fillers("Rarity Collection", "RA01")
        val products =
            listOf(product(11, "Jinzo", expansion = 1), product(12, "Jinzo", expansion = 1)) + fillerProducts(1)
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
            ) + fillers("Pharaoh's Servant", "PSV")
        val products = listOf(product(11, "Jinzo", expansion = 1)) + fillerProducts(1)

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(fillerRows("PSV", 1), generation.table.rows)
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
            ) + fillers("Pharaoh's Servant", "PSV")
        val products =
            listOf(product(11, "Jinzo", expansion = 1), product(12, "Jinzo", expansion = 1)) + fillerProducts(1)
        val guide = guide(11 to 5000, 12 to 50)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(fillerRows("PSV", 1), generation.table.rows)
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
            ) + fillers("Pharaoh's Servant", "PSV")
        val products =
            listOf(product(11, "Jinzo", expansion = 1), product(12, "Jinzo", expansion = 1)) + fillerProducts(1)
        val guide = guide(11 to 5000, 12 to 50)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(fillerRows("PSV", 1), generation.table.rows)
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
            ) + fillers("Pharaoh's Servant", "PSV")
        val products =
            listOf(product(11, "Jinzo", expansion = 1), product(12, "Jinzo", expansion = 1)) + fillerProducts(1)
        val guide = guide(11 to 5000)

        val generation = CardmarketProductTable.generate(cards, products, guide, noRows)

        assertEquals(fillerRows("PSV", 1), generation.table.rows)
    }

    @Test
    fun gives_no_row_when_two_cards_reach_one_key_with_different_products() {
        val cards =
            listOf(
                card(1, "Jinzo", Printing("LOB-001", "Legend of Blue Eyes", "Common")),
                card(2, "Kuriboh", Printing("LOB-001", "Legend of Blue Eyes", "Common")),
            ) + fillers("Legend of Blue Eyes", "LOB")
        val products =
            listOf(product(11, "Jinzo", expansion = 1), product(12, "Kuriboh", expansion = 1)) + fillerProducts(1)

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(fillerRows("LOB", 1) to 1, generation.table.rows to generation.coverage.excluded)
    }

    @Test
    fun keeps_an_existing_row_over_what_it_would_decide_now() {
        val jinzo = card(1, "Jinzo", Printing("MIL1-EN008", "Millennium Pack", "Common"))
        val cards = listOf(jinzo) + fillers("Millennium Pack", "MIL1")
        val products =
            listOf(product(289403, "Jinzo", expansion = 1700), product(999, "Other", expansion = 2)) +
                fillerProducts(1700)
        val existing = CardmarketProducts(listOf(row("MIL1-EN008", "Common", 999, Resolution.Unique)))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, existing)

        assertEquals(
            listOf(row("MIL1-EN008", "Common", 999, Resolution.Unique)) + fillerRows("MIL1", 1700),
            generation.table.rows,
        )
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
        val jinzo = card(1, "Jinzo", Printing("MIL1,EN008", "Millennium Pack", "Common"))
        val cards = listOf(jinzo) + fillers("Millennium Pack", "MIL1")
        val products = listOf(product(289403, "Jinzo", expansion = 1700)) + fillerProducts(1700)

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
            ) + fillers("Millennium Pack", "MIL1") + spellRuler()
        val products =
            listOf(product(289403, "Jinzo", expansion = 1700)) + fillerProducts(1700) +
                spellRulerProducts(expansion = 5341, firstId = 700001, added = LocalDate.of(2023, 3, 1)) +
                spellRulerProducts(expansion = 4416, firstId = 579386, added = LocalDate.of(2021, 10, 18))

        val generation = CardmarketProductTable.generate(cards, products, noTrends, noRows)

        assertEquals(
            Coverage(
                sets = 3,
                setsMatched = 2,
                setsTied = 1,
                setsUnmatched = 1,
                printings = 7,
                unique = 3,
                inferred = 3,
                excluded = 0,
                unmapped = 1,
            ),
            generation.coverage,
        )
    }

    private val millenniumNames =
        listOf(
            "Jinzo",
            "Relinquished",
            "Kuriboh",
            "Sangan",
            "Raigeki",
            "Mirror Force",
            "Dark Hole",
            "Pot of Greed",
            "Monster Reborn",
            "Exodia the Forbidden One",
        )

    /** The first [names] Millennium Pack cards, Commons from MIL1-EN008 on. */
    private fun millenniumPack(names: Int) =
        millenniumNames.take(names).mapIndexed { index, name ->
            card(index + 1L, name, Printing("MIL1-EN%03d".format(index + 8), "Millennium Pack", "Common"))
        }

    /** Products for the first [names] Millennium Pack cards in [expansion], with ids from [expansion]01 on. */
    private fun millenniumProducts(
        expansion: Long,
        names: Int,
        added: LocalDate = LocalDate.of(2007, 1, 1),
    ) = millenniumNames.take(names).mapIndexed { index, name ->
        product(expansion * 100 + index + 1, name, expansion, added)
    }

    /**
     * Sangan and Mystical Elf as Commons of [set], under codes that sort after any real one, so the set has the
     * three names a join needs and the rows under test come first.
     */
    private fun fillers(
        set: String,
        prefix: String,
    ) = listOf(
        card(98, "Sangan", Printing("$prefix-Z01", set, "Common")),
        card(99, "Mystical Elf", Printing("$prefix-Z02", set, "Common")),
    )

    /** The products of [fillers] in [expansion], with ids [expansion]901 and [expansion]902. */
    private fun fillerProducts(
        expansion: Long,
        added: LocalDate = LocalDate.of(2007, 1, 1),
    ) = listOf(
        product(expansion * 1000 + 901, "Sangan", expansion, added),
        product(expansion * 1000 + 902, "Mystical Elf", expansion, added),
    )

    /** The rows [fillers] get from [fillerProducts]. */
    private fun fillerRows(
        prefix: String,
        expansion: Long,
        how: Resolution = Resolution.Unique,
    ) = listOf(
        row("$prefix-Z01", "Common", expansion * 1000 + 901, how),
        row("$prefix-Z02", "Common", expansion * 1000 + 902, how),
    )

    /** Summoned Skull as an Ultra Rare under each of the given Metal Raiders set codes. */
    private fun summonedSkull(vararg setCodes: String) =
        card(1, "Summoned Skull", *setCodes.map { Printing(it, "Metal Raiders", "Ultra Rare") }.toTypedArray())

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
