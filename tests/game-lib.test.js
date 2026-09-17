const { CLICK_YIELD, createInitialState, click } = require('../js/game-lib');

test('createInitialState starts at zero gold', () => {
  expect(createInitialState()).toEqual({ gold: 0 });
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
