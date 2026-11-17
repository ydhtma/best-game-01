// Lumen Keep — the wave director.
// One clear job: turn a wave number into a spawn queue, feed it out over
// time, and say when the wave is cleared. The boss wave is wave 10.
import { FINAL_WAVE, WAVES } from './config.js';
import { queueEnemy, spawnBoss, spawnEnemyForWave } from './entities.js';
import { range } from './random.js';

export function startWave(state, wave, sfx) {
  state.wave = wave;
  state.spawnQueue = [];
  state.bossSpawned = false;
  state.bossWarned = false;
  const def = WAVES[wave];
  if (!def) return;
  if (def.boss) {
    spawnBoss(state);
    state.banner = { text: 'WAVE 10 — THE VOID MAW', sub: 'Slay it. End the night.', t: 3.2 };
    if (sfx) sfx.boss();
    return;
  }
  const kinds = [];
  for (let i = 0; i < def.motes; i += 1) kinds.push('mote');
  for (let i = 0; i < def.darters; i += 1) kinds.push('darter');
  for (let i = 0; i < def.splitters; i += 1) kinds.push('splitter');
  for (let i = 0; i < def.spitters; i += 1) kinds.push('spitter');
  // Shuffle the queue so the wave never arrives in kind order.
  for (let i = kinds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(state.rng() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  for (const kind of kinds) queueEnemy(state, kind);
  state.spawnTimer = 0.6;
  state.banner = { text: `WAVE ${wave}`, sub: waveSub(wave), t: 2.4 };
  if (sfx) sfx.waveHorn();
}

function waveSub(wave) {
  if (wave === 1) return 'They come for the light. Hold the line.';
  if (wave === 3) return 'Splitters ahead — they break in two.';
  if (wave === 4) return 'Spitters keep their distance. Close in.';
  if (wave === 7) return 'The dark is getting bolder.';
  if (wave === 9) return 'One more wave. Then the Maw.';
  return 'Hold the light.';
}

// Feed the queue; returns true while anything is still spawning.
export function stepSpawner(state, dt) {
  const def = WAVES[state.wave];
  if (!def || def.boss) return;
  if (state.spawnQueue.length === 0) return;
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    state.spawnTimer = def.interval * range(state.rng, 0.85, 1.15);
    const kind = state.spawnQueue.shift();
    spawnEnemyForWave(state, kind);
  }
}

export function waveCleared(state) {
  if (state.wave === FINAL_WAVE) {
    return state.bossSpawned && !state.enemies.some((e) => e.kind === 'boss');
  }
  return state.spawnQueue.length === 0 && state.enemies.length === 0;
}

export function isFinalWave(state) {
  return state.wave === FINAL_WAVE;
}
