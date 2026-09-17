# Idle Clicker

A browser-based idle/incremental game. Working title, no theme locked in yet.

## Concept

Classic idle-game loop:

- **Click** to generate a primary resource.
- Spend that resource on **upgrades/generators** that produce it automatically over time (idle income), with costs that scale as you buy more.
- Periodically **prestige** (reset current progress) in exchange for a permanent multiplier currency, so each reset makes the next run faster — the genre's core replay hook.
- **Offline progress**: resource accumulates (at a reduced rate) while the tab/app is closed, calculated from elapsed time on return.

No art/asset pipeline planned for the MVP — numbers, simple bars, and CSS drive the presentation. Visual theme (space mining, bakery, medieval kingdom, etc.) can be picked once the core loop is fun to play.

## Why this project

Built as a follow-up to [Calculator Suite](https://github.com/satautiv/Calculations), which was rejected from AdSense for "low value content" (thin, templated per-calculator pages with minimal unique text or engagement). Idle games are a better structural fit for ad monetization:

- The genre is built around long sessions and repeat visits — direct evidence of "genuine user interest," which was the missing signal last time.
- Ad formats (rewarded video for a temporary boost, an ad-supported "collect offline earnings 2x" prompt) fit naturally into the mechanic instead of being bolted on.
- The game logic (resource math, cost curves, save state) is systems/logic-heavy rather than art-heavy, which suits a backend-leaning skill set.

## Tech direction (proposed, not final)

Mirroring the calculator suite's approach where it makes sense:

- Static site, no framework — plain HTML/CSS/JS, deployable to GitHub Pages.
- Pure game-logic functions (resource math, cost scaling, offline-progress calculation, save-state shape) in a dependency-free module, unit-tested with Jest — same split as `calc-lib.js`/`calculators.js` in the calculator suite.
- DOM wiring/rendering kept separate from game logic.
- `localStorage` for save state (no backend).
- PWA (installable, offline-capable) as a later phase, not MVP.

## Status

Pre-implementation. See the repo's [issues](https://github.com/satautiv/idle-clicker/issues) for the build plan — nothing has been coded yet.
