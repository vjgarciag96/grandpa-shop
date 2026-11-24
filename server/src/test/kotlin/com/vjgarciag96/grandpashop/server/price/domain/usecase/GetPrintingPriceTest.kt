package com.vjgarciag96.grandpashop.server.price.domain.usecase

import com.vjgarciag96.grandpashop.server.catalogue.domain.model.PrintingKey
import com.vjgarciag96.grandpashop.server.price.data.repository.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.data.repository.PriceGuide
import com.vjgarciag96.grandpashop.server.price.data.repository.Resolution
import com.vjgarciag96.grandpashop.server.price.data.repository.row
import com.vjgarciag96.grandpashop.server.price.domain.model.CardmarketProductId
import com.vjgarciag96.grandpashop.server.price.domain.model.Price
import com.vjgarciag96.grandpashop.server.price.domain.model.PriceLookup
import com.vjgarciag96.grandpashop.server.price.domain.usecase.GetPrintingPrice
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.LocalDate

class GetPrintingPriceTest {
    private val relinquished = PrintingKey("SRL-029", "Ultra Rare")
    private val darkBeginning = PrintingKey("DB1-EN015", "Super Rare")
    private val table =
        CardmarketProducts(
            listOf(
                row("SRL-029", "Ultra Rare", 579386, Resolution.Inferred),
                row("DB1-EN015", "Super Rare", 105210, Resolution.Inferred),
            ),
        )
    private val guide = PriceGuide(LocalDate.of(2026, 11, 23), mapOf(CardmarketProductId(579386) to 4006L))

    @Test
    fun finds_the_trend_of_the_printings_product_on_the_guides_day() {
        val prices = GetPrintingPrice(table, guide)

        val lookup = prices(relinquished)

        assertEquals(
            PriceLookup.Found(Price(4006, LocalDate.of(2026, 11, 23)), CardmarketProductId(579386)),
            lookup,
        )
    }

    @Test
    fun reports_no_product_for_a_printing_the_table_does_not_hold() {
        val prices = GetPrintingPrice(table, guide)

        val lookup = prices(PrintingKey("MRL-029", "Ultra Rare"))

        assertEquals(PriceLookup.NoProduct, lookup)
    }

    @Test
    fun reports_no_trend_for_a_product_the_guide_has_no_trend_for() {
        val prices = GetPrintingPrice(table, guide)

        val lookup = prices(darkBeginning)

        assertEquals(PriceLookup.NoTrend, lookup)
    }

    @Test
    fun reports_no_product_for_a_printing_the_table_does_not_hold_even_when_no_guide_is_loaded() {
        val prices = GetPrintingPrice(table, guide = null)

        val lookup = prices(PrintingKey("MRL-029", "Ultra Rare"))

        assertEquals(PriceLookup.NoProduct, lookup)
    }

    @Test
    fun reports_no_guide_for_a_mapped_printing_when_no_guide_is_loaded() {
        val prices = GetPrintingPrice(table, guide = null)

        val lookup = prices(relinquished)

        assertEquals(PriceLookup.NoGuide, lookup)
    }
}
