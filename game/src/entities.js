// Lumen Keep — the simulation's actors and their behaviour.
// One clear job: everything that moves, shoots, dies or drops. The state
// object is plain data; these functions step it. Rendering lives in
// render.js, spawning in waves.js, choices in upgrades.js.
import { CENTER, COMBO_CAP, COMBO_STEP, COMBO_WINDOW, ENEMIES, LIGHTHOUSE, PICKUP, PLAYER, VIEW } from './config.js';
import { chance, edgePoint, range } from './random.js';

export function newPlayer() {
  return {
    x: CENTER.x,
    y: CENTER.y + 150,
    vx: 0,
    vy: 0,
    radius: PLAYER.radius,
    angle: -Math.PI / 2,
    hull: PLAYER.maxHull,
    maxHull: PLAYER.maxHull,
    fireTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    invuln: 0,
    upgrades: {
      fireRate: 0,
      multishot: 0,
      damage: 0,
      speed: 0,
      pierce: 0,
      magnet: 0,
      ward: 0,
    },
  };
}

export function newState(rng, seed) {
  return {
    rng,
    seed,
    mode: 'title',
    time: 0,
    playTime: 0,
    wave: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    kills: 0,
    shards: 0,
    player: newPlayer(),
    lighthouse: { hp: LIGHTHOUSE.maxHp, maxHp: LIGHTHOUSE.maxHp },
    bullets: [],
    enemies: [],
    ebullets: [],
    particles: [],
    pickups: [],
    floats: [],
    spawnQueue: [],
    spawnTimer: 0,
    shake: 0,
    flash: 0,
    banner: null,
    upgradeOffer: null,
    bossSpawned: false,
    bossWarned: false,
    zapTimer: 0,
    zap: null,
    shotsFired: 0,
    hits: 0,
    over: null,
  };
}

export function fireInterval(player) {
  return PLAYER.fireInterval / (1 + 0.25 * player.upgrades.fireRate);
}

export function bulletDamage(player) {
  return PLAYER.bulletDamage + player.upgrades.damage;
}

export function playerSpeed(player) {
  return PLAYER.speed * (1 + 0.15 * player.upgrades.speed);
}

export function magnetRadius(player) {
  return PICKUP.magnetBase * (1 + 0.6 * player.upgrades.magnet);
}

function spawnEnemy(state, kind) {
  const def = ENEMIES[kind];
  const p = edgePoint(state.rng);
  const hpScale = 1 + 0.12 * Math.max(0, state.wave - 1);
  const enemy = {
    kind,
    x: p.x,
    y: p.y,
    vx: 0,
    vy: 0,
    hp: Math.round(def.hp * hpScale),
    maxHp: Math.round(def.hp * hpScale),
    speed: def.speed * range(state.rng, 0.9, 1.1),
    radius: def.radius,
    damage: def.damage,
    score: def.score,
    hitCooldown: 0,
    windup: 0, // >0: telegraphed bite winding down; <0: refractory after a bite
    shootTimer: range(state.rng, 1.2, 2.4),
    phase: state.rng() * Math.PI * 2,
    wobble: range(state.rng, 0.4, 1.0),
    lunging: 0,
    lungeTimer: range(state.rng, 1, 2.5),
    chargeTimer: 4,
    charging: 0,
    spawnTimer: 0,
    angle: 0,
  };
  state.enemies.push(enemy);
  return enemy;
}

export function spawnEnemyForWave(state, kind) {
  return spawnEnemy(state, kind);
}

export function queueEnemy(state, kind) {
  state.spawnQueue.push(kind);
}

export function spawnBoss(state) {
  const boss = spawnEnemy(state, 'boss');
  boss.x = CENTER.x;
  boss.y = -90;
  state.bossSpawned = true;
  return boss;
}

function burst(state, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const a = state.rng() * Math.PI * 2;
    const s = range(state.rng, speed * 0.3, speed);
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: range(state.rng, 0.3, 0.8),
      maxLife: 0.8,
      size: range(state.rng, 2, 5),
      color,
    });
  }
}

export function addFloat(state, x, y, text, color) {
  state.floats.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
}

function comboMultiplier(state) {
  return Math.min(COMBO_CAP, 1 + COMBO_STEP * Math.max(0, state.combo - 1));
}

