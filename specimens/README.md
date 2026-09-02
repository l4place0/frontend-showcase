# Specimen author sources

`catalog.mjs` is the source registry for the current 64 specimens: 30 portfolio themes, 30 portfolio layouts, one CSS animation, and three WebGL items. Categories and renderers remain open protocol strings; these counts describe the current catalog, not a closed enum.

Theme and layout specimens combine one author stylesheet with the shared portfolio fixture in `src/template.html`, `src/base.css`, and `shared/portfolio/bridge.js`. Self-contained items own a directory under `items/`; items with module graphs can declare a build-time bundle in the catalog.

Every catalog id has a matching Learning Contract v1 source at `learning/items/<id>.json`. Source validation binds tutorial snippets to allowed author files and SHA-256 digests.

The build writes each item to `.generated/public/items/<id>/` with `index.html`, local assets, `thumbnail.webp`, `specimen.json`, `learning.json`, `AI.md`, and `ai-context.json`. Generated directories are never author sources and must not be edited directly.

See the [architecture content model](../docs/architecture/content-learning-and-ai.md) and [Specimen authoring workflow](../docs/workflows/v1/06-specimen-authoring.md) for the maintained contract.
