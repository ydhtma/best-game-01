# Build Log — best-game-01: Lumen Keep

Entry: an original arcade wave-defense game. The Warden defends the last
lighthouse against 10 waves of void creatures, picks 1 of 3 upgrades after
each cleared wave, and slays the Void Maw boss on wave 10 to win.

## Step 1 — Anchor (17 Nov 2026, 06:52 WIB / 16 Nov 23:52 UTC)
- Kit unpacked from `entries/_kits/kit-best-game-01.zip` (a gzip tarball,
  not a zip) to `entries/_kits/best-game-01-kit/`; RULES.txt + kit.json +
  requirements read in full.
- `node ../_kits/best-game-01-kit/cli/makefun.mjs init --license MIT --keypair ~/workspace/services/make-fun/makefun-keypair.json`
  - Output: `makefun anchor 3872a1fd50deb4d49eb560e68ea923095a9508d1 round 34023298`
  - Root commit `3872a1fd` holds only `.makefun/freshness.json` (drand round
    34023298, wallet G5geqUEHofVpWrdKZZjdWEuGBfec5fDG3oShwpL1h5ZQ);
    LICENSE commit `05a2299` follows. Anchor printed before any code was
    written (thinking_fresh).
- Egress: ambient proxy env only, `SSL_CERT_FILE=/run/hatch/egress-tls/ca-bundle.pem`
  (never sourced `~/.config/proxy.env`).

## Step 2 — Write the game (all code authored in this session)
- `game/index.html` — canvas 1280x800, module entry.
- `game/src/config.js` — tuning, palette, wave table (10 waves).
- `game/src/random.js` — seedable mulberry32 RNG; `?seed=` replays.
- `game/src/input.js` — keyboard + mouse; scripted input for screenshots.
- `game/src/audio.js` — WebAudio synthesized SFX + pad music, no assets.
- `game/src/entities.js` — player, bullets, 5 enemy kinds, boss, pickups,
  particles, lighthouse zap, telegraphed bites (1.0s windup + knockback).
- `game/src/waves.js` — spawn director, wave-clear detection.
- `game/src/upgrades.js` — 8 upgrades, offer 3, apply 1.
- `game/src/render.js` — background, entities, HUD, title / upgrade /
  win / over / paused screens, all drawn on canvas.
- `game/src/shots.js` — `?shot=start|play|upgrade|end|win` scenes: the real
  rules played forward by an autopilot, deterministic per seed; plus
  `?selftest=1` headless balance check.
- `game/src/main.js` — boot, game loop, mode machine, `?shot=` handling.
- `main.ts` — entrypoint: copies game/ + screenshots/ to /output, writes
  dossier.json via vendored `vendor/makefun-game.ts` (kit copy, sha256
  verified `dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129`).
- `serve.ts`, `README.md`, `shots.json` — local server, docs, shot list.

## Step 3 — Balance loop (headless selftest, `?selftest=1`, Chrome)
- v1: autopilot lost wave 3, lighthouse 0 HP. Root causes found and fixed:
  - No aim lead (bullets missed moving targets) → lead by real velocity.
  - Kamikaze bites with no warning → 1.0s telegraphed windup + knockback.
  - One Warden cannot cover 4 directions → lighthouse zap (3 dmg / 0.9s,
    range 280).
  - Darter permanent chase kited forever → 0.7s lunge, 2.5s cooldown.
  - **NaN bug**: `newPlayer()` never set `radius` → `p.radius` undefined →
    player position NaN on step 1, 0 bullet hits in 181 shots. Fixed by
    adding `radius: PLAYER.radius`; added a finite watchdog to shots.js.
- Final (8 seeds, autopilot with perfect aim): 5 wins / 8, losses at waves
  7–9, lighthouse 94–120 HP left in losses. Wins: score 96,718–119,378,
  286–287 kills, 3:23 play time. Winnable, challenging, fair.

## Step 4 — Screenshots (real renders, headless Chrome 157, 1280x800)
- `node serve.ts --port 8899` (8080 is taken by zcode-gateway).
- `google-chrome --headless=new --screenshot --window-size=1280,800
  --virtual-time-budget=12000 "http://127.0.0.1:8899/?shot=<scene>&seed=1"`
  then PNG→JPEG quality 82.
- 1-start.jpg 62,782 B — title screen, controls, best score.
- 2-play.jpg 46,258 B — wave 8 mid-fight, COMBO x5 (168), 184 kills,
  bullet streaks, splitter + darter visible.
- 3-upgrade.jpg 67,604 B — wave 1 cleared, 3 upgrade cards.
- 4-win.jpg 59,216 B — full-game victory: score 106,096, 286 kills,
  10/10 waves, 3:23, "PRESS R TO PLAY AGAIN".
- All ≤ 256 KiB, long side 1280, short side 800. The win shot plays the
  whole game from wave 1 (a jump to wave 10 showed a hollow 2-kill win
  in 0:02 and was rejected).

## Step 5 — Dossier (local run)
- `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` → out/dossier.json
  (+ game/, screenshots/). See Step 7 for the check result.

## Step 6 — Commits
- `git -c user.name=<wallet> -c user.email=<wallet> commit` on top of the
  anchor root; history never rewritten.

## Step 7 — Kit gate check (17 Nov 2026, ~00:20 WIB)
- Determinism: `MAKEFUN_OUTPUT_DIR=/tmp/out1 node main.ts` vs `/tmp/out2`
  → `diff -r` identical (the grader runs the program twice; both runs must
  write the same bytes). dossier.json 391,419 B, out/ 716K, 16 files.
- Gate caps (local): game/ 11 files / 13 entries / 73,225 B (cap 993 /
  48 MiB); index.html 577 B (cap 1 MiB); 0 symlinks; no network reference
  in any game/ file (grep `https?://` clean); screenshots 4 × ≤ 67,604 B
  (cap 256 KiB), 1280x800 (long ≤ 1280, short ≥ 480).
- `grade-local`: NOT applicable — this kit carries no practice instance
  (no practice/ dir); RULES.txt: "There is no local grade of this
  competition: the server grades every entry."
- `makefun check`: BLOCKED on transcripts — it needs --transcripts, and
  the bundle below was refused, so no check result exists yet.
- `makefun bundle` (real run, --no-family, both Muse app session dirs):
  REFUSED, no file written. Exactly 2 run-record items missing:
  (1) the prompt — the earliest session opens with no message of the
  person's in words (the user's verbatim Wave 2 order is not in this
  session, the parent session, or the top-level session file);
  (2) --harness-version — no Muse app version is recorded anywhere
  reachable (no `muse` binary, no version file).
  Plus a warning, not a refusal: 0 muse-usage rows — subagent rows are
  written only once the run completes, so the top-level agent must run
  the SELECT (agent ids 47744917-... and d5a19065-...) after this run
  ends, then re-run bundle with --muse-usage.
- To finish (for the top-level agent): supply --prompt-file (user's
  verbatim words) + --prompt-origin handed-off + --prompt-via, supply
  --harness-version, attach --muse-usage, re-run bundle, then
  `makefun check --kit <kit> --repo <repo> --transcripts transcripts.tar.gz`,
  then submit (NOT in this session: submit is out of scope here).

