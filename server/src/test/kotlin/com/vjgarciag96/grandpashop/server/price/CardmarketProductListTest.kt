package com.vjgarciag96.grandpashop.server.price

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class CardmarketProductListTest {
    @Test
    fun reads_each_product_with_its_name_expansion_and_date_added() {
        val text =
            """
            {"version":1,"createdAt":"2026-11-23T13:05:55+0100","products":[
              {"idProduct":579386,"name":"Relinquished","idCategory":5,"idExpansion":4416,"idMetacard":1,
               "dateAdded":"2021-10-18 10:00:00"}
            ]}
            """.trimIndent()

        val products = CardmarketProductList.parse(text)

        assertEquals(
            listOf(CardmarketProduct(CardmarketProductId(579386), "Relinquished", 4416, "2021-10-18 10:00:00")),
            products,
        )
    }
}
