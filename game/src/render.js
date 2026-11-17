// Lumen Keep — everything the player sees.
// One clear job: draw the state. No simulation here, no input here, so the
// screenshot autopilot can render any state the rules produce. The HUD and
// every screen are drawn on the canvas, so a screenshot always shows the
// whole game: goal, score, health, controls and restart.
import { CENTER, ENEMIES, LIGHTHOUSE, PALETTE, VIEW } from './config.js';

const FONT = "'Trebuchet MS', Verdana, sans-serif";
const FONT_DISPLAY = "'Trebuchet MS', Verdana, sans-serif";

const glowCache = new Map();
function glowSprite(color) {
  let sprite = glowCache.get(color);
  if (sprite) return sprite;
  sprite = document.createElement('canvas');
  sprite.width = 64;
  sprite.height = 64;
  const g = sprite.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color + 'cc');
  grad.addColorStop(1, color + '00');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowCache.set(color, sprite);
  return sprite;
}

function drawGlow(ctx, x, y, radius, color) {
  const s = glowSprite(color);
  ctx.globalAlpha = 0.85;
  ctx.drawImage(s, x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, fill, back = 'rgba(255,255,255,0.12)') {
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
}

function drawBackground(ctx, state, stars) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  grad.addColorStop(0, PALETTE.void0);
  grad.addColorStop(0.55, PALETTE.void1);
  grad.addColorStop(1, PALETTE.void2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Nebulae: three soft blobs that never move.
  const blobs = [
    { x: 210, y: 150, r: 260, c: PALETTE.nebulaA },
    { x: 1080, y: 620, r: 300, c: PALETTE.nebulaB },
    { x: 980, y: 120, r: 200, c: PALETTE.nebulaC },
  ];
  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, b.r);
    g.addColorStop(0, b.c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
  }

  // Stars, twinkling with time.
  for (const s of stars) {
    const tw = 0.45 + 0.55 * Math.abs(Math.sin(state.time * s.tw + s.ph));
    ctx.globalAlpha = tw * s.a;
    ctx.fillStyle = s.c;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }
  ctx.globalAlpha = 1;
}

