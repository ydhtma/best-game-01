// Lumen Keep — boot, the game loop, and the mode machine.
// One clear job: own the canvas, the clock and the transitions between
// title, play, upgrade, win, over and paused. The rules live in
// entities.js and waves.js; the pictures in render.js; the sound in
// audio.js. A ?shot=start|play|end|win URL renders one screenshot scene
// instead of starting the loop, using the same code a player runs.
import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { newState, stepPlay } from './entities.js';
import { createInput } from './input.js';
import { makeRng } from './random.js';
import { makeShot, selfTest } from './shots.js';
import { makeStars, render } from './render.js';
import { applyUpgrade, offerUpgrades } from './upgrades.js';
import { isFinalWave, startWave, stepSpawner, waveCleared } from './waves.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : (Date.now() % 2147483647);
const rng = makeRng(seed);
const stars = makeStars(makeRng(seed ^ 0x9e3779b9));
const input = createInput(canvas);
const audio = createAudio();

let best = 0;
try {
  best = Number(window.localStorage.getItem('lumen-keep-best') || 0) || 0;
} catch {
  best = 0;
}

function saveBest(score) {
  if (score <= best) return;
  best = score;
  try {
    window.localStorage.setItem('lumen-keep-best', String(best));
  } catch {
    // Storage unavailable: the best score just lives for this session.
  }
}

// A screenshot scene: build it, draw it once, and say so in the title.
const shot = params.get('shot');
if (shot) {
  const state = makeShot(shot, seed);
  if (state) {
    state.upgradeHover = -1;
    render(ctx, state, stars, best);
    document.title = 'shot-ready';
  } else {
    document.title = 'shot-unknown';
  }
} else if (params.get('selftest')) {
  // Headless balance check: ?selftest=1 reports whether the autopilot
  // can beat the game, in the title, for the local test script to read.
  const result = selfTest(seed);
  document.title = `selftest ${JSON.stringify(result)}`;
  const pre = document.createElement('pre');
  pre.id = 'selftest';
  pre.textContent = JSON.stringify(result, null, 2);
  document.body.appendChild(pre);
} else {
  runGame();
}

function runGame() {
  const state = newState(rng, seed);
  state.mode = 'title';
  let last = performance.now();

  function startGame() {
    const fresh = newState(makeRng((Date.now() % 2147483647) || 1), seed);
    Object.assign(state, fresh);
    state.mode = 'play';
    audio.unlock();
    audio.startMusic();
    startWave(state, 1, audio);
  }

  function endGame(reason) {
    state.mode = 'over';
    state.over = reason;
    state.banner = null;
    saveBest(state.score);
    audio.lose();
  }

  function winGame() {
    state.mode = 'win';
    state.banner = null;
    saveBest(state.score);
    audio.win();
  }

  function chooseUpgrade(index) {
    const offer = state.upgradeOffer;
    if (!offer || index < 0 || index >= offer.length) return;
    applyUpgrade(state, offer[index]);
    state.upgradeOffer = null;
    audio.upgrade();
    startWave(state, state.wave + 1, audio);
    state.mode = 'play';
  }

  // Mouse: clicking the title starts; clicking a card picks it.
  canvas.addEventListener('click', () => {
    audio.unlock();
    audio.startMusic();
    if (state.mode === 'title') {
      startGame();
      return;
    }
    if (state.mode === 'upgrade' && state.upgradeOffer) {
      const cardW = 300;
      const gap = 36;
      const total = state.upgradeOffer.length * cardW + (state.upgradeOffer.length - 1) * gap;
      let x = 640 - total / 2;
      const y = 230;
      const h = 300;
      for (let i = 0; i < state.upgradeOffer.length; i += 1) {
        if (input.mouseX >= x && input.mouseX <= x + cardW && input.mouseY >= y && input.mouseY <= y + h) {
          chooseUpgrade(i);
          return;
        }
        x += cardW + gap;
      }
    }
  });

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.time += dt;

    if (input.consume('KeyM')) {
      audio.setMuted(!audio.muted);
    }

    if (state.mode === 'title') {
      // Idle drift behind the title: motes wander past the lighthouse.
      if (state.enemies.length < 5 && Math.random() < dt * 0.5) {
        const a = Math.random() * Math.PI * 2;
        state.enemies.push({
          kind: 'mote',
          x: 640 + Math.cos(a) * 480,
          y: 400 + Math.sin(a) * 320,
          hp: 3,
          maxHp: 3,
          radius: 13,
          phase: Math.random() * 6,
          angle: 0,
        });
      }
      for (const e of state.enemies) {
        e.phase += dt;
        e.x += Math.cos(e.phase * 0.4) * 12 * dt;
        e.y += Math.sin(e.phase * 0.4) * 12 * dt;
      }
      if (input.consume('Enter') || input.consume('MouseLeft')) startGame();
    } else if (state.mode === 'play') {
      if (input.consume('KeyP') || input.consume('Escape')) {
        state.mode = 'paused';
      } else {
        stepSpawner(state, dt);
        stepPlay(state, dt, input, audio);
        if (state.lighthouse.hp <= 0) endGame('lighthouse');
        else if (state.player.hull <= 0) endGame('player');
        else if (waveCleared(state)) {
          if (isFinalWave(state)) winGame();
          else {
            state.upgradeOffer = offerUpgrades(state);
            state.mode = 'upgrade';
            audio.upgrade();
          }
        }
      }
    } else if (state.mode === 'upgrade') {
      // Hover highlight follows the mouse.
      const cardW = 300;
      const gap = 36;
      const total = state.upgradeOffer.length * cardW + (state.upgradeOffer.length - 1) * gap;
      let x = 640 - total / 2;
      state.upgradeHover = -1;
      for (let i = 0; i < state.upgradeOffer.length; i += 1) {
        if (input.mouseX >= x && input.mouseX <= x + cardW && input.mouseY >= 230 && input.mouseY <= 530) {
          state.upgradeHover = i;
        }
        x += cardW + gap;
      }
      if (input.consume('Digit1')) chooseUpgrade(0);
      if (input.consume('Digit2')) chooseUpgrade(1);
      if (input.consume('Digit3')) chooseUpgrade(2);
    } else if (state.mode === 'paused') {
      if (input.consume('KeyP') || input.consume('Escape')) state.mode = 'play';
    } else if (state.mode === 'win' || state.mode === 'over') {
      if (input.consume('KeyR') || input.consume('Enter') || input.consume('MouseLeft')) startGame();
    }

    render(ctx, state, stars, best);
    input.endFrame();
    requestAnimationFrame(frame);
  }

  // Fit the 1280x800 view into the window, letterboxed.
  function fit() {
    const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
    canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
    canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
  }
  window.addEventListener('resize', fit);
  fit();
  requestAnimationFrame(frame);
}
