# Android is Jetpack Compose

Status: accepted

The phone client is Kotlin and Jetpack Compose (Compose BOM 2026.11.01, Activity Compose 1.13.0, Material 3 from that BOM) on Android Gradle Plugin 9.5.2. `minSdk` is 26. `compileSdk` is 37.2, because that BOM will not compile against an older platform. `targetSdk` stays 36. JDK 21.

Why: it is the Android UI toolkit Víctor already uses on furbo-papa, so the phone client does not introduce a second one.

The launcher activity's content is empty. Built-in Kotlin from AGP 9 compiles the module, so the Android module does not apply `org.jetbrains.kotlin.android`.
