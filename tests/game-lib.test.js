const {
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
  formatNumber,
  serializeState,
  deserializeState,
} = require('../js/game-lib');

test('createInitialState starts at zero gold with no generators or prestige', () => {
  expect(createInitialState()).toEqual({
    gold: 0,
    lifetimeGold: 0,
    generators: { worker: 0, farm: 0, mine: 0 },
    prestigeShards: 0,
  });
});

test('click increments gold and lifetimeGold by CLICK_YIELD', () => {
  const state = createInitialState();
  const next = click(state);
  expect(next.gold).toBe(CLICK_YIELD);
  expect(next.lifetimeGold).toBe(CLICK_YIELD);
});

test('click does not mutate the original state', () => {
  const state = createInitialState();
  click(state);
  expect(state.gold).toBe(0);
});

test('click accumulates across multiple calls', () => {
  let state = createInitialState();
  state = click(state);
  state = click(state);
  state = click(state);
  expect(state.gold).toBe(3 * CLICK_YIELD);
});

test('generatorCost grows with owned count per the growth rate', () => {
  expect(generatorCost('worker', 0)).toBe(10);
  expect(generatorCost('worker', 1)).toBe(Math.ceil(10 * 1.15));
  expect(generatorCost('worker', 2)).toBe(Math.ceil(10 * 1.15 ** 2));
});

test('canAffordGenerator reflects current gold vs next cost', () => {
  const state = { ...createInitialState(), gold: 9 };
  expect(canAffordGenerator(state, 'worker')).toBe(false);
  expect(canAffordGenerator({ ...state, gold: 10 }, 'worker')).toBe(true);
});

test('buyGenerator deducts cost and increments owned count when affordable', () => {
  const state = { ...createInitialState(), gold: 10 };
  const next = buyGenerator(state, 'worker');
  expect(next.gold).toBe(0);
  expect(next.generators.worker).toBe(1);
});

test('buyGenerator is a no-op when unaffordable', () => {
  const state = { ...createInitialState(), gold: 5 };
  const next = buyGenerator(state, 'worker');
  expect(next).toEqual(state);
});

test('prestigeMultiplier is 1 with no shards and grows 2% per shard', () => {
  expect(prestigeMultiplier(createInitialState())).toBe(1);
  expect(prestigeMultiplier({ ...createInitialState(), prestigeShards: 5 })).toBe(
    1 + 5 * PRESTIGE_MULTIPLIER_PER_SHARD
  );
});

test('totalProductionPerSecond sums production across owned generators', () => {
  const state = { ...createInitialState(), generators: { worker: 2, farm: 1, mine: 0 } };
  expect(totalProductionPerSecond(state)).toBe(2 * 1 + 1 * 8 + 0 * 47);
});

test('totalProductionPerSecond applies the prestige multiplier', () => {
  const state = {
    ...createInitialState(),
    generators: { worker: 2, farm: 0, mine: 0 },
    prestigeShards: 10,
  };
  expect(totalProductionPerSecond(state)).toBe(2 * 1 * (1 + 10 * PRESTIGE_MULTIPLIER_PER_SHARD));
});

test('tick adds production * elapsedSeconds to gold and lifetimeGold', () => {
  const state = { ...createInitialState(), gold: 100, generators: { worker: 2, farm: 0, mine: 0 } };
  const next = tick(state, 3);
  expect(next.gold).toBe(100 + 2 * 1 * 3);
  expect(next.lifetimeGold).toBe(2 * 1 * 3);
});

test('tick defaults to a 1-second interval', () => {
  const state = { ...createInitialState(), generators: { worker: 1, farm: 0, mine: 0 } };
  expect(tick(state).gold).toBe(1);
});

test('GENERATORS exposes exactly the three v0 tiers', () => {
  expect(GENERATORS.map((generator) => generator.id)).toEqual(['worker', 'farm', 'mine']);
});

test('offlineProgress applies OFFLINE_RATE to production over elapsed time', () => {
  const state = { ...createInitialState(), generators: { worker: 2, farm: 0, mine: 0 } };
  expect(offlineProgress(state, 100)).toBe(2 * 100 * OFFLINE_RATE);
});

test('offlineProgress caps elapsed time at OFFLINE_CAP_SECONDS', () => {
  const state = { ...createInitialState(), generators: { worker: 1, farm: 0, mine: 0 } };
  const wayOverCap = OFFLINE_CAP_SECONDS + 100000;
  expect(offlineProgress(state, wayOverCap)).toBe(1 * OFFLINE_CAP_SECONDS * OFFLINE_RATE);
});

test('offlineProgress earns nothing with no generators owned', () => {
  expect(offlineProgress(createInitialState(), 3600)).toBe(0);
});

test('applyOfflineProgress adds earned gold to gold and lifetimeGold', () => {
  const state = { ...createInitialState(), gold: 10, generators: { worker: 1, farm: 0, mine: 0 } };
  const { state: next, earned } = applyOfflineProgress(state, 10);
  expect(earned).toBe(1 * 10 * OFFLINE_RATE);
  expect(next.gold).toBe(10 + earned);
  expect(next.lifetimeGold).toBe(earned);
});

