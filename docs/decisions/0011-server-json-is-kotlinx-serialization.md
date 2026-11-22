# Server JSON is kotlinx.serialization through Ktor

Status: accepted

The server reads and writes JSON with kotlinx.serialization, through Ktor 3.6.1's `ktor-server-content-negotiation` and `ktor-serialization-kotlinx-json`, and the Kotlin serialization compiler plugin at the Kotlin version. Route tests use `ktor-server-test-host` 3.6.1. Gradle 9 needs `junit-platform-launcher` at the JUnit version on the test runtime to start JUnit at all.

Why: the card catalogue route is the first JSON the server sends, and this is the serializer Ktor documents and maintains with its own versions, so it moves with the Ktor pin instead of on its own.

The server talks to YGOPRODeck with the JDK's `java.net.http.HttpClient`, not the Ktor client, because the catalogue makes two kinds of GET request and needs nothing more.
