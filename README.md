# Lumen Keep

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/ydhtma/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/ydhtma/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Defend the last lighthouse. Ten waves. One dawn.

A complete arcade wave-defense game, built for make.fun's "Make the best game"
bounty. You are the Warden of the last lighthouse in a void sea. Creatures
drift in from the dark to eat its light: hold the line through 10 waves,
pick an upgrade after each cleared wave, and slay the Void Maw on wave 10
to win. If the lighthouse falls — or you do — the night wins.

## How to play

- **WASD / Arrow keys** — move
- **Mouse** — aim
- **Click or Space** — fire light bolts
- **Shift** — dash (brief invulnerability, short cooldown)
- **P** — pause · **M** — mute · **R** — restart after the end

Between waves, choose 1 of 3 upgrades: faster fire, split shots, heavier
bolts, piercing light, more speed, hull plating, a shard magnet, or a
lighthouse ward. Kills chain into a score combo (up to x5); fallen enemies
drop light shards and, rarely, hull repairs.

## The creatures

- **Motes** — slow spiked orbs that nibble the lighthouse and pop.
- **Darters** — fast darts that lunge at the Warden up close.
- **Splitters** — armoured hexagons that break into two motes.
- **Spitters** — keep their distance and lob globs at the light.
- **The Void Maw** — the wave-10 boss: charges, spawns motes, and bites hard.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

The game is plain static files under `game/` — no build step, no network
request, no library. Sound is synthesized live with WebAudio; there are no
audio assets. Screenshots in `screenshots/` are real renders of the game's
own code in a browser (`?shot=start|play|upgrade|win&seed=1` replays each
scene deterministically).

## Enter it

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the kit's vendored
`vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
