package com.vjgarciag96.grandpashop.server.price

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Card
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.SetPrinting
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.printingsBySet
import java.text.Normalizer
import java.time.LocalDateTime

/**
 * What one run of the generator settled. The `sets` counts are catalogue sets; `printings` and `unmapped` count
 * catalogue printings; `unique` and `inferred` count table rows, kept ones included, so they add up to the table
 * and not to `printings`; `excluded` counts keys two cards reached with different products.
 */
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
) {
    /** The counts as the generator reports them, one line per kind of thing counted. */
    fun report(): String =
        listOf(
            "Sets: $sets (matched $setsMatched, of them tied $setsTied; unmatched $setsUnmatched)",
            "Printings: $printings (unmapped $unmapped)",
            "Rows: ${unique + inferred} (unique $unique, inferred $inferred); keys excluded: $excluded",
        ).joinToString("\n")
}

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
    private val rarityRank: List<String> =
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

    /** A set with fewer names than this never joins an expansion: one or two shared names say too little. */
    private const val NAMES_TO_JOIN = 3

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
        val sets = cards.printingsBySet().values
        val matching = match(sets, products, guide)
        val table = CardmarketProducts(existing.rows + matching.rows.filter { existing.productOf(it.key) == null })
        requireListed(table, products)
        return Generation(table, coverageOf(sets.flatten(), matching, table))
    }

    private class Matching(
        val matches: List<ExpansionMatch?>,
        val rows: List<ProductRow>,
        val excludedKeys: Int,
    )

    /** Every set against the expansions, and every printing of a matched set against its products. */
    private fun match(
        sets: Collection<List<SetPrinting>>,
        products: List<CardmarketProduct>,
        guide: PriceGuide,
    ): Matching {
        val expansions = expansionsOf(products)
        val matches = sets.map { printings -> matchExpansion(printings, expansions) }
        val proposed =
            sets.zip(matches).flatMap { (printings, match) ->
                if (match == null) emptyList() else rowsOf(printings, match, guide)
            }
        val (settled, excluded) = settle(proposed)
        return Matching(matches, settled, excluded)
    }

    /** A row may only name a product Cardmarket lists, whether the run made it or kept it. */
    private fun requireListed(
        table: CardmarketProducts,
        products: List<CardmarketProduct>,
    ) {
        val known = products.map { it.id }.toSet()
        val unknown = table.rows.filter { it.product !in known }
        require(unknown.isEmpty()) { "These rows name a product Cardmarket does not list: $unknown" }
    }

    private fun coverageOf(
        printings: List<SetPrinting>,
        matching: Matching,
        table: CardmarketProducts,
    ) = Coverage(
        sets = matching.matches.size,
        setsMatched = matching.matches.count { it != null },
        setsTied = matching.matches.count { it?.tied == true },
        setsUnmatched = matching.matches.count { it == null },
        printings = printings.size,
        unique = table.rows.count { it.how == Resolution.Unique },
        inferred = table.rows.count { it.how == Resolution.Inferred },
        excluded = matching.excludedKeys,
        unmapped = printings.count { table.productOf(it.key()) == null },
    )

    private class Expansion(
        val id: Long,
        val firstAdded: LocalDateTime,
        val productsByName: Map<String, List<CardmarketProduct>>,
    ) {
        val names: Set<String> = productsByName.keys

        fun isNear(setNames: Set<String>): Boolean {
            // The size ratio bounds Jaccard from above, so this only skips the count; the Jaccard line decides.
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

    /**
     * Expansions whose names equal the set's, else those near them; the one Cardmarket added first wins a tie.
     * A set with too few names to be told apart has no candidates at all.
     */
    private fun matchExpansion(
        printings: List<SetPrinting>,
        expansions: List<Expansion>,
    ): ExpansionMatch? {
        val names = printings.map { normalise(it.card.name) }.toSet()
        val candidates =
            if (names.size < NAMES_TO_JOIN) {
                emptyList()
            } else {
                expansions.filter { it.names == names }.ifEmpty { expansions.filter { it.isNear(names) } }
            }
        val first = candidates.minWithOrNull(compareBy({ it.firstAdded }, { it.id }))
        return if (first == null) null else ExpansionMatch(first, tied = candidates.size > 1)
    }

    private fun rowsOf(
        printings: List<SetPrinting>,
        match: ExpansionMatch,
        guide: PriceGuide,
    ): List<ProductRow> =
        printings.groupBy { normalise(it.card.name) }.flatMap { (name, ofCard) ->
            val products = match.expansion.productsByName[name].orEmpty()
            val rarities = ofCard.map { it.printing.rarity }.distinct()
            val setCodes = ofCard.map { it.printing.setCode }.distinct()
            when {
                products.size == 1 && rarities.size == 1 ->
                    ofCard.map { it.row(products.single(), if (match.tied) Resolution.Inferred else Resolution.Unique) }
                rarities.size == 1 && products.size == setCodes.size -> pairBySetCode(ofCard, products)
                products.size == rarities.size -> pairByPrice(ofCard, products, rarities, guide)
                else -> emptyList()
            }
        }

    /**
     * Products in the order Cardmarket added them against set codes in their own order: Cardmarket added the
     * later regional reprint (MRD-E003, MRD-EN003) as a later product. A guess, so the rows are inferred.
     */
    private fun pairBySetCode(
        printings: List<SetPrinting>,
        products: List<CardmarketProduct>,
    ): List<ProductRow> {
        val byCode = printings.sortedBy { it.printing.setCode }
        val byAdded = products.sortedWith(compareBy({ it.dateAdded }, { it.id.value }))
        return byCode.zip(byAdded) { printing, product -> printing.row(product, Resolution.Inferred) }
    }

    /**
     * Products in trend order against rarities in rank order. Nothing when a rarity has no rank, a product has
     * no trend, or two products share a trend, since the price then says nothing about which is which.
     */
    private fun pairByPrice(
        printings: List<SetPrinting>,
        products: List<CardmarketProduct>,
        rarities: List<String>,
        guide: PriceGuide,
    ): List<ProductRow> {
        val rankByRarity = rarities.associateWith { rankOf[it.lowercase()] }
        val trendByProduct = products.associateWith { guide.trend(it.id)?.cents }
        val trends = trendByProduct.values
        if (rankByRarity.values.any { it == null } || trends.any { it == null } || trends.toSet().size < trends.size) {
            return emptyList()
        }
        val byRank = rarities.sortedBy { rankByRarity.getValue(it) }
        val byTrend = products.sortedBy { trendByProduct.getValue(it) }
        val productOf = byRank.zip(byTrend).toMap()
        return printings.map { it.row(productOf.getValue(it.printing.rarity), Resolution.Inferred) }
    }

    /** One row per key; a key two cards reach with different products is excluded and counted. */
    private fun settle(proposed: List<ProductRow>): Pair<List<ProductRow>, Int> {
        val byKey = proposed.groupBy { it.key }
        val agreed = byKey.values.filter { rows -> rows.distinctBy { it.product }.size == 1 }.map { it.first() }
        return agreed to byKey.size - agreed.size
    }
}

private fun SetPrinting.key() = PrintingKey(printing.setCode, printing.rarity)

private fun SetPrinting.row(
    product: CardmarketProduct,
    how: Resolution,
) = ProductRow(key(), product.id, how)

// What makes Cardmarket's `""A"" Cell Breeding Device` equal YGOPRODeck's `"A" Cell Breeding Device`.
private fun normalise(name: String): String =
    Normalizer.normalize(name, Normalizer.Form.NFKD).lowercase().filter { it in 'a'..'z' || it in '0'..'9' }
