# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Pre-implementation. No code exists yet — only this file and the README. The full build plan is tracked as GitHub issues (`gh issue list`), to be implemented in order (#1 → #11); each issue's body states which prior issue it depends on. Do not jump ahead of the issue sequence or add code the current issue doesn't call for.

## What this is

A browser-based idle/incremental game (Cookie Clicker-style: click loop → auto-generators → prestige/reset → offline progress). Working title "Idle Clicker," no visual theme locked in — presentation for the MVP is numbers, bars, and CSS only.

This is a follow-up to [Calculator Suite](https://github.com/satautiv/Calculations) (`satautiv/Calculations`), which was rejected from AdSense for thin/templated content. This project is deliberately shaped to generate the "genuine user interest" signal that was missing (long sessions, repeat visits) before any AdSense integration is attempted — see issue #10, which is explicitly gated on the core loop being genuinely engaging first.

## Planned architecture (per issue #1 and #2)

Once scaffolded, the codebase follows the same split used in the calculator suite:

- **`js/game-lib.js`** — pure, dependency-free game-logic functions only: resource/production math, cost-scaling curves, save-state serialize/deserialize, offline-progress calculation, prestige-payout calculation, number formatting. No DOM access. This is the module unit-tested with Jest.
- **`js/game.js`** — DOM wiring/rendering and event handlers. Calls into `game-lib.js` for all math/state logic; not unit-tested itself (per issue #6, irreversible-action UI like the prestige confirmation lives here untested).
- **`index.html` / `css/style.css`** — static shell, no framework.
- **`localStorage`** — sole persistence mechanism (no backend). Save state shape is defined by the serialize/deserialize pair in `game-lib.js`; a missing/corrupt save must fall back to a fresh game state rather than erroring.

Keep this split strictly: if a function needs to be unit-testable (cost curves, offline-progress math, prestige payout, number formatting), it belongs in `game-lib.js`, not inline in `game.js`.

## Commands

Not yet established — issue #1 sets up `package.json` with Jest and a GitHub Actions `test` job. Once that lands, the test command will be the standard `npm test`; check `package.json` scripts before assuming.

## Deployment

Static site deployed to GitHub Pages via GitHub Actions on push to `main` (issue #8), mirroring the calculator suite's `ci.yml` deploy job. PWA support (`manifest.json`, service worker) comes later (issue #9), using the calculator suite's cache-first `sw.js` pattern with a CI-injected version placeholder.
