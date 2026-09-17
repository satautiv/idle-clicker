// DOM wiring/rendering. Game math lives in game-lib.js; this file only reads
// state and updates the page.

let state = createInitialState();

function render() {
  document.getElementById('gold-display').textContent = `Gold: ${state.gold}`;
  renderGenerators();
}

function renderGenerators() {
  const container = document.getElementById('generators');
  container.innerHTML = '';
  GENERATORS.forEach((generator) => {
    const owned = state.generators[generator.id];
    const cost = generatorCost(generator.id, owned);
    const row = document.createElement('div');
    row.className = 'generator-row';
    row.innerHTML = `
      <span>${generator.name} (${owned} owned, ${generator.production}/s each)</span>
      <button type="button" data-generator-id="${generator.id}"${state.gold < cost ? ' disabled' : ''}>Buy for ${cost}</button>
    `;
    container.appendChild(row);
  });
}

function handleClick() {
  state = click(state);
  render();
}

function handleGeneratorsClick(event) {
  const button = event.target.closest('button[data-generator-id]');
  if (!button) return;
  state = buyGenerator(state, button.dataset.generatorId);
  render();
}

document.getElementById('click-button').addEventListener('click', handleClick);
document.getElementById('generators').addEventListener('click', handleGeneratorsClick);

setInterval(() => {
  state = tick(state, 1);
  render();
}, 1000);

render();
