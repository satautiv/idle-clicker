// DOM wiring/rendering. Game math lives in game-lib.js; this file only reads
// state and updates the page.

const SAVE_KEY = 'idle-clicker-save';
const SAVE_INTERVAL_MS = 5000;

const savedJson = localStorage.getItem(SAVE_KEY);
const loaded = savedJson ? deserializeState(savedJson) : null;
let state = loaded ? loaded.state : createInitialState();

function save() {
  localStorage.setItem(SAVE_KEY, serializeState(state));
}

function showOfflineSummary(earned) {
  document.getElementById('offline-summary-text').textContent =
    `While you were away, you earned ${Math.floor(earned)} Gold.`;
  document.getElementById('offline-summary').hidden = false;
}

if (loaded) {
  const elapsedSeconds = (Date.now() - loaded.lastSavedAt) / 1000;
  const { state: nextState, earned } = applyOfflineProgress(state, elapsedSeconds);
  state = nextState;
  if (earned > 0) showOfflineSummary(earned);
}

function render() {
  document.getElementById('gold-display').textContent = `Gold: ${state.gold}`;
  renderGenerators();
  renderPrestige();
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

function renderPrestige() {
  const payout = prestigeShardsForLifetimeGold(state.lifetimeGold);
  document.getElementById('prestige-shards').textContent =
    `Prestige Shards: ${state.prestigeShards} (+${Math.round((prestigeMultiplier(state) - 1) * 100)}% production)`;
  document.getElementById('prestige-payout').textContent =
    `Prestige now for +${payout} Shard${payout === 1 ? '' : 's'}`;
  document.getElementById('prestige-button').disabled = !canPrestige(state);
}

function handleClick() {
  state = click(state);
  render();
}

function handlePrestigeClick() {
  if (!canPrestige(state)) return;
  const payout = prestigeShardsForLifetimeGold(state.lifetimeGold);
  const confirmed = window.confirm(
    `Prestige now? This resets your Gold and generators in exchange for ` +
      `${payout} Prestige Shard${payout === 1 ? '' : 's'} ` +
      `(permanent +${payout * 2}% production). This cannot be undone.`
  );
  if (!confirmed) return;
  state = prestige(state);
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
document.getElementById('dismiss-offline-summary').addEventListener('click', () => {
  document.getElementById('offline-summary').hidden = true;
});
document.getElementById('prestige-button').addEventListener('click', handlePrestigeClick);

setInterval(() => {
  state = tick(state, 1);
  render();
}, 1000);

setInterval(save, SAVE_INTERVAL_MS);
window.addEventListener('beforeunload', save);

render();
