const {
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
} = require('../js/game-lib');

test('createInitialState starts at zero gold with no generators owned', () => {
  expect(createInitialState()).toEqual({
    gold: 0,
    generators: { worker: 0, farm: 0, mine: 0 },
  });
});

test('click increments gold by CLICK_YIELD', () => {
  const state = createInitialState();
  const next = click(state);
  expect(next.gold).toBe(CLICK_YIELD);
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
  const state = { gold: 9, generators: { worker: 0, farm: 0, mine: 0 } };
  expect(canAffordGenerator(state, 'worker')).toBe(false);
  expect(canAffordGenerator({ ...state, gold: 10 }, 'worker')).toBe(true);
});

test('buyGenerator deducts cost and increments owned count when affordable', () => {
  const state = { gold: 10, generators: { worker: 0, farm: 0, mine: 0 } };
  const next = buyGenerator(state, 'worker');
  expect(next.gold).toBe(0);
  expect(next.generators.worker).toBe(1);
});

test('buyGenerator is a no-op when unaffordable', () => {
  const state = { gold: 5, generators: { worker: 0, farm: 0, mine: 0 } };
  const next = buyGenerator(state, 'worker');
  expect(next).toEqual(state);
});

test('totalProductionPerSecond sums production across owned generators', () => {
  const state = { gold: 0, generators: { worker: 2, farm: 1, mine: 0 } };
  expect(totalProductionPerSecond(state)).toBe(2 * 1 + 1 * 8 + 0 * 47);
});

test('tick adds production * elapsedSeconds to gold', () => {
  const state = { gold: 100, generators: { worker: 2, farm: 0, mine: 0 } };
  const next = tick(state, 3);
  expect(next.gold).toBe(100 + 2 * 1 * 3);
});

test('tick defaults to a 1-second interval', () => {
  const state = { gold: 0, generators: { worker: 1, farm: 0, mine: 0 } };
  expect(tick(state).gold).toBe(1);
});

test('GENERATORS exposes exactly the three v0 tiers', () => {
  expect(GENERATORS.map((generator) => generator.id)).toEqual(['worker', 'farm', 'mine']);
});

test('serializeState/deserializeState round-trips gold and generators', () => {
  const state = { gold: 42, generators: { worker: 3, farm: 1, mine: 0 } };
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
    JSON.stringify({ gold: 5, generators: { worker: 1 }, lastSavedAt: Date.now() })
  );
  expect(state).toEqual(createInitialState());
});
