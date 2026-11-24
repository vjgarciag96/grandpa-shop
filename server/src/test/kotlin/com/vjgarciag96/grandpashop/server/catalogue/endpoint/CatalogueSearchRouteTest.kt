package com.vjgarciag96.grandpashop.server.catalogue.endpoint

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
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class CatalogueSearchRouteTest {
    private fun withFixtureCatalogue(block: suspend ApplicationTestBuilder.() -> Unit) =
        testApplication {
            testApi()
            block()
        }

    private suspend fun HttpClient.cards(query: String): JsonArray =
        Json
            .parseToJsonElement(get("/api/cards?$query").bodyAsText())
            .jsonObject
            .getValue("cards")
            .jsonArray

    private fun JsonArray.names(): List<String> = map { it.field("name").jsonPrimitive.content }

    private fun JsonElement.field(name: String): JsonElement = jsonObject.getValue(name)

    @Test
    fun finds_a_card_by_part_of_its_name_ignoring_case() =
        withFixtureCatalogue {
            val names = client.cards("q=blue-EYES").names()

            assertEquals(listOf("Blue-Eyes White Dragon"), names)
        }

    @Test
    fun finds_a_card_by_the_set_code_of_one_of_its_printings() =
        withFixtureCatalogue {
            val names = client.cards("q=lob-en005").names()

            assertEquals(listOf("Dark Magician"), names)
        }

    @Test
    fun lists_names_that_start_with_the_query_before_names_that_only_contain_it() =
        withFixtureCatalogue {
            val names = client.cards("q=dark%20magician").names()

            assertEquals(listOf("Dark Magician", "Toon Dark Magician"), names)
        }

    @Test
    fun returns_no_more_cards_than_the_limit() =
        withFixtureCatalogue {
            val names = client.cards("q=dark%20magician&limit=1").names()

            assertEquals(listOf("Dark Magician"), names)
        }

    @Test
    fun describes_a_card_with_its_kind_text_stats_and_printings() =
        withFixtureCatalogue {
            val card = client.cards("q=lob-en005").single()

            assertEquals(
                Json.parseToJsonElement(
                    """
                {
                  "passcode": 46986414,
                  "name": "Dark Magician",
                  "kind": "Monster",
                  "type": "Normal Monster",
                  "text": "''The ultimate wizard in terms of attack and defense.''",
                  "monster": { "attribute": "DARK", "race": "Spellcaster", "level": 7, "atk": 2500, "def": 2100 },
                  "printings": [
                    { "setCode": "LOB-EN005", "setName": "Legend of Blue Eyes White Dragon", "rarity": "Ultra Rare" }
                  ]
                }
                """,
                ),
                card,
            )
        }

    @Test
    fun gives_a_spell_no_monster_stats() =
        withFixtureCatalogue {
            val card = client.cards("q=pot%20of%20greed").single()

            assertEquals(setOf("passcode", "name", "kind", "type", "text", "printings"), card.jsonObject.keys)
        }

    @Test
    fun gives_an_xyz_monster_a_rank_instead_of_a_level() =
        withFixtureCatalogue {
            val monster = client.cards("q=utopia").single().field("monster")

            assertEquals(
                Json.parseToJsonElement(
                    """{ "attribute": "LIGHT", "race": "Warrior", "rank": 4, "atk": 2500, "def": 2000 }""",
                ),
                monster,
            )
        }

    @Test
    fun gives_a_link_monster_a_link_rating_and_no_defense() =
        withFixtureCatalogue {
            val monster = client.cards("q=decode%20talker").single().field("monster")

            assertEquals(
                Json.parseToJsonElement("""{ "attribute": "DARK", "race": "Cyberse", "linkRating": 3, "atk": 2300 }"""),
                monster,
            )
        }

    @Test
    fun writes_line_breaks_in_card_text_as_plain_newlines() =
        withFixtureCatalogue {
            val text =
                client
                    .cards("q=decode%20talker")
                    .single()
                    .field("text")
                    .jsonPrimitive.content

            assertEquals("2+ Effect Monsters\nGains 500 ATK", text.take(32))
        }

    @Test
    fun keeps_two_printings_that_share_a_set_code_but_differ_in_rarity() =
        withFixtureCatalogue {
            val printings =
                client
                    .cards("q=utopia")
                    .single()
                    .field("printings")
                    .jsonArray

            assertEquals(listOf("Rare", "Starfoil Rare"), printings.map { it.field("rarity").jsonPrimitive.content })
        }

    @Test
    fun leaves_out_skill_cards_and_tokens() =
        withFixtureCatalogue {
            val names = client.cards("q=-en&limit=50").names()

            assertEquals(
                listOf(
                    "Blue-Eyes White Dragon",
                    "Dark Magician",
                    "Decode Talker",
                    "Number 39: Utopia",
                    "Pot of Greed",
                    "Toon Dark Magician",
                ),
                names,
            )
        }

    @Test
    fun leaves_out_a_card_with_no_printing() =
        withFixtureCatalogue {
            val names = client.cards("q=white%20turtle").names()

            assertEquals(emptyList<String>(), names)
        }

    @Test
    fun rejects_a_query_shorter_than_two_characters() =
        withFixtureCatalogue {
            val status = client.get("/api/cards?q=%20d%20").status

            assertEquals(HttpStatusCode.BadRequest, status)
        }

    @Test
    fun rejects_a_limit_above_fifty() =
        withFixtureCatalogue {
            val status = client.get("/api/cards?q=dark&limit=51").status

            assertEquals(HttpStatusCode.BadRequest, status)
        }

    @Test
    fun rejects_a_limit_that_is_not_a_number() =
        withFixtureCatalogue {
            val status = client.get("/api/cards?q=dark&limit=many").status

            assertEquals(HttpStatusCode.BadRequest, status)
        }
}
