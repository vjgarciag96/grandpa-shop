package com.vjgarciag96.grandpashop.server.catalogue.domain.model

/** A product printings come from, known by its exact name. Its prefix is the most common start of its set codes. */
data class CardSet(
    val name: String,
    val prefix: String,
    val printingCount: Int,
)

/** One printing in a set, with the card it is a printing of. */
data class SetPrinting(
    val card: Card,
    val printing: Printing,
)

/** The printings of these cards under the name of the set each came in; what the catalogue calls a set. */
fun List<Card>.printingsBySet(): Map<String, List<SetPrinting>> =
    flatMap { card -> card.printings.map { SetPrinting(card, it) } }.groupBy { it.printing.setName }

/** A set and its printings in set-code order. */
data class SetContents(
    val set: CardSet,
    val printings: List<SetPrinting>,
)
