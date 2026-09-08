# Routempo Android

Native Kotlin, Jetpack Compose, and Material 3 client for Routempo. The application consumes the shared `/api/v1` contract and does not embed the web product in a WebView.

## Open and run

Open this `apps/mobile` directory as the project in Android Studio. The checked-in Gradle wrapper is the supported entry point. `local.properties` is intentionally ignored; set `sdk.dir` there or let Android Studio create it.

Requirements:

- JDK 17
- Android SDK Platform 36 and Build Tools 36.0.0
- An API 26+ device or emulator
- The Routempo web server and database for authenticated debug workflows

On Windows, from this directory:

```powershell
$env:JAVA_HOME = "path-to-jdk-17"
$env:ANDROID_SDK_ROOT = "path-to-android-sdk"
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug
```

The debug APK is generated at `app/build/outputs/apk/debug/app-debug.apk`.

## GitHub Releases

Android releases use independent semantic versions from `version.properties`:

- Git tag: `android-v1.0.0`
- Release title: `Routempo Android v1.0.0`
- APK asset: `Routempo-android-v1.0.0.apk`
- Checksum asset: `Routempo-android-v1.0.0.apk.sha256`

Increment `VERSION_CODE` for every published APK and change `VERSION_NAME` according to semantic versioning. Pushing the matching `android-v<version>` tag runs `.github/workflows/android-release.yml`, verifies unit tests and release lint, signs the APK, verifies its signature, creates a SHA-256 checksum, and publishes both files to GitHub Releases.

Configure these GitHub Actions repository secrets before publishing:

- `ROUTEMPO_KEYSTORE_BASE64`
- `ROUTEMPO_SIGNING_STORE_PASSWORD`
- `ROUTEMPO_SIGNING_KEY_ALIAS`
- `ROUTEMPO_SIGNING_KEY_PASSWORD`

Generate `ROUTEMPO_KEYSTORE_BASE64` from the binary upload keystore and keep the keystore and credentials outside the repository. Local signed packaging uses the equivalent `ROUTEMPO_SIGNING_*` environment variables and the `packageGithubRelease` Gradle task. Its output is written to `app/build/outputs/github-release/`.

## API and authentication

- Debug API: `http://10.0.2.2:3000/api/v1` (Android Emulator to host machine)
- Release API: `https://routempo.netlify.app/api/v1`
- Application ID: `com.montasim.routempo`
- Debug application ID: `com.montasim.routempo.debug`
- OAuth callback: `routempo://auth/callback`

Provider consoles and the server allowlist must accept the web provider callback and Routempo's mobile redirect bridge. Signing keys and provider secrets do not belong in the repository.

## Modules

- `app`: application lifecycle, navigation, API orchestration, files, and notification workers
- `core:model`: shared Kotlin domain models
- `core:network`: typed v1 client, secure bearer sessions, refresh, problems, request IDs, and idempotency
- `core:data`: account-scoped offline snapshot cache
- `core:designsystem`: Material theme and reusable accessible UI primitives
- `feature:*`: auth, Today, routines, Plan, Review, and Settings screens

The detailed parity contract is in [`../../docs/android-parity.json`](../../docs/android-parity.json), and the implementation decisions are in [`../../docs/android-implementation-plan.md`](../../docs/android-implementation-plan.md).
