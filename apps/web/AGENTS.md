# Web application guidance

- This application uses React 19, TanStack Start/Router, Vite, Nitro, Drizzle, and pnpm. It is not Next.js.
- Run web commands from the repository root through `pnpm --filter @routempo/web ...` or the root `web:*` scripts.
- Keep paths in package-local configuration relative to `apps/web`; do not prefix them again with `apps/web`.
- Preserve `/api/v1` as the first-party mobile contract and update its OpenAPI document and contract tests with any behavior change.
- Keep browser/PWA behavior separate from native Android implementation details.
- Do not run database migrations against a non-disposable database while verifying repository changes.
