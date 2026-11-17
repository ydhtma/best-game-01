// Lumen Keep — tuning, palette and wave table.
// One clear job: every number that shapes how the game plays lives here,
// so balancing never means hunting through the simulation code.
export const VIEW = { width: 1280, height: 800 };
export const CENTER = { x: 640, y: 400 };

export const PALETTE = {
  void0: '#070a1c',
  void1: '#0d1233',
  void2: '#141b45',
  nebulaA: 'rgba(88, 60, 220, 0.20)',
  nebulaB: 'rgba(16, 180, 190, 0.14)',
  nebulaC: 'rgba(255, 90, 160, 0.10)',
  light: '#ffe9a8',
  beam: 'rgba(255, 233, 168, 0.16)',
  cyan: '#4de8ff',
  magenta: '#ff5da2',
  amber: '#ffb347',
  green: '#7dffa8',
  white: '#f4f7ff',
  dim: '#8b93b8',
  danger: '#ff4d5e',
};

export const LIGHTHOUSE = {
  x: CENTER.x,
  y: CENTER.y,
  radius: 44,
  maxHp: 120,
  zapRange: 280,
  zapInterval: 0.9,
  zapDamage: 3,
};

export const PLAYER = {
  radius: 14,
  speed: 265,
  maxHull: 3,
  fireInterval: 0.18,
  bulletSpeed: 720,
  bulletDamage: 1,
  bulletRadius: 6,
  dashSpeed: 760,
  dashTime: 0.16,
  dashCooldown: 1.6,
  invulnTime: 1.2,
  pickupRadius: 26,
};

// Enemy kinds. hp scales a little with the wave (see waves.js).
export const ENEMIES = {
  mote:     { hp: 2,  speed: 48,  radius: 13, damage: 2, score: 50,  color: '#b78cff', glow: '#8a5cf6' },
  darter:   { hp: 2,  speed: 115, radius: 10, damage: 2, score: 80,  color: '#ff5da2', glow: '#ff2e88' },
  splitter: { hp: 6,  speed: 42,  radius: 18, damage: 4, score: 120, color: '#ffb347', glow: '#ff8a00' },
  spitter:  { hp: 4,  speed: 62,  radius: 12, damage: 0, score: 150, color: '#7dffa8', glow: '#2ecc71' },
  boss:     { hp: 520, speed: 42, radius: 54, damage: 8, score: 5000, color: '#ff4d5e', glow: '#ff1e3c' },
};

export const COMBO_WINDOW = 2.5; // seconds without a kill before the combo resets
export const COMBO_STEP = 0.25; // +25% score per combo step
export const COMBO_CAP = 5; // x5 at most

export const PICKUP = {
  shardScore: 25,
  shardRadius: 7,
  heartHeal: 1,
  magnetBase: 90,
};

// Waves 1-9 are a spawn queue; wave 10 is the boss plus a mote trickle.
export const WAVES = [
  null,
  { motes: 6,  darters: 0,  splitters: 0, spitters: 0, interval: 1.15 },
  { motes: 8,  darters: 3,  splitters: 0, spitters: 0, interval: 1.05 },
  { motes: 10, darters: 5,  splitters: 2, spitters: 0, interval: 0.95 },
  { motes: 7,  darters: 5,  splitters: 2, spitters: 2, interval: 0.9 },
  { motes: 10, darters: 7,  splitters: 3, spitters: 3, interval: 0.85 },
  { motes: 12, darters: 9,  splitters: 4, spitters: 4, interval: 0.8 },
  { motes: 14, darters: 10, splitters: 5, spitters: 5, interval: 0.75 },
  { motes: 16, darters: 12, splitters: 6, spitters: 6, interval: 0.7 },
  { motes: 18, darters: 14, splitters: 8, spitters: 7, interval: 0.65 },
  { boss: true, motes: 0, darters: 0, splitters: 0, spitters: 0, interval: 1.0 },
];

export const FINAL_WAVE = 10;
