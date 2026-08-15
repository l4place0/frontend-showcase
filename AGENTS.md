# Repository instructions

- The React Catalog and every Specimen Item are separate runtimes; never let an item depend on Catalog DOM, React context, or global CSS.
- `src/`, `specimens/`, and the build scripts are source of truth. Never edit `.generated/` or `dist/` directly.
- Keep Specimen Protocol v1 manifests open-ended: categories and renderers are strings, not closed enums.
- Every production specimen must run independently, use local assets only, and include `specimen.json`, `AI.md`, and generated `ai-context.json`.
- Use the MessageChannel bridge for Catalog-to-item controls and lifecycle events.
- Keep iframe permissions manifest-driven and default-deny; do not add `allow-same-origin` to item frames.
- Run `npm run build`, `npm run test:components`, and `npm run test:e2e` after relevant changes.
- Update the Playwright visual baseline deliberately when a representative visual change is intended.
- Do not commit `dist/`, `.generated/`, local logs, Playwright reports, or TypeScript build-info files.
