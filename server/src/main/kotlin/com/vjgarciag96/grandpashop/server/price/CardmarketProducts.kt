package com.vjgarciag96.grandpashop.server.price

/** How a row of the product table was settled: on its own, or by a tie-break a maintainer may want to audit. */
enum class Resolution(
    val csv: String,
) {
    Unique("unique"),
    Inferred("inferred"),
}

data class ProductRow(
    val key: PrintingKey,
    val product: CardmarketProductId,
    val how: Resolution,
)

/** The committed product table: one product per printing key. Read-only at run time. */
class CardmarketProducts(
    unsorted: List<ProductRow>,
) {
    /** Sorted by set code, then rarity, as plain strings, so the file is stable between runs. */
    val rows: List<ProductRow> = unsorted.sortedWith(compareBy({ it.key.setCode }, { it.key.rarity }))
    private val byKey: Map<PrintingKey, ProductRow> = rows.associateBy { it.key }

    init {
        rows.forEach { row ->
            require(row.key.setCode.isPlain() && row.key.rarity.isPlain()) {
                "A printing key may not hold a comma, tab, quote, or line break: ${row.key}"
            }
        }
        require(byKey.size == rows.size) {
            val twice =
                rows
                    .groupingBy { it.key }
                    .eachCount()
                    .filterValues { it > 1 }
                    .keys
            "A printing may not have two products: $twice"
        }
    }

    fun productOf(key: PrintingKey): CardmarketProductId? = byKey[key]?.product

    fun toCsv(): String =
        buildString {
            appendLine(HEADER)
            rows.forEach { appendLine("${it.key.setCode},${it.key.rarity},${it.product.value},${it.how.csv}") }
        }

    private fun String.isPlain() = none { it == ',' || it == '\t' || it == '"' || it == '\n' || it == '\r' }

    companion object {
        /** The table's file name, under the server resources once committed. */
        const val FILE_NAME = "cardmarket-products.csv"
        private const val HEADER = "set_code,rarity,product,how"
        private const val COLUMNS = 4
        private const val PRODUCT_COLUMN = 2
        private const val HOW_COLUMN = 3
        private const val FIRST_ROW_LINE = 2
        private const val RESOURCE = "/$FILE_NAME"

        fun fromCsv(text: String): CardmarketProducts {
            val lines = text.lines().filter { it.isNotEmpty() }
            require(lines.firstOrNull() == HEADER) { "The product table must start with '$HEADER'" }
            return CardmarketProducts(lines.drop(1).mapIndexed { index, line -> row(line, index + FIRST_ROW_LINE) })
        }

        fun fromResource(): CardmarketProducts {
            val stream =
                requireNotNull(CardmarketProducts::class.java.getResourceAsStream(RESOURCE)) {
                    "The product table $RESOURCE is missing from the server resources"
                }
            return fromCsv(stream.use { it.readBytes().decodeToString() })
        }

        private fun row(
            line: String,
            lineNumber: Int,
        ): ProductRow {
            val fields = line.split(',')
            require(fields.size == COLUMNS) { "Line $lineNumber has ${fields.size} fields, not $COLUMNS" }
            val (setCode, rarity) = fields
            val product = fields[PRODUCT_COLUMN]
            val how = fields[HOW_COLUMN]
            val id = requireNotNull(product.toLongOrNull()) { "Line $lineNumber: '$product' is not a product id" }
            val resolution = Resolution.entries.find { it.csv == how }
            return ProductRow(
                PrintingKey(setCode, rarity),
                CardmarketProductId(id),
                requireNotNull(resolution) { "Line $lineNumber: '$how' is not a resolution" },
            )
        }
    }
}
