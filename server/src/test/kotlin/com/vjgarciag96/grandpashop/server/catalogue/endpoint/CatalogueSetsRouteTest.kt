package com.vjgarciag96.grandpashop.server.catalogue.endpoint

import com.vjgarciag96.grandpashop.server.catalogue.data.repository.InMemoryCardRepository
import com.vjgarciag96.grandpashop.server.errorMessage
import com.vjgarciag96.grandpashop.server.testApi
import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class CatalogueSetsRouteTest {
    private fun withSetsCatalogue(
        setName: String = "Legendary 5D&apos;s Decks",
        block: suspend ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        val fixture = checkNotNull(javaClass.getResource("/sets.json")).readText()
        val catalogue = InMemoryCardRepository.fromYgoprodeckJson(fixture.replace("Legendary 5D&apos;s Decks", setName))
        testApi(catalogue = catalogue)
        block()
    }

    private suspend fun HttpClient.sets(query: String): JsonArray =
        Json
            .parseToJsonElement(get("/api/sets?$query").bodyAsText())
            .jsonObject
            .getValue("sets")
            .jsonArray

    private suspend fun HttpClient.setPrintings(encodedName: String): JsonObject =
        Json.parseToJsonElement(get("/api/sets/printings?name=$encodedName").bodyAsText()).jsonObject

    private fun JsonArray.names(): List<String> = map { it.field("name").jsonPrimitive.content }

    private fun JsonElement.field(name: String): JsonElement = jsonObject.getValue(name)

    @Test
    fun ranks_the_prefix_then_a_name_start_then_a_word_start_then_anywhere_and_more_printings_first_within_each() =
        withSetsCatalogue {
            val names = client.sets("q=LOST").names()

            assertEquals(
                listOf(
                    "Sneak Preview Tournament",
                    "Lost Sanctuary Structure Deck",
                    "The Lost Millennium",
                    "Speed Duel: Arena of Lost Souls",
                    "The Lost Millennium Sneak Peek Participation Card",
                    "The Lost Millennium: Special Edition",
                    "The Ghostlost Pack",
                ),
                names,
            )
        }

    @Test
    fun ranks_sets_whose_prefix_is_the_query_first() =
        withSetsCatalogue {
            val names = client.sets("q=tlm").names()

            assertEquals(listOf("The Lost Millennium", "The Lost Millennium: Special Edition"), names)
        }

    @Test
    fun finds_a_set_by_the_start_of_its_prefix() =
        withSetsCatalogue {
            val names = client.sets("q=sdl").names()

            assertEquals(listOf("Lost Sanctuary Structure Deck"), names)
        }

    @Test
    fun describes_a_set_by_its_name_prefix_and_number_of_printings_without_tokens() =
        withSetsCatalogue {
            val set = client.sets("q=the%20lost%20millennium&limit=1").single()

            assertEquals(
                Json.parseToJsonElement("""{ "name": "The Lost Millennium", "prefix": "TLM", "printings": 4 }"""),
                set,
            )
        }

    @Test
    fun gives_a_set_that_mixes_prefixes_its_most_common_one() =
        withSetsCatalogue {
            val prefix =
                client
                    .sets("q=2-player")
                    .single()
                    .field("prefix")
                    .jsonPrimitive.content

            assertEquals("STAS", prefix)
        }

    @Test
    fun breaks_a_tie_between_prefixes_by_set_code_order() =
        withSetsCatalogue {
            val prefix =
                client
                    .sets("q=deluxe")
                    .single()
                    .field("prefix")
                    .jsonPrimitive.content

            assertEquals("SD1", prefix)
        }

    @Test
    fun returns_no_more_sets_than_the_limit() =
        withSetsCatalogue {
            val names = client.sets("q=lost&limit=2").names()

            assertEquals(listOf("Sneak Preview Tournament", "Lost Sanctuary Structure Deck"), names)
        }

    @Test
    fun rejects_a_set_query_shorter_than_two_characters() =
        withSetsCatalogue {
            val status = client.get("/api/sets?q=l").status

            assertEquals(HttpStatusCode.BadRequest, status)
        }

    @Test
    fun rejects_a_set_limit_above_fifty() =
        withSetsCatalogue {
            val status = client.get("/api/sets?q=lost&limit=51").status

            assertEquals(HttpStatusCode.BadRequest, status)
        }

    @Test
    fun lists_a_sets_printings_in_set_code_order_keeping_the_catalogue_order_of_two_rarities() =
        withSetsCatalogue {
            val printings =
                client.setPrintings("The%20Lost%20Millennium").getValue("printings").jsonArray.map {
                    "${it.field("setCode").jsonPrimitive.content} ${it.field("rarity").jsonPrimitive.content}"
                }

            assertEquals(
                listOf("TLM-EN001 Common", "TLM-EN002 Common", "TLM-EN006 Ultra Rare", "TLM-EN006 Ultimate Rare"),
                printings,
            )
        }

    @Test
    fun ties_each_printing_of_a_set_to_its_card_by_passcode() =
        withSetsCatalogue {
            val passcodes =
                client.setPrintings("The%20Lost%20Millennium").getValue("printings").jsonArray.map {
                    it.field("passcode").jsonPrimitive.content
                }

            assertEquals(listOf("21844576", "58932615", "83104731", "83104731"), passcodes)
        }

    @Test
    fun describes_each_card_of_a_set_once_with_all_its_printings() =
        withSetsCatalogue {
            val cards = client.setPrintings("The%20Lost%20Millennium").getValue("cards").jsonArray

            assertEquals(
                listOf(
                    "Elemental HERO Avian: LCGX-EN001, TLM-EN001",
                    "Elemental HERO Burstinatrix: TLM-EN002",
                    "Ancient Gear Golem: TLM-EN006, TLM-EN006",
                ),
                cards.map { card ->
                    val codes = card.field("printings").jsonArray.map { it.field("setCode").jsonPrimitive.content }
                    "${card.field("name").jsonPrimitive.content}: ${codes.joinToString()}"
                },
            )
        }

    @Test
    fun names_the_set_and_its_prefix_beside_its_printings() =
        withSetsCatalogue {
            val set = client.setPrintings("The%20Lost%20Millennium")

            assertEquals(
                listOf("The Lost Millennium", "TLM"),
                listOf(set.getValue("name").jsonPrimitive.content, set.getValue("prefix").jsonPrimitive.content),
            )
        }

    @Test
    fun reads_a_set_name_written_with_an_html_entity_as_plain_text() =
        withSetsCatalogue {
            val names = client.sets("q=5d's").names()

            assertEquals(listOf("Legendary 5D's Decks"), names)
        }

    @Test
    fun decodes_decimal_entities_above_the_basic_multilingual_plane() =
        withSetsCatalogue("Legendary 5D&#39;s Decks &#128512;") {
            val names = client.sets("q=5d").names()

            assertEquals(listOf("Legendary 5D's Decks 😀"), names)
        }

    @Test
    fun keeps_unrepresentable_decimal_entities_as_text() =
        withSetsCatalogue("Legendary 5D&#99999999999;s Decks &#55296; &#1114112;") {
            val names = client.sets("q=5d").names()

            assertEquals(listOf("Legendary 5D&#99999999999;s Decks &#55296; &#1114112;"), names)
        }

    @Test
    fun finds_no_set_by_a_name_in_another_case() =
        withSetsCatalogue {
            val status = client.get("/api/sets/printings?name=the%20lost%20millennium").status

            assertEquals(HttpStatusCode.NotFound, status)
        }

    @Test
    fun rejects_a_printings_request_with_no_set_name() =
        withSetsCatalogue {
            val response = client.get("/api/sets/printings")

            assertEquals(HttpStatusCode.BadRequest to "name is required", response.status to response.errorMessage())
        }
}