function dropPickup(state, x, y) {
  if (chance(state.rng, 0.55)) {
    state.pickups.push({ kind: 'shard', x, y, vx: range(state.rng, -30, 30), vy: range(state.rng, -30, 30), life: 9 });
  } else if (chance(state.rng, 0.12)) {
    state.pickups.push({ kind: 'heart', x, y, vx: 0, vy: 0, life: 9 });
  }
}

function killEnemy(state, enemy, index, sfx) {
  state.enemies.splice(index, 1);
  state.kills += 1;
  state.combo += 1;
  state.comboTimer = COMBO_WINDOW;
  const gained = Math.round(enemy.score * comboMultiplier(state));
  state.score += gained;
  addFloat(state, enemy.x, enemy.y - 14, `+${gained}`, '#ffe9a8');
  burst(state, enemy.x, enemy.y, ENEMIES[enemy.kind].color, enemy.kind === 'boss' ? 60 : 14, 220);
  state.shake = Math.max(state.shake, enemy.kind === 'boss' ? 14 : 4);
  if (sfx) sfx.kill();
  if (enemy.kind === 'splitter') {
    for (let i = 0; i < 2; i += 1) {
      const mote = spawnEnemy(state, 'mote');
      mote.x = enemy.x + (i === 0 ? -16 : 16);
      mote.y = enemy.y;
      mote.hp = 2;
      mote.maxHp = 2;
    }
  }
  if (enemy.kind === 'boss') {
    for (let i = 0; i < 5; i += 1) dropPickup(state, enemy.x + range(state.rng, -60, 60), enemy.y + range(state.rng, -60, 60));
  } else {
    dropPickup(state, enemy.x, enemy.y);
  }
}

// The lighthouse defends itself: its searing light zaps the nearest
// creature inside its range every beat. Without it, one Warden could
// never cover four directions at once.
function stepLighthouse(state, dt, sfx) {
  state.zapTimer -= dt;
  if (state.zap) {
    state.zap.t -= dt;
    if (state.zap.t <= 0) state.zap = null;
  }
  if (state.zapTimer > 0) return;
  state.zapTimer = LIGHTHOUSE.zapInterval;
  let target = null;
  let targetD = Infinity;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - LIGHTHOUSE.x, e.y - LIGHTHOUSE.y);
    if (d < LIGHTHOUSE.zapRange && d < targetD) {
      targetD = d;
      target = e;
    }
  }
  if (!target) return;
  target.hp -= LIGHTHOUSE.zapDamage;
  state.zap = { x: target.x, y: target.y, t: 0.18 };
  burst(state, target.x, target.y, '#ffe9a8', 4, 140);
  if (target.hp <= 0) {
    const index = state.enemies.indexOf(target);
    if (index !== -1) killEnemy(state, target, index, sfx);
  }
}

function stepPlayer(state, dt, input, sfx) {
  const p = state.player;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.dashCooldown > 0) p.dashCooldown -= dt;

  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (!Number.isFinite(mx)) mx = 0;
  if (!Number.isFinite(my)) my = 0;
  const len = Math.hypot(mx, my);
  if (len > 0) {
    mx /= len;
    my /= len;
  }
  const speed = playerSpeed(p);

  if (input.dash && p.dashCooldown <= 0 && p.dashTimer <= 0 && len > 0) {
    p.dashTimer = PLAYER.dashTime;
    p.dashCooldown = PLAYER.dashCooldown;
    p.invuln = Math.max(p.invuln, 0.25);
    if (sfx) sfx.dash();
    burst(state, p.x, p.y, '#4de8ff', 8, 160);
  }

  if (p.dashTimer > 0) {
    p.dashTimer -= dt;
    p.vx = mx * PLAYER.dashSpeed;
    p.vy = my * PLAYER.dashSpeed;
  } else {
    p.vx = mx * speed;
    p.vy = my * speed;
  }
  p.x = Math.min(VIEW.width - p.radius, Math.max(p.radius, p.x + p.vx * dt));
  p.y = Math.min(VIEW.height - p.radius, Math.max(p.radius, p.y + p.vy * dt));
  p.angle = Math.atan2(input.mouseY - p.y, input.mouseX - p.x);

  p.fireTimer -= dt;
  if (input.fire && p.fireTimer <= 0) {
    p.fireTimer = fireInterval(p);
    const shots = 1 + p.upgrades.multishot;
    state.shotsFired += shots;
    const spread = 0.14;
    for (let i = 0; i < shots; i += 1) {
      const offset = (i - (shots - 1) / 2) * spread;
      const a = p.angle + offset;
      state.bullets.push({
        x: p.x + Math.cos(a) * (p.radius + 6),
        y: p.y + Math.sin(a) * (p.radius + 6),
        vx: Math.cos(a) * PLAYER.bulletSpeed,
        vy: Math.sin(a) * PLAYER.bulletSpeed,
        damage: bulletDamage(p),
        pierce: p.upgrades.pierce,
        radius: PLAYER.bulletRadius,
        life: 1.4,
      });
    }
    if (sfx) sfx.shoot();
  }
}