test('applyOfflineProgress with zero elapsed time earns nothing', () => {
  const state = { ...createInitialState(), gold: 5, generators: { worker: 1, farm: 0, mine: 0 } };
  const { state: next, earned } = applyOfflineProgress(state, 0);
  expect(earned).toBe(0);
  expect(next.gold).toBe(5);
});

test('prestigeShardsForLifetimeGold follows floor(sqrt(lifetimeGold / divisor))', () => {
  expect(prestigeShardsForLifetimeGold(0)).toBe(0);
  expect(prestigeShardsForLifetimeGold(PRESTIGE_SHARD_DIVISOR)).toBe(1);
  expect(prestigeShardsForLifetimeGold(4 * PRESTIGE_SHARD_DIVISOR)).toBe(2);
  expect(prestigeShardsForLifetimeGold(PRESTIGE_SHARD_DIVISOR - 1)).toBe(0);
});

test('canPrestige is false below one shard\'s worth of lifetime gold', () => {
  const state = { ...createInitialState(), lifetimeGold: PRESTIGE_SHARD_DIVISOR - 1 };
  expect(canPrestige(state)).toBe(false);
});

test('canPrestige is true once lifetime gold pays out at least one shard', () => {
  const state = { ...createInitialState(), lifetimeGold: PRESTIGE_SHARD_DIVISOR };
  expect(canPrestige(state)).toBe(true);
});

test('prestige is a no-op below the payout threshold', () => {
  const state = { ...createInitialState(), lifetimeGold: 100, gold: 50 };
  expect(prestige(state)).toEqual(state);
});

test('prestige resets gold/lifetimeGold/generators and adds earned shards', () => {
  const state = {
    gold: 500,
    lifetimeGold: 4 * PRESTIGE_SHARD_DIVISOR,
    generators: { worker: 5, farm: 2, mine: 1 },
    prestigeShards: 3,
  };
  const next = prestige(state);
  expect(next).toEqual({
    gold: 0,
    lifetimeGold: 0,
    generators: { worker: 0, farm: 0, mine: 0 },
    prestigeShards: 3 + 2,
  });
});

test('formatNumber returns raw integers below 1000', () => {
  expect(formatNumber(0)).toBe('0');
  expect(formatNumber(999)).toBe('999');
});

test('formatNumber applies suffixes at each tier threshold', () => {
  expect(formatNumber(1000)).toBe('1.00K');
  expect(formatNumber(1500000)).toBe('1.50M');
  expect(formatNumber(2500000000)).toBe('2.50B');
  expect(formatNumber(3200000000000)).toBe('3.20T');
  expect(formatNumber(4100000000000000)).toBe('4.10Qa');
  expect(formatNumber(5300000000000000000)).toBe('5.30Qi');
});

test('formatNumber switches to scientific notation at 1e21', () => {
  expect(formatNumber(1e21)).toBe('1.00e21');
  expect(formatNumber(1.23e21)).toBe('1.23e21');
});

test('formatNumber preserves a leading minus sign', () => {
  expect(formatNumber(-1500)).toBe('-1.50K');
});

test('serializeState/deserializeState round-trips the full state shape', () => {
  const state = {
    gold: 42,
    lifetimeGold: 1234,
    generators: { worker: 3, farm: 1, mine: 0 },
    prestigeShards: 2,
  };
  const { state: restored } = deserializeState(serializeState(state));
  expect(restored).toEqual(state);
});

test('serializeState embeds a lastSavedAt timestamp', () => {
  const before = Date.now();
  const { lastSavedAt } = deserializeState(serializeState(createInitialState()));
  expect(typeof lastSavedAt).toBe('number');
  expect(lastSavedAt).toBeGreaterThanOrEqual(before);
});

test('deserializeState falls back to a fresh state on invalid JSON', () => {
  const { state } = deserializeState('not json');
  expect(state).toEqual(createInitialState());
});

test('deserializeState falls back to a fresh state on a malformed save shape', () => {
  const { state } = deserializeState(JSON.stringify({ foo: 'bar' }));
  expect(state).toEqual(createInitialState());
});

test('deserializeState falls back to a fresh state when a generator tier is missing', () => {
  const { state } = deserializeState(
    JSON.stringify({
      gold: 5,
      lifetimeGold: 5,
      generators: { worker: 1 },
      prestigeShards: 0,
      lastSavedAt: Date.now(),
    })
  );
  expect(state).toEqual(createInitialState());
});

test('deserializeState falls back to a fresh state when prestigeShards is missing', () => {
  const { state } = deserializeState(
    JSON.stringify({
      gold: 5,
      lifetimeGold: 5,
      generators: { worker: 1, farm: 0, mine: 0 },
      lastSavedAt: Date.now(),
    })
  );
  expect(state).toEqual(createInitialState());
});
