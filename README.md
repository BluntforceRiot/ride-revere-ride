# Ride, Revere, Ride!

Ride through a moonlit colonial route, throw broadsides, dodge loyalist hazards, and wake the town before dawn.

`v0.9.2` is a one-level retro arcade score-attack polish prototype built with Phaser, Vite, and TypeScript. Paul Revere stays fixed near the left side of the road while targets, hazards, and scenery scroll in from the right.

## Browser Demo

This is a static browser game. Once GitHub Pages is enabled and the deploy workflow has run, players can play directly in the browser at the repository's GitHub Pages demo URL, typically:

```text
https://bluntforceriot.github.io/ride-revere-ride/
```

No download, backend, account, or online leaderboard is required for normal play.

## Run

```sh
npm install
npm run dev
```

The dev server uses the Phaser Vite template default of `http://localhost:8080`.

## Build

```sh
npm run typecheck
npm run build
```

## Preview

```sh
npm run preview
```

The default scripts call Vite directly and do not use the Phaser template telemetry/log helper.

## Controls

- Arrow keys or WASD: move lanes
- Space: throw broadside
- Enter or Space: start / play again
- H from title: open high scores
- I or ? from title: show how to play
- M: mute or unmute generated audio cues
- Escape or S from game over: skip score save
- T or Escape from high scores: return to title
- R from high scores: press once to arm local reset, then press again within 3 seconds to clear local scores
- F3: development-only debug hitbox/label toggle

## Scoring

- Successful deliveries are worth 100 points times the active combo multiplier.
- Combo 1-2 is x1, 3-5 is x2, 6-9 is x3, and 10+ is x4.
- Hazard collisions reset combo.
- Missed random broadsides do not reset combo. Combo resets when an unwarned target leaves the screen, so the penalty is tied to the missed delivery objective.
- Successful deliveries raise the alarm meter by 12.
- Alarm thresholds at 50, 80, and 100 show milestone text and briefly flash the alarm meter.

## High Scores

High scores are local browser storage only. No backend or online leaderboard is included.

- High-score key: `ride-revere-ride.highScores.v1`
- Audio mute key: `ride-revere-ride.audioMuted.v1`

## Audio

Audio is generated in code with WebAudio oscillators. No copyrighted audio files are included. Press `M` to mute or unmute; the mute preference is saved locally.

## v0.9.2 Scope

- Four scenes: `TitleScene`, `GameScene`, `GameOverScene`, and `HighScoreScene`
- Fixed 960x540 canvas target
- Four discrete lanes
- Fair wave-based spawn director with a 90-second difficulty ramp
- Combo multiplier scoring, alarm meter, stamina, and dawn timer
- Local top 10 high scores saved in browser `localStorage`
- Scripted runtime asset cleanup for transparency, padding, and active-sprite brightness
- Cleaner moonlit dirt road with quiet lane bands, compact grounding shadows, and reduced visual noise
- Public-facing target/hazard markers and oversized halos removed; debug labels/hitboxes stay behind F3
- Target buildings use attached window glow, warm sprite tint, and a small posted notice instead of a large target box
- Broadside projectile uses a tight transparent rolled-paper sprite with no rectangular backing
- Lightweight motion: Revere bob/lean/dust, broadside flutter, target/hazard idle pulses, and delivery pop effects
- Generated WebAudio cues for throws, deliveries, hazards, combo tiers, game over, and score save
- Public-demo debug visuals default off, with F3 toggle for development

## Public Demo Notes

- Built for Summer into AI Theme 1: 8-Bit America.
- This is a one-level score-attack prototype/submission candidate.
- The public demo is intended to run as a static GitHub Pages browser game.
- Final commercial art production is not included yet.
- Sprite frame animation is minimal; most motion uses Phaser transforms and small shape effects.
- High scores are local browser storage only.

## AI Usage Notes

- ChatGPT was used for game concept, design direction, art direction, and prompt/reference generation.
- Codex was used for implementation, integration, cleanup, verification, and review packaging.
- Phaser, Vite, and TypeScript power the browser game.
- Prototype art is AI-assisted concept/reference art and derived runtime sprite work, not final commercial asset production.

## GitHub Pages

This repo includes `.github/workflows/deploy.yml` for GitHub Pages deployment through GitHub Actions. In the GitHub repository settings, set Pages to deploy from GitHub Actions, then push to `main` or run the workflow manually.

The workflow runs:

```sh
npm ci
npm run typecheck
npm run build
```

It deploys the generated `dist` folder. Vite is configured with `base: './'` for project-page subpaths.

## Attribution

This project started from the Phaser Vite TypeScript template. Template attribution is preserved in `LICENSE` and `NOTICE.md`.

The v0.4 visual prototype used project-specific AI-generated concept/reference art supplied in the v0.4 art handoff package. Original references are kept in `docs/art-reference/`; cropped and cleaned runtime derivatives are kept in `public/assets/`.

No external copyrighted assets are intentionally used.