function stepBullets(state, dt, sfx) {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const b = state.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let dead = b.life <= 0 || b.x < -20 || b.x > VIEW.width + 20 || b.y < -20 || b.y > VIEW.height + 20;
    if (!dead) {
      for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
        const e = state.enemies[j];
        const d = Math.hypot(e.x - b.x, e.y - b.y);
        if (d < e.radius + b.radius) {
          e.hp -= b.damage;
          state.hits += 1;
          burst(state, b.x, b.y, '#ffe9a8', 3, 120);
          if (sfx) sfx.hit();
          if (e.hp <= 0) killEnemy(state, e, j, sfx);
          if (b.pierce > 0) {
            b.pierce -= 1;
          } else {
            dead = true;
          }
          break;
        }
      }
    }
    if (dead) state.bullets.splice(i, 1);
  }
}

function stepEnemies(state, dt, sfx) {
  const p = state.player;
  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const e = state.enemies[i];
    e.phase += dt;
    if (e.hitCooldown > 0) e.hitCooldown -= dt;
    const prevX = e.x;
    const prevY = e.y;
    const dxL = LIGHTHOUSE.x - e.x;
    const dyL = LIGHTHOUSE.y - e.y;
    const distL = Math.hypot(dxL, dyL) || 1;
    const dxP = p.x - e.x;
    const dyP = p.y - e.y;
    const distP = Math.hypot(dxP, dyP) || 1;
    if (e.windup < 0) e.windup = Math.min(0, e.windup + dt);
    const inRangeL = distL < LIGHTHOUSE.radius + e.radius;

    if (inRangeL && e.windup > 0) {
      // Winding up a bite: hold still and telegraph, so the Warden has a
      // real chance to save the light before the bite lands.
    } else if (e.kind === 'boss') {
      stepBoss(state, e, dt, sfx);
    } else if (e.kind === 'spitter') {
      // Keep a firing distance from the lighthouse, lob globs at it.
      const want = 330;
      const dir = distL > want + 20 ? 1 : distL < want - 20 ? -1 : 0;
      e.x += (dxL / distL) * e.speed * dir * dt;
      e.y += (dyL / distL) * e.speed * dir * dt;
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && distL < 560) {
        e.shootTimer = range(state.rng, 2.0, 2.8);
        const a = Math.atan2(dyL, dxL);
        state.ebullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(a) * 170,
          vy: Math.sin(a) * 170,
          damage: 2,
          radius: 7,
          life: 5,
          kind: 'glob',
        });
        if (sfx) sfx.shoot();
      }
    } else {
      // Drifters, darters and splitters hunt the lighthouse, with a wobble.
      const wob = Math.sin(e.phase * e.wobble * 3) * 0.5;
      const ax = dxL / distL;
      const ay = dyL / distL;
      const px = -ay * wob;
      const py = ax * wob;
      e.x += (ax + px) * e.speed * dt;
      e.y += (ay + py) * e.speed * dt;
      // A darter close to the player lunges at them — briefly, then it
      // goes back to hunting the light. A permanent chase kites forever.
      if (e.kind === 'darter') {
        if (e.lungeTimer > 0) e.lungeTimer -= dt;
        if (e.lunging > 0) {
          e.lunging -= dt;
          e.x += (dxP / distP) * e.speed * 1.35 * dt;
          e.y += (dyP / distP) * e.speed * 1.35 * dt;
        } else if (distP < 130 && e.lungeTimer <= 0) {
          e.lunging = 0.7;
          e.lungeTimer = 2.5;
        }
      }
    }
    // Remember the velocity, so the aim lead can use the real one.
    e.vx = (e.x - prevX) / dt;
    e.vy = (e.y - prevY) / dt;

    // Contact with the lighthouse: a bite is telegraphed for a second
    // before it lands, so the Warden has a real chance to save the light.
    const dL2 = Math.hypot(LIGHTHOUSE.x - e.x, LIGHTHOUSE.y - e.y);
    if (dL2 < LIGHTHOUSE.radius + e.radius && e.kind !== 'boss') {
      if (e.windup === 0) {
        e.windup = 1.0;
      } else if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0) {
          state.lighthouse.hp -= e.damage;
          state.flash = Math.max(state.flash, 0.35);
          state.shake = Math.max(state.shake, 5);
          burst(state, e.x, e.y, '#ff4d5e', 8, 180);
          if (sfx) sfx.hurt();
          if (e.kind === 'mote' || e.kind === 'darter') {
            // Kamikaze nibblers pop when they bite.
            e.hp = 0;
            killEnemy(state, e, i, null);
            continue;
          }
          // Heavier creatures are knocked back out of the ring.
          const nx = (e.x - LIGHTHOUSE.x) / (dL2 || 1);
          const ny = (e.y - LIGHTHOUSE.y) / (dL2 || 1);
          e.x = LIGHTHOUSE.x + nx * (LIGHTHOUSE.radius + e.radius + 150);
          e.y = LIGHTHOUSE.y + ny * (LIGHTHOUSE.radius + e.radius + 150);
          e.windup = -1.5;
        }
      }
    }
    // Contact with the player.
    if (distP < p.radius + e.radius && p.invuln <= 0 && p.dashTimer <= 0) {
      p.hull -= 1;
      p.invuln = PLAYER.invulnTime;
      state.flash = Math.max(state.flash, 0.5);
      state.shake = Math.max(state.shake, 8);
      burst(state, p.x, p.y, '#ff4d5e', 16, 240);
      if (sfx) sfx.hurt();
      // Knock the player away from the hit, and shove the enemy back too,
      // so it cannot land a second hit the moment invulnerability ends.
      p.x = Math.min(VIEW.width - p.radius, Math.max(p.radius, p.x + (dxP / distP) * -40));
      p.y = Math.min(VIEW.height - p.radius, Math.max(p.radius, p.y + (dyP / distP) * -40));
      e.x -= (dxP / distP) * 60;
      e.y -= (dyP / distP) * 60;
    }
    e.angle = Math.atan2(dyL, dxL);
  }
}

