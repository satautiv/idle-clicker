// DOM wiring/rendering. Game math lives in game-lib.js; this file only reads
// state and updates the page.

let state = createInitialState();

function render() {
  document.getElementById('gold-display').textContent = `Gold: ${state.gold}`;
}

function handleClick() {
  state = click(state);
  render();
}

document.getElementById('click-button').addEventListener('click', handleClick);
render();
