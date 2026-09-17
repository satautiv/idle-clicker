# Game Design & Balance (v0)

Concrete starting numbers for the mechanics described in the README, filled in for issues #3, #5, #6, and #7. Everything here is a **placeholder, chosen to be reasonable and easy to retune** once the game is actually playable — not a final balance pass. Names are generic since no visual theme is locked in yet; retheme freely later (a "Worker" becomes a "Miner" or "Baker" without changing the numbers).

## Resource

- Single resource: **Gold**.
- Click produces **+1 Gold** per click (issue #2). No click upgrades in the MVP — that can be a later addition, not blocking any of the current 11 issues.

## Generators (issue #3)

Three tiers for the MVP — enough to make cost-scaling and production-rate stacking meaningful without needing full theme content:

| Tier | Name (placeholder) | Base cost | Cost growth rate | Production (Gold/sec, each) |
|---|---|---|---|---|
| 1 | Worker | 10 | 1.15 | 1 |
| 2 | Farm | 100 | 1.15 | 8 |
| 3 | Mine | 1,100 | 1.15 | 47 |

- Cost of the Nth unit of a tier: `cost = baseCost * growthRate ^ owned` (owned = count already bought of that tier, 0-indexed).
- Growth rate 1.15 and the ~10x cost / ~8x production ratio between tiers are standard idle-game constants (same growth rate Cookie Clicker uses) — a safe, well-tested default rather than something to derive from scratch.
- Production ticks once per second (per issue #3's spec), summed across all owned generators of all tiers.

## Offline progress (issue #5)

- Offline rate: **50%** of the production rate active at the moment the tab was closed.
- Cap: **8 hours** (28,800 seconds) of accumulation for the MVP, to avoid absurd first-test numbers from a save left for days. Revisit/remove the cap once the game has more content to justify longer offline value.
- `earnedAmount = min(elapsedSeconds, 28800) * productionRate * 0.5`

## Prestige (issue #6)

- Prestige currency: **Prestige Shards** (placeholder name).
- Payout on reset: `prestigeShards = floor(sqrt(totalLifetimeGold / 1_000_000))`.
- Effect: each Prestige Shard owned gives **+2% permanent production multiplier**, applied as `totalMultiplier = 1 + 0.02 * totalShardsOwned` to the sum of all generator production (not to click income).
- Prestige is only worth doing (payout ≥ 1) once lifetime Gold reaches 1,000,000 — no artificial gate needed beyond the formula itself naturally returning 0 before that point.

## Number formatting (issue #7)

Standard suffix notation, 2 decimal places once suffixed:

| Range | Suffix |
|---|---|
| < 1,000 | raw integer |
| ≥ 1e3 | K |
| ≥ 1e6 | M |
| ≥ 1e9 | B |
| ≥ 1e12 | T |
| ≥ 1e15 | Qa (Quadrillion) |
| ≥ 1e18 | Qi (Quintillion) |
| ≥ 1e21 | scientific notation (`1.23e21`) |

## Explicitly out of scope for v0

Not designed here, and not blocking any of issues #1–#11 — revisit later:
- Visual theme / renamed resource & generator flavor text.
- Click upgrades / multiple resources.
- Achievements, offline-cap removal, or additional prestige layers.
