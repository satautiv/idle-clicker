// Pure game-state functions, shared between the browser (plain <script> include)
// and Node-based tests (via the CommonJS export guard below).

const CLICK_YIELD = 1;

// Generator tiers per GAME_DESIGN.md.
const GENERATORS = [
  { id: 'worker', name: 'Worker', baseCost: 10, growthRate: 1.15, production: 1 },
  { id: 'farm', name: 'Farm', baseCost: 100, growthRate: 1.15, production: 8 },
  { id: 'mine', name: 'Mine', baseCost: 1100, growthRate: 1.15, production: 47 },
];

// Prestige tuning per GAME_DESIGN.md: shards earned from lifetime gold
// (reset each prestige), each giving a permanent production multiplier.
const PRESTIGE_SHARD_DIVISOR = 1_000_000;
const PRESTIGE_MULTIPLIER_PER_SHARD = 0.02;

function createInitialState() {
  const generators = {};
  GENERATORS.forEach((generator) => {
    generators[generator.id] = 0;
  });
  return { gold: 0, lifetimeGold: 0, generators, prestigeShards: 0 };
}

function click(state) {
  return {
    ...state,
    gold: state.gold + CLICK_YIELD,
    lifetimeGold: state.lifetimeGold + CLICK_YIELD,
  };
}

function findGenerator(generatorId) {
  return GENERATORS.find((generator) => generator.id === generatorId);
}

// Ceiling, not rounding: cost should never favor the player over the formula.
function generatorCost(generatorId, owned) {
  const generator = findGenerator(generatorId);
  return Math.ceil(generator.baseCost * generator.growthRate ** owned);
}

function canAffordGenerator(state, generatorId) {
  const owned = state.generators[generatorId];
  return state.gold >= generatorCost(generatorId, owned);
}

function buyGenerator(state, generatorId) {
  if (!canAffordGenerator(state, generatorId)) return state;
  const owned = state.generators[generatorId];
  const cost = generatorCost(generatorId, owned);
  return {
    ...state,
    gold: state.gold - cost,
    generators: { ...state.generators, [generatorId]: owned + 1 },
  };
}

function prestigeMultiplier(state) {
  return 1 + PRESTIGE_MULTIPLIER_PER_SHARD * state.prestigeShards;
}

// Prestige multiplier applies to generator production only, not clicks.
function totalProductionPerSecond(state) {
  const baseProduction = GENERATORS.reduce(
    (sum, generator) => sum + generator.production * state.generators[generator.id],
    0
  );
  return baseProduction * prestigeMultiplier(state);
}

function tick(state, elapsedSeconds = 1) {
  const earned = totalProductionPerSecond(state) * elapsedSeconds;
  return {
    ...state,
    gold: state.gold + earned,
    lifetimeGold: state.lifetimeGold + earned,
  };
}

// Offline-progress tuning per GAME_DESIGN.md: half the normal production
// rate, capped at 8 hours of accumulation.
const OFFLINE_RATE = 0.5;
const OFFLINE_CAP_SECONDS = 8 * 60 * 60;

function offlineProgress(state, elapsedSeconds) {
  const cappedSeconds = Math.min(elapsedSeconds, OFFLINE_CAP_SECONDS);
  return totalProductionPerSecond(state) * cappedSeconds * OFFLINE_RATE;
}

function applyOfflineProgress(state, elapsedSeconds) {
  const earned = offlineProgress(state, elapsedSeconds);
  return {
    state: {
      ...state,
      gold: state.gold + earned,
      lifetimeGold: state.lifetimeGold + earned,
    },
    earned,
  };
}

function prestigeShardsForLifetimeGold(lifetimeGold) {
  return Math.floor(Math.sqrt(lifetimeGold / PRESTIGE_SHARD_DIVISOR));
}

// Only worth doing once it would pay out at least one shard.
function canPrestige(state) {
  return prestigeShardsForLifetimeGold(state.lifetimeGold) >= 1;
}

function prestige(state) {
  if (!canPrestige(state)) return state;
  const earnedShards = prestigeShardsForLifetimeGold(state.lifetimeGold);
  return {
    ...createInitialState(),
    prestigeShards: state.prestigeShards + earnedShards,
  };
}

function serializeState(state) {
  return JSON.stringify({
    gold: state.gold,
    lifetimeGold: state.lifetimeGold,
    generators: state.generators,
    prestigeShards: state.prestigeShards,
    lastSavedAt: Date.now(),
  });
}

function isValidSavePayload(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  if (typeof candidate.gold !== 'number') return false;
  if (typeof candidate.lifetimeGold !== 'number') return false;
  if (typeof candidate.prestigeShards !== 'number') return false;
  if (typeof candidate.lastSavedAt !== 'number') return false;
  if (!candidate.generators || typeof candidate.generators !== 'object') return false;
  return GENERATORS.every(
    (generator) => typeof candidate.generators[generator.id] === 'number'
  );
}

// Returns { state, lastSavedAt }. Falls back to a fresh state (and the
// current time) on missing/corrupt/malformed input rather than throwing.
function deserializeState(json) {
  try {
    const parsed = JSON.parse(json);
    if (!isValidSavePayload(parsed)) throw new Error('invalid save shape');
    return {
      state: {
        gold: parsed.gold,
        lifetimeGold: parsed.lifetimeGold,
        generators: { ...parsed.generators },
        prestigeShards: parsed.prestigeShards,
      },
      lastSavedAt: parsed.lastSavedAt,
    };
  } catch (error) {
    return { state: createInitialState(), lastSavedAt: Date.now() };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CLICK_YIELD,
    GENERATORS,
    PRESTIGE_SHARD_DIVISOR,
    PRESTIGE_MULTIPLIER_PER_SHARD,
    createInitialState,
    click,
    generatorCost,
    canAffordGenerator,
    buyGenerator,
    prestigeMultiplier,
    totalProductionPerSecond,
    tick,
    OFFLINE_RATE,
    OFFLINE_CAP_SECONDS,
    offlineProgress,
    applyOfflineProgress,
    prestigeShardsForLifetimeGold,
    canPrestige,
    prestige,
    serializeState,
    deserializeState,
  };
}
