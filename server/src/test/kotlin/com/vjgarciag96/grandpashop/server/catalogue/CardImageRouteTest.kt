package com.vjgarciag96.grandpashop.server.catalogue

import com.vjgarciag96.grandpashop.server.fixtureCatalogue
import com.vjgarciag96.grandpashop.server.testApi
import io.ktor.client.request.get
import io.ktor.client.statement.readRawBytes
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import org.junit.jupiter.api.Assertions.assertArrayEquals
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.io.IOException
import java.nio.file.Path

class CardImageRouteTest {
    @TempDir
    lateinit var cacheDir: Path

    private val darkMagicianJpeg = "fake jpeg of Dark Magician".encodeToByteArray()
    private val fetched = mutableListOf<Long>()

    private fun withImages(
        fetch: (Passcode) -> ByteArray,
        block: suspend ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        val catalogue = fixtureCatalogue()
        val images =
            CardImages(cacheDir, catalogue) { passcode ->
                fetched += passcode.value
                fetch(passcode)
            }
        testApi(catalogue, images)
        block()
    }

    @Test
    fun serves_the_image_of_a_card_in_the_catalogue_as_a_jpeg() =
        withImages({ darkMagicianJpeg }) {
            val response = client.get("/api/cards/46986414/image")

            assertEquals(ContentType.Image.JPEG, response.contentType())
            assertArrayEquals(darkMagicianJpeg, response.readRawBytes())
        }

    @Test
    fun fetches_an_image_from_the_source_only_the_first_time() =
        withImages({ darkMagicianJpeg }) {
            client.get("/api/cards/46986414/image")

            client.get("/api/cards/46986414/image")

            assertEquals(listOf(46986414L), fetched)
        }

    @Test
    fun keeps_a_fetched_image_for_the_next_server_start() =
        withImages({ darkMagicianJpeg }) {
            client.get("/api/cards/46986414/image")
            val fixture = checkNotNull(javaClass.getResource("/cardinfo.json")).readText()
            val catalogue = CardCatalogue.fromYgoprodeckJson(fixture)
            val restarted = CardImages(cacheDir, catalogue) { error("the source must not be asked again") }

            val image = restarted.image(Passcode(46986414))

            assertArrayEquals(darkMagicianJpeg, image)
        }

    @Test
    fun answers_not_found_without_asking_the_source_for_a_passcode_outside_the_catalogue() =
        withImages({ darkMagicianJpeg }) {
            val status = client.get("/api/cards/12345678/image").status

            assertEquals(HttpStatusCode.NotFound to emptyList<Long>(), status to fetched)
        }

    @Test
    fun answers_not_found_for_a_passcode_that_is_not_a_number() =
        withImages({ darkMagicianJpeg }) {
            val status = client.get("/api/cards/..%2F..%2Fcardinfo/image").status

            assertEquals(HttpStatusCode.NotFound, status)
        }

    @Test
    fun answers_bad_gateway_when_the_source_fails_and_nothing_is_kept() =
        withImages({ throw IOException("YGOPRODeck is down") }) {
            val status = client.get("/api/cards/46986414/image").status

            assertEquals(HttpStatusCode.BadGateway, status)
        }
}
