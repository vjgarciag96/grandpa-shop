plugins {
    application
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ktlint)
    alias(libs.plugins.detekt)
}

kotlin {
    jvmToolchain(21)
}

application {
    mainClass.set("com.vjgarciag96.grandpashop.server.MainKt")
}

dependencies {
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.netty)
    implementation(libs.ktor.server.content.negotiation)
    implementation(libs.ktor.serialization.kotlinx.json)
    implementation(libs.exposed.core)
    implementation(libs.exposed.jdbc)
    implementation(libs.postgresql)
    testImplementation(libs.ktor.server.test.host)
    testImplementation(libs.junit.jupiter)
    testRuntimeOnly(libs.junit.platform.launcher)
}

tasks.test {
    useJUnitPlatform()
}

tasks.register<JavaExec>("generateCardmarketProducts") {
    group = "data"
    description =
        "Writes src/main/resources/cardmarket-products.csv from the kept catalogue, product list and price guide. " +
        "Delete .cache/cardinfo.json, cardmarket-products.json and price-guide-*.json first to fetch fresh files."
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass.set("com.vjgarciag96.grandpashop.server.price.data.generator.GenerateCardmarketProductsKt")
    workingDir = projectDir
}
