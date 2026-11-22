package com.vjgarciag96.grandpashop.server.catalogue

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** Reads the `cardinfo.php` response of the YGOPRODeck API v7 into catalogue cards. */
internal object YgoprodeckCards {
    private val json = Json { ignoreUnknownKeys = true }

    // Skill cards and tokens are not Monster, Spell, or Trap, and a card with no printing cannot become a copy.
    fun parse(text: String): List<Card> = json.decodeFromString<Response>(text).data.mapNotNull { it.toCard() }

    private fun Source.toCard(): Card? {
        val kind = kind()
        val printings = cardSets.map { Printing(it.setCode, it.setName, it.setRarity) }.distinct()
        return if (kind == null || printings.isEmpty()) {
            null
        } else {
            Card(
                passcode = Passcode(id),
                name = name,
                kind = kind,
                type = type,
                text = desc.replace("\r\n", "\n"),
                monster = if (kind == CardKind.Monster) monsterStats() else null,
                printings = printings,
            )
        }
    }

    private fun Source.kind(): CardKind? =
        when {
            type == "Spell Card" -> CardKind.Spell
            type == "Trap Card" -> CardKind.Trap
            "Monster" in type -> CardKind.Monster
            else -> null
        }

    private fun Source.monsterStats() =
        MonsterStats(
            attribute = attribute.orEmpty(),
            race = race.orEmpty(),
            rating =
                when {
                    "XYZ" in type -> MonsterRating.Rank(level ?: 0)
                    "Link" in type -> MonsterRating.LinkRating(linkval ?: 0)
                    else -> MonsterRating.Level(level ?: 0)
                },
            atk = atk,
            def = def,
        )

    @Serializable
    private class Response(
        val data: List<Source>,
    )

    @Serializable
    private data class Source(
        val id: Long,
        val name: String,
        val type: String,
        val desc: String,
        val race: String? = null,
        val attribute: String? = null,
        val level: Int? = null,
        val linkval: Int? = null,
        val atk: Int? = null,
        val def: Int? = null,
        @SerialName("card_sets") val cardSets: List<SourcePrinting> = emptyList(),
    )

    @Serializable
    private class SourcePrinting(
        @SerialName("set_code") val setCode: String,
        @SerialName("set_name") val setName: String,
        @SerialName("set_rarity") val setRarity: String,
    )
}
