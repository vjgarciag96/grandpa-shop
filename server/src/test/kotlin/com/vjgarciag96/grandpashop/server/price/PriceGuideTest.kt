package com.vjgarciag96.grandpashop.server.price

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import java.time.LocalDate

class PriceGuideTest {
    private val text =
        """
        {"version":1,"createdAt":"2026-11-23T02:46:00+0100","priceGuides":[
          {"idProduct":579386,"idCategory":5,"avg":41.2,"low":30.0,"trend":40.06,"avg-foil":null},
          {"idProduct":101788,"idCategory":5,"avg":null,"low":null,"trend":null},
          {"idProduct":105210,"idCategory":5,"trend":0.1},
          {"idProduct":289403,"idCategory":5,"trend":0}
        ]}
        """.trimIndent()

    @Test
    fun gives_the_trend_in_cents_on_the_day_the_guide_was_made() {
        val guide = PriceGuide.parse(text)

        val price = guide.trend(CardmarketProductId(579386))

        assertEquals(Price(4006, LocalDate.of(2026, 11, 23)), price)
    }

    @Test
    fun gives_no_price_for_a_product_whose_trend_is_null() {
        val guide = PriceGuide.parse(text)

        val price = guide.trend(CardmarketProductId(101788))

        assertNull(price, "a null trend is no price")
    }

    @Test
    fun gives_no_price_for_a_product_the_guide_does_not_list() {
        val guide = PriceGuide.parse(text)

        val price = guide.trend(CardmarketProductId(1))

        assertNull(price, "an unlisted product is no price")
    }

    @Test
    fun gives_a_price_of_zero_cents_for_a_trend_of_zero() {
        val guide = PriceGuide.parse(text)

        val price = guide.trend(CardmarketProductId(289403))

        assertEquals(Price(0, LocalDate.of(2026, 11, 23)), price, "a zero trend is a price of 0 cents")
    }

    @Test
    fun keeps_a_trend_of_ten_cents_exact() {
        val guide = PriceGuide.parse(text)

        val price = guide.trend(CardmarketProductId(105210))

        assertEquals(10L, price?.cents)
    }
}
