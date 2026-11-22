package com.vjgarciag96.grandpashop.server.catalogue

class CardCatalogue(
    cards: List<Card>,
) {
    private val entries = cards.map(::SearchEntry)
    private val passcodes = cards.map { it.passcode }.toSet()
    private val sets: Map<String, SetEntry> =
        cards
            .flatMap { card -> card.printings.map { SetPrinting(card, it) } }
            .groupBy { it.printing.setName }
            .mapValues { (name, printings) -> SetEntry(name, printings.sortedBy { it.printing.setCode }) }

    fun contains(passcode: Passcode): Boolean = passcode in passcodes

    fun search(
        query: String,
        limit: Int,
    ): List<Card> {
        val needle = query.trim().lowercase()
        return entries
            .filter { it.matches(needle) }
            .sortedWith(compareBy({ !it.name.startsWith(needle) }, { it.card.name }))
            .take(limit)
            .map { it.card }
    }

    /** Sets whose name contains the query or whose prefix starts with it, the closest matches first. */
    fun searchSets(
        query: String,
        limit: Int,
    ): List<CardSet> {
        val needle = query.trim().lowercase()
        return sets.values
            .mapNotNull { entry -> entry.rank(needle)?.let { match -> RankedSet(match, entry.set) } }
            .sortedWith(compareBy({ it.match }, { -it.set.printingCount }, { it.set.name }))
            .take(limit)
            .map { it.set }
    }

    /** The set with exactly this name and its printings in set-code order, or null when there is none. */
    fun setPrintings(name: String): SetContents? = sets[name]?.let { SetContents(it.set, it.printings) }

    private class SearchEntry(
        val card: Card,
    ) {
        val name = card.name.lowercase()
        private val setCodes = card.printings.map { it.setCode.lowercase() }

        fun matches(needle: String) = needle in name || setCodes.any { needle in it }
    }

    /** How closely a set matches a query, closest first. */
    private enum class SetMatch { Prefix, NameStart, WordStart, Elsewhere }

    private class RankedSet(
        val match: SetMatch,
        val set: CardSet,
    )

    private class SetEntry(
        name: String,
        val printings: List<SetPrinting>,
    ) {
        val set = CardSet(name, prefixOf(printings), printings.size)
        private val lowerName = name.lowercase()
        private val lowerPrefix = set.prefix.lowercase()

        fun rank(needle: String): SetMatch? =
            when {
                lowerPrefix == needle -> SetMatch.Prefix
                lowerName.startsWith(needle) -> SetMatch.NameStart
                startsAWord(needle) -> SetMatch.WordStart
                needle in lowerName || lowerPrefix.startsWith(needle) -> SetMatch.Elsewhere
                else -> null
            }

        // Only called once the name does not start with the needle, so a word start follows a non-letter.
        private fun startsAWord(needle: String): Boolean {
            val afterANonLetter = Regex("""(?<![\p{L}\p{N}])""" + Regex.escape(needle))
            return afterANonLetter.containsMatchIn(lowerName)
        }
    }

    companion object {
        fun fromYgoprodeckJson(json: String): CardCatalogue = CardCatalogue(YgoprodeckCards.parse(json))

        // Printings arrive in set-code order, so the first prefix to reach the top count wins a tie.
        private fun prefixOf(printings: List<SetPrinting>): String {
            val counts = printings.groupingBy { it.printing.setCode.substringBefore('-') }.eachCount()
            return counts.entries.maxBy { it.value }.key
        }
    }
}
