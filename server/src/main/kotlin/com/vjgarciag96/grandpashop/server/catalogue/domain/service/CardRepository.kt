package com.vjgarciag96.grandpashop.server.catalogue.domain.service

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Card
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.CardSet
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.Passcode
import com.vjgarciag96.grandpashop.server.catalogue.domain.model.SetContents

/** The cards and sets the catalogue knows. Read-only: the catalogue is reference data, not the collection. */
interface CardRepository {
    suspend fun contains(passcode: Passcode): Boolean

    /** Cards whose name or one of whose set codes contains [query], those whose name starts with it first. */
    suspend fun search(
        query: String,
        limit: Int,
    ): List<Card>

    /** Sets whose name contains [query] or whose prefix starts with it, the closest matches first. */
    suspend fun searchSets(
        query: String,
        limit: Int,
    ): List<CardSet>

    /** The set with exactly this name and its printings in set-code order, or null when there is none. */
    suspend fun findSet(name: String): SetContents?
}
