# Local static assets (SW Forge)

PNG and other binaries served from the same origin as the site (`/assets/...`).

## Update (Phase B bundle)

```bash
node tools/fetch-static-bundle.mjs
```

Writes:

- `elements/` — fire, water, wind, light, dark
- `runes/sets/` — rune set icons (keys match `runeSetImageUrl()`)
- `artifacts/` — artifact type icons
- `ui/devilmon.png`

Manifest: `data/static-manifest.json`.

## Skill icons (Phase D, ~4k PNG)

```bash
npm run fetch:skills-icons
```

Writes `assets/skills/*.png` and `data/skills-icons-manifest.json`.  
Until the manifest lists a file, the app loads icons from SWARFARM (or your Worker proxy).  
Resume: re-run the same command (existing files are skipped).

## Leader skill tiles

```bash
npm run fetch:leader-icons
```

Writes `assets/skills/leader/*.png` and `data/leader-icons-manifest.json`. Until listed, leader tiles load from SWARFARM/proxy.

## Monster portraits (Phase E)

```bash
npm run fetch:monsters-portraits
```

Requires schema 2 `data/monsters-index.json`. Writes `assets/monsters/*.png` and `data/monsters-portraits-manifest.json`.

## Already local

- `relics/` — manual PNGs per relic type (see project docs)
- `gsap.min.js` — GSAP 3.12.7 animation library (loaded in `index.html`, no CDN dependency)

## Code

`js/data/local-assets.js` — `SWRM_LOCAL_ASSETS.preferLocal(category, filename)`  
Wired in `monster-db.js`, `gear/icons.js`, `skill-db.js` (skills/icons when files exist).

Attribution: assets originate from [SWARFARM](https://swarfarm.com); Com2uS owns game IP.

## All bundles (maintainer)

```bash
npm run fetch:data    # skills-index + monsters-index (schema 2)
npm run fetch:assets  # static + skill + leader + portrait PNGs + manifests
```

## Missing PNGs (SWARFARM CDN 404)

Some `icon_filename` values in the API/index have **no file on SWARFARM** (HTTP 404). Retry does not help.

```bash
npm run diagnose:missing-assets   # report + data/missing-assets-report.json
npm run fetch:missing-assets      # copy nearest existing skill icon where possible
```

Skill substitutes are recorded in `data/skill-icon-overrides.json`. Portraits with no CDN file keep SWARFARM fallback (or placeholder in UI).

## Strict local-only mode

In `js/core/meta.js` set `SWRM_LOCAL_ASSETS_ONLY = true` to disable SWARFARM CDN and runtime API (dev / after full deploy only).
