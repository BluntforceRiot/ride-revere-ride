# Ride, Revere, Ride v0.4 Visual Integration Handoff

Package created: 2026-06-17 05:12:17

This package contains the art/reference set and a paste-ready Codex prompt for the next build: **v0.4 Visual Integration Prototype**.

## What this package is

This is a visual bible plus handoff bundle, not a final sprite atlas. Most images are concept boards, UI mockups, and reference sheets. Codex should preserve them under `docs/art-reference/`, then crop/derive/create first-pass runtime assets under `public/assets/`.

## Best next move

1. Copy/extract this package into or near the `ride-revere-ride` repo.
2. Give Codex the full text from:
   `CODEX_PROMPT_RIDE_REVERE_RIDE_V04_VISUAL_INTEGRATION.txt`
3. Let Codex integrate a v0.4 visual prototype.
4. Review screenshots before doing any final polish.

## Visual direction locked

- 16-bit/SNES-like retro arcade style.
- Moonlit colonial road.
- Parchment, wood, iron, lantern glow.
- Warm alert-state windows and broadsides.
- Player/enemy silhouettes must be readable at small size.
- Funny historical parody, but no direct Paperboy naming/assets.
- Hemp farm is historical working-farm scenery with one subtle leaf-stamped crate/bale.

## Target state rules

Unwarned buildings should be mostly dark, with maybe porch/front lanterns. Warned buildings should light up and show posted broadsides/signs.

- House: porch lantern on before; all/many windows on after.
- Tavern: dim/quiet before; lively, lit, signs/broadsides after.
- Church: dim before; bell tower/window glow after.
- Blacksmith: dim forge before; bright forge and posted signs after.
- Militia post: sign should read `LIBERTY OR DEATH MILITIA`.

## Included docs

- `CODEX_PROMPT_RIDE_REVERE_RIDE_V04_VISUAL_INTEGRATION.txt`
- `ASSET_MANIFEST.md`
- `asset_manifest.json`
- categorized PNG reference folders
- empty `public_assets_target/` folder structure showing desired runtime asset organization
