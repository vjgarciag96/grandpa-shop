package com.vjgarciag96.grandpashop.server.catalogue

class CardCatalogue(
    cards: List<Card>,
) {
    private val entries = cards.map(::SearchEntry)

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

    private class SearchEntry(
        val card: Card,
    ) {
        val name = card.name.lowercase()
        private val setCodes = card.printings.map { it.setCode.lowercase() }

        fun matches(needle: String) = needle in name || setCodes.any { needle in it }
    }

    companion object {
        fun fromYgoprodeckJson(json: String): CardCatalogue = CardCatalogue(YgoprodeckCards.parse(json))
    }
}
