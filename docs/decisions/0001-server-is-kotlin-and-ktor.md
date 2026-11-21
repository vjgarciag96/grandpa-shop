# Server is Kotlin and Ktor

Status: accepted

The server is Kotlin 2.4.21 on JDK 21, with Ktor 3.6.1 (`ktor-server-core`, `ktor-server-netty`).

Why: it is the server stack Víctor already uses on furbo-papa, and this skeleton has no reason to make him learn another one.

JUnit Jupiter 6.1.3 is the server test runner, so the test task is wired before the first behaviour test. No routes are registered yet.