function drawLighthouse(ctx, state) {
  const { x, y } = LIGHTHOUSE;
  const t = state.time;
  // Rotating beam.
  const beamAngle = t * 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(beamAngle);
  const beam = ctx.createLinearGradient(0, 0, 420, 0);
  beam.addColorStop(0, 'rgba(255, 233, 168, 0.20)');
  beam.addColorStop(1, 'rgba(255, 233, 168, 0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(420, -26);
  ctx.lineTo(420, 26);
  ctx.closePath();
  ctx.fill();
  ctx.rotate(Math.PI);
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(420, -26);
  ctx.lineTo(420, 26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  drawGlow(ctx, x, y, 120, '#ffe9a8');
  // The crystal: a diamond with a bright core.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#fff6d8';
  ctx.fillRect(-16, -16, 32, 32);
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 3;
  ctx.strokeRect(-16, -16, 32, 32);
  ctx.restore();
  // Base ring.
  ctx.strokeStyle = 'rgba(255, 233, 168, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, LIGHTHOUSE.radius, 0, Math.PI * 2);
  ctx.stroke();
  // Low-health warning ring.
  const frac = state.lighthouse.hp / state.lighthouse.maxHp;
  if (frac < 0.35) {
    ctx.strokeStyle = Math.sin(t * 6) > 0 ? '#ff4d5e' : 'rgba(255,77,94,0.25)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, LIGHTHOUSE.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;
  if (p.invuln > 0 && Math.floor(state.time * 14) % 2 === 0) return; // blink while invulnerable
  drawGlow(ctx, p.x, p.y, 46, '#4de8ff');
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // Hull: a dart with twin wings.
  ctx.fillStyle = '#eaf6ff';
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-10, -11);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4de8ff';
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-2, -5);
  ctx.lineTo(-2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Dash cooldown ring.
  if (p.dashCooldown > 0) {
    ctx.strokeStyle = 'rgba(77, 232, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p.dashCooldown / 1.6));
    ctx.stroke();
  }
}

function drawEnemy(ctx, e) {
  const def = ENEMIES[e.kind];
  drawGlow(ctx, e.x, e.y, e.radius * 2.4, def.glow);
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = def.color;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5;
  if (e.kind === 'mote') {
    // Spiked orb.
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2 + e.phase * 0.5;
      const r = i % 2 === 0 ? e.radius : e.radius * 0.62;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.kind === 'darter') {
    ctx.rotate(e.angle);
    ctx.beginPath();
    ctx.moveTo(e.radius + 6, 0);
    ctx.lineTo(-e.radius, -e.radius * 0.8);
    ctx.lineTo(-e.radius * 0.4, 0);
    ctx.lineTo(-e.radius, e.radius * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.kind === 'splitter') {
    // Hexagon with a hot core.
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + e.phase * 0.3;
      const px = Math.cos(a) * e.radius;
      const py = Math.sin(a) * e.radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'spitter') {
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0d1233';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7dffa8';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'boss') {
    // The Void Maw: a big ringed maw, pulsing.
    const pulse = 1 + Math.sin(e.phase * 2) * 0.05;
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ff1e3c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0d1233';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Teeth.
    ctx.fillStyle = '#f4f7ff';
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      const r = e.radius * 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a + 0.18) * r, Math.sin(a + 0.18) * r);
      ctx.lineTo(Math.cos(a + 0.09) * (r - 12), Math.sin(a + 0.09) * (r - 12));
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#ff4d5e';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Telegraph: a shrinking red ring while a bite winds up.
  if (e.windup > 0) {
    const total = e.kind === 'boss' ? 1.2 : 1.0;
    ctx.strokeStyle = '#ff4d5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - e.windup / total));
    ctx.stroke();
  }
  // Health bar for anything tougher than a mote.
  if (e.maxHp > 3 && e.hp < e.maxHp) {
    bar(ctx, e.x - 22, e.y - e.radius - 12, 44, 5, e.hp / e.maxHp, '#ff5da2');
  }
}

function drawWorld(ctx, state) {
  drawLighthouse(ctx, state);
  if (state.zap) {
    ctx.strokeStyle = `rgba(255, 233, 168, ${Math.max(0, state.zap.t / 0.18)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LIGHTHOUSE.x, LIGHTHOUSE.y);
    ctx.lineTo(state.zap.x, state.zap.y);
    ctx.stroke();
  }
  for (const k of state.pickups) {
    if (k.kind === 'shard') {
      drawGlow(ctx, k.x, k.y, 16, '#7dffa8');
      ctx.fillStyle = '#b8ffce';
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    } else {
      drawGlow(ctx, k.x, k.y, 20, '#ff5da2');
      ctx.fillStyle = '#ff5da2';
      ctx.font = `bold 18px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♥', k.x, k.y);
    }
  }
  for (const b of state.bullets) {
    // A streak along the bolt's path reads as a shot fired, not a dot.
    const bl = 26;
    const blen = Math.hypot(b.vx, b.vy) || 1;
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.x - (b.vx / blen) * bl, b.y - (b.vy / blen) * bl);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    drawGlow(ctx, b.x, b.y, 16, '#ffe9a8');
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const b of state.ebullets) {
    drawGlow(ctx, b.x, b.y, 18, '#7dffa8');
    ctx.fillStyle = '#7dffa8';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const e of state.enemies) drawEnemy(ctx, e);
  drawPlayer(ctx, state);
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    text(ctx, f.text, f.x, f.y, 15, f.color);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state) {
  const p = state.player;
  // Top-left: wave, score, combo.
  ctx.textAlign = 'left';
  text(ctx, `WAVE ${Math.max(1, state.wave)} / 10`, 28, 34, 22, PALETTE.white, 'left');
  text(ctx, `SCORE ${state.score.toLocaleString('en-US')}`, 28, 64, 20, PALETTE.light, 'left');
  if (state.combo >= 2) {
    const mult = Math.min(5, 1 + 0.25 * (state.combo - 1)).toFixed(2).replace(/\.?0+$/, '');
    text(ctx, `COMBO x${mult}  (${state.combo})`, 28, 92, 17, PALETTE.magenta, 'left');
  }
  // Top-right: lighthouse integrity + hull hearts.
  const lx = VIEW.width - 268;
  text(ctx, 'LIGHTHOUSE', lx, 30, 15, PALETTE.dim, 'left');
  const frac = state.lighthouse.hp / state.lighthouse.maxHp;
  bar(ctx, lx, 42, 240, 14, frac, frac > 0.35 ? '#ffb347' : '#ff4d5e');
  text(ctx, `${Math.max(0, Math.ceil(state.lighthouse.hp))} / ${state.lighthouse.maxHp}`, lx + 240, 50, 14, PALETTE.white, 'right');
  let hearts = '';
  for (let i = 0; i < p.maxHull; i += 1) hearts += i < p.hull ? '♥ ' : '♡ ';
  text(ctx, hearts.trim(), lx, 82, 22, '#ff5da2', 'left');
  text(ctx, `KILLS ${state.kills}`, lx, 108, 15, PALETTE.dim, 'left');
  // Bottom-left: dash + controls reminder.
  text(ctx, p.dashCooldown <= 0 ? 'DASH READY  [SHIFT]' : 'DASH …', 28, VIEW.height - 28, 15, p.dashCooldown <= 0 ? PALETTE.cyan : PALETTE.dim, 'left');
  text(ctx, 'WASD move · MOUSE aim · CLICK / SPACE fire · P pause · M mute', VIEW.width / 2, VIEW.height - 28, 14, PALETTE.dim);
  // Boss health bar.
  const boss = state.enemies.find((e) => e.kind === 'boss');
  if (boss) {
    text(ctx, 'THE VOID MAW', VIEW.width / 2, 118, 18, '#ff4d5e');
    bar(ctx, VIEW.width / 2 - 220, 134, 440, 12, boss.hp / boss.maxHp, '#ff4d5e');
  }
  // Wave banner (not on the end screens: the victory and game-over
  // panels speak for themselves).
  if (state.banner && state.mode !== 'win' && state.mode !== 'over') {
    const a = Math.min(1, state.banner.t);
    ctx.globalAlpha = a;
    text(ctx, state.banner.text, VIEW.width / 2, 220, 44, PALETTE.white);
    text(ctx, state.banner.sub, VIEW.width / 2, 262, 19, PALETTE.light, 'center', 'normal');
    ctx.globalAlpha = 1;
  }
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(7, 10, 28, 0.82)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(77, 232, 255, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawTitle(ctx, state, best) {
  ctx.fillStyle = 'rgba(7, 10, 28, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawGlow(ctx, CENTER.x, 190, 190, '#ffe9a8');
  text(ctx, 'LUMEN KEEP', CENTER.x, 170, 84, PALETTE.light, 'center');
  ctx.font = `bold 84px ${FONT_DISPLAY}`;
  text(ctx, 'LUMEN KEEP', CENTER.x, 170, 84, 'rgba(255,233,168,0.25)');
  text(ctx, 'Defend the last lighthouse. Ten waves. One dawn.', CENTER.x, 232, 22, PALETTE.white, 'center', 'normal');
  text(ctx, 'The void sends its creatures to eat the light. You are the Warden.', CENTER.x, 262, 17, PALETTE.dim, 'center', 'normal');

  panel(ctx, CENTER.x - 300, 310, 600, 168);
  text(ctx, 'HOW TO PLAY', CENTER.x, 338, 18, PALETTE.cyan);
  text(ctx, 'WASD / ARROWS — move      MOUSE — aim', CENTER.x, 372, 17, PALETTE.white, 'center', 'normal');
  text(ctx, 'CLICK or SPACE — fire      SHIFT — dash', CENTER.x, 400, 17, PALETTE.white, 'center', 'normal');
  text(ctx, 'Clear a wave, pick 1 of 3 upgrades, survive all 10.', CENTER.x, 428, 17, PALETTE.white, 'center', 'normal');
  text(ctx, 'If the lighthouse falls — or you do — the night wins.', CENTER.x, 454, 17, PALETTE.magenta, 'center', 'normal');

  const pulse = 0.65 + 0.35 * Math.sin(state.time * 3);
  ctx.globalAlpha = pulse;
  text(ctx, '— CLICK OR PRESS ENTER TO BEGIN —', CENTER.x, 540, 22, PALETTE.amber);
  ctx.globalAlpha = 1;
  if (best > 0) text(ctx, `BEST SCORE  ${best.toLocaleString('en-US')}`, CENTER.x, 590, 17, PALETTE.dim);
  text(ctx, 'Sound on for the full game — M mutes.', CENTER.x, 640, 14, PALETTE.dim, 'center', 'normal');
}

function drawUpgrade(ctx, state) {
  ctx.fillStyle = 'rgba(7, 10, 28, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, `WAVE ${state.wave} CLEARED`, CENTER.x, 120, 40, PALETTE.green);
  text(ctx, 'Choose one upgrade — it shapes the waves ahead', CENTER.x, 160, 19, PALETTE.white, 'center', 'normal');
  const offer = state.upgradeOffer || [];
  const cardW = 300;
  const gap = 36;
  const total = offer.length * cardW + (offer.length - 1) * gap;
  let x = CENTER.x - total / 2;
  const y = 230;
  const h = 300;
  offer.forEach((u, i) => {
    const hover = state.upgradeHover === i;
    panel(ctx, x, y, cardW, h);
    if (hover) {
      ctx.strokeStyle = PALETTE.amber;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, cardW, h);
    }
    text(ctx, `[${i + 1}]`, x + cardW / 2, y + 36, 16, PALETTE.dim);
    text(ctx, u.icon, x + cardW / 2, y + 92, 52, PALETTE.cyan);
    text(ctx, u.name, x + cardW / 2, y + 158, 24, PALETTE.white);
    wrapText(ctx, u.desc, x + 24, y + 200, cardW - 48, 17, PALETTE.light);
    x += cardW + gap;
  });
  text(ctx, 'Click a card, or press 1 / 2 / 3', CENTER.x, 590, 18, PALETTE.amber);
  text(ctx, `SCORE ${state.score.toLocaleString('en-US')}   ·   LIGHTHOUSE ${Math.max(0, Math.ceil(state.lighthouse.hp))}/${state.lighthouse.maxHp}`, CENTER.x, 626, 16, PALETTE.dim);
}

function wrapText(ctx, str, x, y, maxW, size, color) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  ctx.font = `normal ${size}px ${FONT}`;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => text(ctx, l, x + maxW / 2, y + i * 24, size, color, 'center', 'normal'));
}

