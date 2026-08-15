# Specimen Protocol v1

`catalog.mjs` is the source registry for the first 60 specimens. The current
items use the shared portfolio fixture rather than duplicating its large HTML
template. `scripts/build-specimens.mjs` combines the fixture with one theme or
layout stylesheet and writes self-contained items to `.generated/public/items`.

Each built item includes `index.html`, `specimen.json`, `AI.md`, and
`ai-context.json`. The HTML also embeds the manifest discovery links and the
MessageChannel bridge required by the React viewer.
