// Pure game-state functions, shared between the browser (plain <script> include)
// and Node-based tests (via the CommonJS export guard below).

const CLICK_YIELD = 1;

function createInitialState() {
  return { gold: 0 };
}

function click(state) {
  return { ...state, gold: state.gold + CLICK_YIELD };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CLICK_YIELD,
    createInitialState,
    click,
  };
}
