package com.vjgarciag96.grandpashop.server.price

import com.vjgarciag96.grandpashop.server.catalogue.Card
import com.vjgarciag96.grandpashop.server.catalogue.SetPrinting
import java.text.Normalizer

data class Coverage(
    val sets: Int,
    val setsMatched: Int,
    val setsTied: Int,
    val setsUnmatched: Int,
    val printings: Int,
    val unique: Int,
    val inferred: Int,
    val excluded: Int,
    val unmapped: Int,
)

data class Generation(
    val table: CardmarketProducts,
    val coverage: Coverage,
)

/**
 * Builds the product table by matching each catalogue set to the Cardmarket expansion listing the same card
 * names, then each card to its product in that expansion. See docs/decisions/0013.
 */
object CardmarketProductTable {
    /** Rarities from the least to the most scarce; only the order within one card's pairing matters. */
    val rarityRank: List<String> =
        listOf(
            "Common",
            "Short Print",
            "Super Short Print",
            "Rare",
            "Super Rare",
            "Ultra Rare",
            "Ultimate Rare",
            "Secret Rare",
            "Prismatic Secret Rare",
            "Ghost Rare",
            "Starlight Rare",
            "Collector's Rare",
            "Platinum Secret Rare",
            "Quarter Century Secret Rare",
            "Ghost/Gold Rare",
            "Gold Rare",
            "Gold Secret Rare",
            "Premium Gold Rare",
            "Platinum Rare",
            "Starfoil Rare",
            "Mosaic Rare",
            "Shatterfoil Rare",
            "Normal Parallel Rare",
            "Super Parallel Rare",
            "Ultra Parallel Rare",
            "Duel Terminal Normal Parallel Rare",
            "Duel Terminal Rare Parallel Rare",
            "Duel Terminal Super Parallel Rare",
            "Duel Terminal Ultra Parallel Rare",
            "Extra Secret Rare",
            "Ultra Secret Rare",
            "10000 Secret Rare",
        )
    private val rankOf: Map<String, Int> =
        rarityRank.withIndex().associate { (rank, rarity) -> rarity.lowercase() to rank }

    /** An expansion's names must share at least this much of a set's names, by Jaccard, when none equals them. */
    private const val NEAR = 0.9

    /**
     * The table with [existing] rows kept as they are and a row for every other printing the rules settle,
     * plus how many sets and printings each rule took. Stops when a row's product is not in [products] or
     * a key would not survive a CSV line.
     */
    fun generate(
        cards: List<Card>,
        products: List<CardmarketProduct>,
        guide: PriceGuide,
        existing: CardmarketProducts,
    ): Generation {
        val expansions = expansionsOf(products)
        val sets =
            cards.flatMap { card -> card.printings.map { SetPrinting(card, it) } }.groupBy { it.printing.setName }
        val matches = sets.values.map { printings -> printings to matchExpansion(printings, expansions) }
        val proposed =
            matches.flatMap { (printings, match) ->
                if (match == null) emptyList() else rowsOf(printings, match, guide)
            }
        val (settled, excluded) = settle(proposed)
        val rows = existing.rows + settled.filter { existing.productOf(it.key) == null }
        val table = CardmarketProducts(rows)

        val known = products.map { it.id }.toSet()
        val unknown = table.rows.filter { it.product !in known }
        require(unknown.isEmpty()) { "These rows name a product Cardmarket does not list: $unknown" }

        val printings = sets.values.flatten()
        val coverage =
            Coverage(
                sets = sets.size,
                setsMatched = matches.count { (_, match) -> match != null },
                setsTied = matches.count { (_, match) -> match?.tied == true },
                setsUnmatched = matches.count { (_, match) -> match == null },
                printings = printings.size,
                unique = table.rows.count { it.how == Resolution.Unique },
                inferred = table.rows.count { it.how == Resolution.Inferred },
                excluded = excluded,
                unmapped = printings.count { table.productOf(it.key()) == null },
            )
        return Generation(table, coverage)
    }

