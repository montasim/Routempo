# Routempo monorepo guidance

- `apps/web` owns the TanStack Start/Vite/Nitro web application, server routes, database schema, migrations, and web tests.
- `apps/mobile` owns the native Kotlin/Jetpack Compose Android application.
- `docs/api/openapi-v1.yaml` is the language-neutral contract between both clients and the server.
- Read and follow the nearest scoped `AGENTS.md` before editing an application.
- Do not couple Gradle to pnpm or add `apps/mobile` to the pnpm workspace.
- Keep repository-root build, deployment, contract, and parity files under a single integrator owner during parallel work.
- Preserve user changes and avoid mixing behavior changes with repository-structure migrations.
