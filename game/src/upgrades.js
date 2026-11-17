// Lumen Keep — between-wave upgrade choices.
// One clear job: the pool of upgrades, offering three, and applying the
// one the player picks. Choices matter: fire rate, multishot, piercing,
// speed, hull and lighthouse repair all change how the next waves play.
export const UPGRADES = [
  {
    id: 'fireRate',
    name: 'Rapid Lens',
    icon: '»',
    desc: '+25% fire rate. Your bolts come faster.',
    max: 4,
    apply: (player) => { player.upgrades.fireRate += 1; },
  },
  {
    id: 'multishot',
    name: 'Split Prism',
    icon: '✦',
    desc: '+1 bolt per shot, fanned out.',
    max: 2,
    apply: (player) => { player.upgrades.multishot += 1; },
  },
  {
    id: 'damage',
    name: 'Heavy Bolt',
    icon: '◆',
    desc: '+1 damage on every bolt.',
    max: 4,
    apply: (player) => { player.upgrades.damage += 1; },
  },
  {
    id: 'speed',
    name: 'Swift Boots',
    icon: '➤',
    desc: '+15% move speed. Outrun the dark.',
    max: 3,
    apply: (player) => { player.upgrades.speed += 1; },
  },
  {
    id: 'pierce',
    name: 'Piercing Light',
    icon: '↗',
    desc: 'Bolts pierce +1 enemy each.',
    max: 2,
    apply: (player) => { player.upgrades.pierce += 1; },
  },
  {
    id: 'hull',
    name: 'Aegis Plating',
    icon: '⛨',
    desc: '+1 max hull, and repair 1 hull now.',
    max: 3,
    apply: (player) => {
      player.maxHull += 1;
      player.hull = Math.min(player.maxHull, player.hull + 1);
    },
  },
  {
    id: 'magnet',
    name: 'Magnet Bloom',
    icon: '◎',
    desc: 'Shards fly to you from much further.',
    max: 3,
    apply: (player) => { player.upgrades.magnet += 1; },
  },
  {
    id: 'ward',
    name: 'Lighthouse Ward',
    icon: '✚',
    desc: 'Repair the lighthouse +30, +10 max.',
    max: 5,
    apply: (player, state) => {
      player.upgrades.ward += 1;
      state.lighthouse.maxHp += 10;
      state.lighthouse.hp = Math.min(state.lighthouse.maxHp, state.lighthouse.hp + 30);
    },
  },
];

function takenCount(player, id) {
  if (id === 'hull') return player.maxHull - 3;
  return player.upgrades[id] ?? 0;
}

// Offer three distinct upgrades the player can still take.
export function offerUpgrades(state) {
  const pool = UPGRADES.filter((u) => takenCount(state.player, u.id) < u.max);
  const offered = [];
  while (offered.length < 3 && pool.length > 0) {
    const i = Math.floor(state.rng() * pool.length);
    offered.push(pool.splice(i, 1)[0]);
  }
  return offered;
}

export function applyUpgrade(state, upgrade) {
  upgrade.apply(state.player, state);
}
