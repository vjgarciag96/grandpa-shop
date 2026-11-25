package com.vjgarciag96.grandpashop.server.catalogue.endpoint

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Card
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.CardSet
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.MonsterRating
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.MonsterStats
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.SetContents

internal fun Card.toResponse() =
    CardResponse(
        passcode = passcode.value,
        name = name,
        kind = kind.name,
        type = type,
        text = text,
        monster = monster?.toResponse(),
        printings = printings.map { PrintingResponse(it.setCode, it.setName, it.rarity) },
    )

private fun MonsterStats.toResponse() =
    MonsterResponse(
        attribute = attribute,
        race = race,
        level = (rating as? MonsterRating.Level)?.value,
        rank = (rating as? MonsterRating.Rank)?.value,
        linkRating = (rating as? MonsterRating.LinkRating)?.value,
        atk = atk,
        def = def,
    )

internal fun CardSet.toResponse() = SetResponse(name, prefix, printingCount)

internal fun SetContents.toResponse() =
    SetPrintingsResponse(
        name = set.name,
        prefix = set.prefix,
        cards = printings.map { it.card }.distinctBy { it.passcode }.map { it.toResponse() },
        printings =
            printings.map {
                SetPrintingResponse(it.printing.setCode, it.printing.rarity, it.card.passcode.value)
            },
    )
