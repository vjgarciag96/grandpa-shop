package com.vjgarciag96.grandpashop.server.price

import com.vjgarciag96.grandpashop.server.core.Downloads
import com.vjgarciag96.grandpashop.server.core.cachedText
import java.nio.file.Path

/** Cardmarket's public daily files for Yu-Gi-Oh (game 3). See docs/decisions/0013. */
object Cardmarket {
    private const val PRICE_GUIDE = "https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_3.json"
    private const val PRODUCT_LIST =
        "https://downloads.s3.cardmarket.com/productCatalog/productList/products_singles_3.json"
    private const val NAME = "Cardmarket"
    private const val PRODUCT_LIST_FILE = "cardmarket-products.json"

    fun priceGuide(): String = Downloads.text(PRICE_GUIDE, NAME)

    /** The product list kept in [cacheDir] as `cardmarket-products.json`, downloaded once when it is not there yet. */
    fun keptProductList(cacheDir: Path): String = cachedText(cacheDir.resolve(PRODUCT_LIST_FILE), ::productList)

    private fun productList(): String = Downloads.text(PRODUCT_LIST, NAME)
}