function drawEnd(ctx, state, won, best) {
  ctx.fillStyle = won ? 'rgba(7, 20, 14, 0.6)' : 'rgba(20, 7, 12, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (won) {
    drawGlow(ctx, CENTER.x, 200, 220, '#ffe9a8');
    text(ctx, 'THE LIGHT ENDURES', CENTER.x, 190, 64, PALETTE.light);
    text(ctx, 'The Void Maw is unmade. Dawn breaks over the keep.', CENTER.x, 250, 20, PALETTE.white, 'center', 'normal');
  } else {
    text(ctx, 'THE NIGHT WINS', CENTER.x, 190, 64, '#ff4d5e');
    const reason = state.over === 'lighthouse' ? 'The lighthouse has gone dark.' : 'The Warden has fallen.';
    text(ctx, reason, CENTER.x, 250, 20, PALETTE.white, 'center', 'normal');
  }
  panel(ctx, CENTER.x - 260, 300, 520, 190);
  const rows = [
    ['FINAL SCORE', state.score.toLocaleString('en-US')],
    ['WAVE REACHED', `${state.wave} / 10`],
    ['CREATURES SLAIN', `${state.kills}`],
    ['LIGHT SHARDS', `${state.shards}`],
    ['TIME', formatTime(state.playTime)],
  ];
  rows.forEach(([label, value], i) => {
    const y = 332 + i * 34;
    text(ctx, label, CENTER.x - 230, y, 17, PALETTE.dim, 'left', 'normal');
    text(ctx, value, CENTER.x + 230, y, 18, PALETTE.white, 'right');
  });
  if (state.score > 0 && state.score >= best) {
    text(ctx, '★ NEW BEST SCORE ★', CENTER.x, 530, 22, PALETTE.amber);
  }
  const pulse = 0.65 + 0.35 * Math.sin(state.time * 3);
  ctx.globalAlpha = pulse;
  text(ctx, '— PRESS R TO PLAY AGAIN —', CENTER.x, 580, 22, PALETTE.amber);
  ctx.globalAlpha = 1;
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(7, 10, 28, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'PAUSED', CENTER.x, 380, 56, PALETTE.white);
  text(ctx, 'Press P to resume', CENTER.x, 440, 19, PALETTE.dim, 'center', 'normal');
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function makeStars(rng) {
  const stars = [];
  const colors = ['#ffffff', '#cfe6ff', '#ffe9a8', '#ffb3d1'];
  for (let i = 0; i < 150; i += 1) {
    stars.push({
      x: rng() * VIEW.width,
      y: rng() * VIEW.height,
      s: rng() < 0.85 ? 2 : 3,
      a: 0.3 + rng() * 0.6,
      tw: 0.4 + rng() * 1.6,
      ph: rng() * Math.PI * 2,
      c: colors[Math.floor(rng() * colors.length)],
    });
  }
  return stars;
}

// Render one frame. `screens` carries the overlay data the loop owns.
export function render(ctx, state, stars, best) {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  drawBackground(ctx, state, stars);
  if (state.mode === 'title') {
    // A quiet drift of motes behind the title, for depth.
    for (const e of state.enemies) drawEnemy(ctx, e);
    drawLighthouse(ctx, state);
    drawTitle(ctx, state, best);
  } else {
    drawWorld(ctx, state);
    drawHud(ctx, state);
    if (state.mode === 'upgrade') drawUpgrade(ctx, state);
    if (state.mode === 'win') drawEnd(ctx, state, true, best);
    if (state.mode === 'over') drawEnd(ctx, state, false, best);
    if (state.mode === 'paused') drawPaused(ctx);
  }
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 40, 60, ${state.flash * 0.28})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
  ctx.restore();
}
