package com.vjgarciag96.grandpashop.server.catalogue

@JvmInline
value class Passcode(
    val value: Long,
)

enum class CardKind { Monster, Spell, Trap }

data class Card(
    val passcode: Passcode,
    val name: String,
    val kind: CardKind,
    val type: String,
    val text: String,
    val monster: MonsterStats?,
    val printings: List<Printing>,
)

data class Printing(
    val setCode: String,
    val setName: String,
    val rarity: String,
)

data class MonsterStats(
    val attribute: String,
    val race: String,
    val rating: MonsterRating,
    val atk: Int?,
    val def: Int?,
)

sealed interface MonsterRating {
    data class Level(
        val value: Int,
    ) : MonsterRating

    data class Rank(
        val value: Int,
    ) : MonsterRating

    data class LinkRating(
        val value: Int,
    ) : MonsterRating
}