function stepBoss(state, boss, dt, sfx) {
  const p = state.player;
  boss.chargeTimer -= dt;
  const dxL = LIGHTHOUSE.x - boss.x;
  const dyL = LIGHTHOUSE.y - boss.y;
  const distL = Math.hypot(dxL, dyL) || 1;
  const dxP = p.x - boss.x;
  const dyP = p.y - boss.y;
  const distP = Math.hypot(dxP, dyP) || 1;
  if (boss.windup < 0) boss.windup = Math.min(0, boss.windup + dt);
  const winding = boss.windup > 0 && distL < LIGHTHOUSE.radius + boss.radius;

  if (winding) {
    // Telegraphing its bite: hold still.
  } else if (boss.charging > 0) {
    boss.charging -= dt;
    boss.x += boss.vx * dt;
    boss.y += boss.vy * dt;
  } else if (boss.chargeTimer <= 0) {
    // Telegraph, then charge at the player.
    boss.charging = 0.7;
    boss.chargeTimer = range(state.rng, 4.5, 6);
    const a = Math.atan2(dyP, dxP);
    boss.vx = Math.cos(a) * 340;
    boss.vy = Math.sin(a) * 340;
    if (sfx) sfx.boss();
  } else {
    boss.x += (dxL / distL) * boss.speed * dt;
    boss.y += (dyL / distL) * boss.speed * dt;
  }
  boss.x = Math.min(VIEW.width - boss.radius, Math.max(boss.radius, boss.x));
  boss.y = Math.min(VIEW.height - boss.radius, Math.max(boss.radius, boss.y));

  // Boss bite on the lighthouse: telegraphed, like every other bite.
  if (distL < LIGHTHOUSE.radius + boss.radius) {
    if (boss.windup === 0) {
      boss.windup = 1.2;
    } else if (boss.windup > 0) {
      boss.windup -= dt;
      if (boss.windup <= 0) {
        state.lighthouse.hp -= boss.damage;
        state.flash = 0.6;
        state.shake = 12;
        if (sfx) sfx.hurt();
        boss.windup = -1.5;
      }
    }
  }
  // Boss contact with the player.
  if (distP < p.radius + boss.radius && p.invuln <= 0 && p.dashTimer <= 0) {
    p.hull -= 1;
    p.invuln = PLAYER.invulnTime;
    state.flash = 0.6;
    state.shake = 10;
    if (sfx) sfx.hurt();
  }
  // Periodic mote spawns.
  boss.spawnTimer -= dt;
  if (boss.spawnTimer <= 0) {
    boss.spawnTimer = 8;
    for (let i = 0; i < 3; i += 1) {
      const mote = spawnEnemy(state, 'mote');
      mote.x = boss.x + range(state.rng, -50, 50);
      mote.y = boss.y + range(state.rng, -50, 50);
    }
  }
}

