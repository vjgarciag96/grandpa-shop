package com.vjgarciag96.grandpashop.server.catalogue.endpoint

import kotlinx.serialization.Serializable

@Serializable
internal class CardsResponse(
    val cards: List<CardResponse>,
)

@Serializable
internal data class CardResponse(
    val passcode: Long,
    val name: String,
    val kind: String,
    val type: String,
    val text: String,
    val monster: MonsterResponse?,
    val printings: List<PrintingResponse>,
)

@Serializable
internal data class MonsterResponse(
    val attribute: String,
    val race: String,
    val level: Int? = null,
    val rank: Int? = null,
    val linkRating: Int? = null,
    val atk: Int?,
    val def: Int?,
)

@Serializable
internal class PrintingResponse(
    val setCode: String,
    val setName: String,
    val rarity: String,
)

@Serializable
internal class SetsResponse(
    val sets: List<SetResponse>,
)

@Serializable
internal class SetResponse(
    val name: String,
    val prefix: String,
    val printings: Int,
)

@Serializable
internal class SetPrintingsResponse(
    val name: String,
    val prefix: String,
    val cards: List<CardResponse>,
    val printings: List<SetPrintingResponse>,
)

@Serializable
internal class SetPrintingResponse(
    val setCode: String,
    val rarity: String,
    val passcode: Long,
)
