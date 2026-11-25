package com.vjgarciag96.grandpashop.server.catalogue.data.repository

import com.vjgarciag96.grandpashop.server.catalogue.data.parser.YgoprodeckParser
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Card
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.CardSet
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Passcode
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.SetContents
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.SetPrinting
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.printingsBySet
import com.vjgarciag96.grandpashop.server.catalogue.domain.service.CardRepository

class InMemoryCardRepository(
    cards: List<Card>,
) : CardRepository {
    private val entries = cards.map(::SearchEntry)
    private val passcodes = cards.map { it.passcode }.toSet()
    private val sets: Map<String, SetEntry> =
        cards.printingsBySet().mapValues { (name, printings) ->
            SetEntry(name, printings.sortedBy { it.printing.setCode })
        }

    override suspend fun contains(passcode: Passcode): Boolean = passcode in passcodes

    override suspend fun search(
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

    override suspend fun searchSets(
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

    override suspend fun findSet(name: String): SetContents? = sets[name]?.let { SetContents(it.set, it.printings) }

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
        fun fromYgoprodeckJson(json: String) = InMemoryCardRepository(YgoprodeckParser.parse(json))

        // Printings arrive in set-code order, so the first prefix to reach the top count wins a tie.
        private fun prefixOf(printings: List<SetPrinting>): String {
            val counts = printings.groupingBy { it.printing.setCode.substringBefore('-') }.eachCount()
            return counts.entries.maxBy { it.value }.key
        }
    }
}
