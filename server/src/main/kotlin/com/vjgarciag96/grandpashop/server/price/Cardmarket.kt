package com.vjgarciag96.grandpashop.server.price

import com.vjgarciag96.grandpashop.server.http.Downloads

/** Cardmarket's public daily files for Yu-Gi-Oh (game 3). See docs/decisions/0013. */
object Cardmarket {
    private const val PRICE_GUIDE = "https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_3.json"
    private const val PRODUCT_LIST =
        "https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_3.json"
    private const val NAME = "Cardmarket"

    fun priceGuide(): String = Downloads.get(PRICE_GUIDE, NAME).use { it.readBytes().decodeToString() }

    fun productList(): String = Downloads.get(PRODUCT_LIST, NAME).use { it.readBytes().decodeToString() }
}