    private class Expansion(
        val id: Long,
        val oldest: String,
        val productsByName: Map<String, List<CardmarketProduct>>,
    ) {
        val names: Set<String> = productsByName.keys

        fun isNear(setNames: Set<String>): Boolean {
            val smaller = minOf(names.size, setNames.size).toDouble()
            if (smaller / maxOf(names.size, setNames.size) < NEAR) return false
            val common = setNames.count { it in names }
            return common / (names.size + setNames.size - common).toDouble() >= NEAR
        }
    }

    private class ExpansionMatch(
        val expansion: Expansion,
        val tied: Boolean,
    )

    private fun expansionsOf(products: List<CardmarketProduct>): List<Expansion> =
        products.groupBy { it.expansion }.map { (id, members) ->
            Expansion(id, members.minOf { it.dateAdded }, members.groupBy { normalise(it.name) })
        }

    /** Expansions whose names equal the set's, else those near them; the one Cardmarket added first wins a tie. */
    private fun matchExpansion(
        printings: List<SetPrinting>,
        expansions: List<Expansion>,
    ): ExpansionMatch? {
        val names = printings.map { normalise(it.card.name) }.toSet()
        val candidates = expansions.filter { it.names == names }.ifEmpty { expansions.filter { it.isNear(names) } }
        val oldest = candidates.minWithOrNull(compareBy({ it.oldest }, { it.id })) ?: return null
        return ExpansionMatch(oldest, tied = candidates.size > 1)
    }

    private fun rowsOf(
        printings: List<SetPrinting>,
        match: ExpansionMatch,
        guide: PriceGuide,
    ): List<ProductRow> =
        printings.groupBy { normalise(it.card.name) }.flatMap { (name, ofCard) ->
            val products = match.expansion.productsByName[name].orEmpty()
            val rarities = ofCard.map { it.printing.rarity }.distinct()
            when {
                products.size == 1 && rarities.size == 1 ->
                    ofCard.map { it.row(products.single(), if (match.tied) Resolution.Inferred else Resolution.Unique) }
                products.size == rarities.size -> pairByPrice(ofCard, products, rarities, guide)
                else -> emptyList()
            }
        }

    /**
     * Products in trend order against rarities in rank order.
     * Nothing when a rarity has no rank or a product has no trend. */
    private fun pairByPrice(
        printings: List<SetPrinting>,
        products: List<CardmarketProduct>,
        rarities: List<String>,
        guide: PriceGuide,
    ): List<ProductRow> {
        val rankByRarity = rarities.associateWith { rankOf[it.lowercase()] }
        val trendByProduct = products.associateWith { guide.trend(it.id)?.cents }
        if (rankByRarity.values.any { it == null } || trendByProduct.values.any { it == null }) return emptyList()
        val byRank = rarities.sortedBy { rankByRarity.getValue(it) }
        val byTrend = products.sortedWith(compareBy({ trendByProduct.getValue(it) }, { it.id.value }))
        val productOf = byRank.zip(byTrend).toMap()
        return printings.map { it.row(productOf.getValue(it.printing.rarity), Resolution.Inferred) }
    }

    /** One row per key; a key two cards reach with different products is excluded and counted. */
    private fun settle(proposed: List<ProductRow>): Pair<List<ProductRow>, Int> {
        val byKey = proposed.groupBy { it.key }
        val agreed = byKey.values.filter { rows -> rows.distinctBy { it.product }.size == 1 }.map { it.first() }
        return agreed to byKey.size - agreed.size
    }

    private fun SetPrinting.key() = PrintingKey(printing.setCode, printing.rarity)

    private fun SetPrinting.row(
        product: CardmarketProduct,
        how: Resolution,
    ) = ProductRow(key(), product.id, how)

    // What makes Cardmarket's `""A"" Cell Breeding Device` equal YGOPRODeck's `"A" Cell Breeding Device`.
    private fun normalise(name: String): String =
        Normalizer.normalize(name, Normalizer.Form.NFKD).lowercase().filter { it in 'a'..'z' || it in '0'..'9' }
}
