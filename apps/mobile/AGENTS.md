# Android application guidance

- Build a native Kotlin, Jetpack Compose, Material 3 application. Do not ship the product or prototype in a WebView.
- Treat `docs/api/openapi-v1.yaml`, `docs/android-implementation-plan.md`, and `docs/android-parity.json` as governing contracts.
- Keep recurring routine definitions separate from dated occurrence outcomes.
- Use secure bearer-session storage, saved-timezone calculations, idempotent mutations, and explicit loading/offline/error states.
- The integrator exclusively owns Gradle roots, the version catalog, application root/navigation, `AndroidManifest.xml`, generated API configuration, and the parity ledger.
- Feature agents must edit only their assigned module directories and return test/evidence details to the integrator.
