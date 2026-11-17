// Lumen Keep — deterministic randomness.
// Mulberry32: small, fast, seedable. The game reads its seed from ?seed=
// so screenshots replay exactly; live play seeds from time instead.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function range(rng, min, max) {
  return min + rng() * (max - min);
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function chance(rng, p) {
  return rng() < p;
}

// A point on the arena edge, just outside the view, for spawning.
export function edgePoint(rng, margin = 30) {
  const side = Math.floor(rng() * 4);
  const w = 1280;
  const h = 800;
  if (side === 0) return { x: range(rng, 0, w), y: -margin };
  if (side === 1) return { x: w + margin, y: range(rng, 0, h) };
  if (side === 2) return { x: range(rng, 0, w), y: h + margin };
  return { x: -margin, y: range(rng, 0, h) };
}
