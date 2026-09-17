// Pure game-state functions, shared between the browser (plain <script> include)
// and Node-based tests (via the CommonJS export guard below).

const CLICK_YIELD = 1;

// Generator tiers per GAME_DESIGN.md.
const GENERATORS = [
  { id: 'worker', name: 'Worker', baseCost: 10, growthRate: 1.15, production: 1 },
  { id: 'farm', name: 'Farm', baseCost: 100, growthRate: 1.15, production: 8 },
  { id: 'mine', name: 'Mine', baseCost: 1100, growthRate: 1.15, production: 47 },
];

function createInitialState() {
  const generators = {};
  GENERATORS.forEach((generator) => {
    generators[generator.id] = 0;
  });
  return { gold: 0, generators };
}

function click(state) {
  return { ...state, gold: state.gold + CLICK_YIELD };
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

function totalProductionPerSecond(state) {
  return GENERATORS.reduce(
    (sum, generator) => sum + generator.production * state.generators[generator.id],
    0
  );
}

function tick(state, elapsedSeconds = 1) {
  return { ...state, gold: state.gold + totalProductionPerSecond(state) * elapsedSeconds };
}

function serializeState(state) {
  return JSON.stringify({
    gold: state.gold,
    generators: state.generators,
    lastSavedAt: Date.now(),
  });
}

function isValidSavePayload(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  if (typeof candidate.gold !== 'number') return false;
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
      state: { gold: parsed.gold, generators: { ...parsed.generators } },
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
    createInitialState,
    click,
    generatorCost,
    canAffordGenerator,
    buyGenerator,
    totalProductionPerSecond,
    tick,
    serializeState,
    deserializeState,
  };
}
