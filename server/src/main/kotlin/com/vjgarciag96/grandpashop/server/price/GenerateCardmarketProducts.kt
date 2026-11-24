package com.vjgarciag96.grandpashop.server.price

import com.vjgarciag96.grandpashop.server.catalogue.Ygoprodeck
import com.vjgarciag96.grandpashop.server.catalogue.YgoprodeckCards
import com.vjgarciag96.grandpashop.server.catalogue.cachedText
import kotlin.io.path.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.exists
import kotlin.io.path.readText
import kotlin.io.path.writeText

/**
 * Writes the product table from the kept catalogue, product list, and price guide, downloading whichever is
 * not kept yet. Rows already in the table stay as they are. Run with `./gradlew :server:generateCardmarketProducts`.
 * Arguments: the cache directory and the table path.
 */
fun main(args: Array<String>) {
    val cacheDir = Path(args.getOrElse(0) { ".cache" })
    val tablePath = Path(args.getOrElse(1) { "src/main/resources/cardmarket-products.csv" })

    val cards = YgoprodeckCards.parse(cachedText(cacheDir.resolve("cardinfo.json"), Ygoprodeck::cardInfo))
    val products =
        CardmarketProductList.parse(cachedText(cacheDir.resolve("cardmarket-products.json"), Cardmarket::productList))
    val guide = PriceGuides.keep(cacheDir, Cardmarket::priceGuide)
    val existing =
        if (tablePath.exists()) CardmarketProducts.fromCsv(tablePath.readText()) else CardmarketProducts(emptyList())

    val (table, coverage) = CardmarketProductTable.generate(cards, products, guide, existing)
    tablePath.parent?.createDirectories()
    tablePath.writeText(table.toCsv())

    println("Guide: ${guide.createdOn}; existing rows kept: ${existing.rows.size}")
    val sets = "matched ${coverage.setsMatched}, of them tied ${coverage.setsTied}; unmatched ${coverage.setsUnmatched}"
    println("Sets: ${coverage.sets} ($sets)")
    println("Printings: ${coverage.printings} (unmapped ${coverage.unmapped})")
    val rows = "unique ${coverage.unique}, inferred ${coverage.inferred}"
    println("Rows: ${table.rows.size} ($rows); keys excluded: ${coverage.excluded}")
    println("Wrote $tablePath")
}
