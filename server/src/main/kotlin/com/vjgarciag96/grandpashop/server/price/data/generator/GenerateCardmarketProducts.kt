package com.vjgarciag96.grandpashop.server.price.data.generator

import com.vjgarciag96.grandpashop.server.catalogue.data.parser.YgoprodeckParser
import com.vjgarciag96.grandpashop.server.catalogue.infra.YgoprodeckClient
import com.vjgarciag96.grandpashop.server.price.data.parser.CardmarketProductList
import com.vjgarciag96.grandpashop.server.price.data.repository.CardmarketProducts
import com.vjgarciag96.grandpashop.server.price.infra.CardmarketClient
import com.vjgarciag96.grandpashop.server.price.infra.PriceGuides
import kotlin.io.path.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.exists
import kotlin.io.path.readText
import kotlin.io.path.writeText

/**
 * Writes the product table from the kept catalogue, product list, and price guide, downloading only whichever is
 * not kept yet. Rows already in the table stay as they are. Run with `./gradlew :server:generateCardmarketProducts`.
 * Arguments: the cache directory and the table path.
 *
 * A re-run sees the same files as the last one, so to take in new sets or prices delete `cardinfo.json`,
 * `cardmarket-products.json` and the kept `price-guide-*.json` from the cache directory first.
 */
fun main(args: Array<String>) {
    val cacheDir = Path(args.getOrElse(0) { ".cache" })
    val tablePath = Path(args.getOrElse(1) { "src/main/resources/${CardmarketProducts.FILE_NAME}" })

    val cards = YgoprodeckParser.parse(YgoprodeckClient.keptCardInfo(cacheDir))
    val products = CardmarketProductList.parse(CardmarketClient.keptProductList(cacheDir))
    val guide = PriceGuides.keep(cacheDir, CardmarketClient::priceGuide)
    val existing =
        if (tablePath.exists()) CardmarketProducts.fromCsv(tablePath.readText()) else CardmarketProducts(emptyList())

    val (table, coverage) = CardmarketProductTable.generate(cards, products, guide, existing)
    tablePath.parent?.createDirectories()
    tablePath.writeText(table.toCsv())

    println("Guide: ${guide.createdOn}; existing rows kept: ${existing.rows.size}")
    println(coverage.report())
    println("Wrote $tablePath")
}
