# DRONEFRONT — architecture contract

Single-player 2D operational command game. Canvas sim + DOM overlay.
Do not invent parallel types. Import from `@/game/catalog` and `@/game/sim/types`.

## Loop

- `requestAnimationFrame` only. Cap dt at 0.1s.
- Fixed sim step `SIM_DT = 1/30` in `src/game/sim/loop.ts`.
- Render interpolates with leftover accumulator. Never put gameplay in setInterval.

## Data

- Catalogs are the only balance/content source. No magic numbers in systems except
  geometric epsilons.
- Theaters, factions, drone types, site types, difficulties: frozen objects.
- World is a plain serializable object (`World` in `types.ts`).

## Sides

- `west` | `east`. Player picks one. The other is the bot.
- West occupies x < WORLD_W/2, east the rest. Sites never straddle the river.

## Victory

- Win: every enemy **strategic** site is dead (`strategic: true` in site catalog).
- Lose: every player strategic site is dead.
- AA batteries are not strategic.

## Launch

- Player selects a drone type, then a target site (strike/recon/decoy/bomber)
  or an incoming drone / empty hunt (interceptor).
- Multiple queued orders allowed (`LaunchOrder[]`).
- Spawn at nearest living airfield of that side; else HQ; else first living site.

## Systems order each tick

input consume → economy → bot AI → spawn queue → flight → intercept acquire →
AA fire → projectiles → collisions/damage → fx age → win check → event drain

## Files

Keep each module < 180 lines. No god files. No dead exports.