function stepEnemyBullets(state, dt, sfx) {
  const p = state.player;
  for (let i = state.ebullets.length - 1; i >= 0; i -= 1) {
    const b = state.ebullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let dead = b.life <= 0 || b.x < -20 || b.x > VIEW.width + 20 || b.y < -20 || b.y > VIEW.height + 20;
    if (!dead) {
      const dL = Math.hypot(LIGHTHOUSE.x - b.x, LIGHTHOUSE.y - b.y);
      if (dL < LIGHTHOUSE.radius + b.radius) {
        state.lighthouse.hp -= b.damage;
        state.flash = Math.max(state.flash, 0.3);
        burst(state, b.x, b.y, '#7dffa8', 6, 140);
        dead = true;
      }
      const dP = Math.hypot(p.x - b.x, p.y - b.y);
      if (!dead && dP < p.radius + b.radius && p.invuln <= 0) {
        p.hull -= 1;
        p.invuln = PLAYER.invulnTime;
        state.flash = 0.5;
        if (sfx) sfx.hurt();
        dead = true;
      }
    }
    if (dead) state.ebullets.splice(i, 1);
  }
}

function stepPickups(state, dt, sfx) {
  const p = state.player;
  const magnet = magnetRadius(p);
  for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
    const k = state.pickups[i];
    k.life -= dt;
    const dx = p.x - k.x;
    const dy = p.y - k.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < magnet) {
      const pull = 420 * (1 - d / magnet) + 120;
      k.x += (dx / d) * pull * dt;
      k.y += (dy / d) * pull * dt;
    } else {
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      k.vx *= 0.98;
      k.vy *= 0.98;
    }
    if (d < p.radius + 14) {
      if (k.kind === 'shard') {
        state.score += PICKUP.shardScore;
        state.shards += 1;
        addFloat(state, k.x, k.y - 10, `+${PICKUP.shardScore}`, '#7dffa8');
        if (sfx) sfx.pickup();
      } else if (k.kind === 'heart') {
        p.hull = Math.min(p.maxHull, p.hull + PICKUP.heartHeal);
        addFloat(state, k.x, k.y - 10, '+1 HULL', '#ff5da2');
        if (sfx) sfx.heart();
      }
      state.pickups.splice(i, 1);
      continue;
    }
    if (k.life <= 0) state.pickups.splice(i, 1);
  }
}

function stepParticles(state, dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const pt = state.particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.96;
    pt.vy *= 0.96;
    pt.life -= dt;
    if (pt.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.floats.length - 1; i >= 0; i -= 1) {
    const f = state.floats[i];
    f.y -= 34 * dt;
    f.life -= dt;
    if (f.life <= 0) state.floats.splice(i, 1);
  }
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 26);
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 1.8);
  if (state.banner) {
    state.banner.t -= dt;
    if (state.banner.t <= 0) state.banner = null;
  }
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
}

// One fixed simulation step while the game is being played.
export function stepPlay(state, dt, input, sfx) {
  state.time += dt;
  state.playTime += dt;
  stepLighthouse(state, dt, sfx);
  stepPlayer(state, dt, input, sfx);
  stepBullets(state, dt, sfx);
  stepEnemies(state, dt, sfx);
  stepEnemyBullets(state, dt, sfx);
  stepPickups(state, dt, sfx);
  stepParticles(state, dt);
}
