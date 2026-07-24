# Repository instructions

- `src/` and `build.py` are the source of truth.
- Never edit generated root-level HTML directly.
- Run `npm run build` after changing source files.
- Keep the final pages self-contained and free of runtime CDN dependencies.
- A new theme requires `src/themes/<slug>.css` plus a `THEMES` entry in `build.py`.
- A new layout requires `src/layouts/<slug>.css` plus a `LAYOUTS` entry in `build.py`.
- Preserve the separate style and layout parameter stores.
- Do not commit `dist/`, local logs, or `.workbuddy/`.
