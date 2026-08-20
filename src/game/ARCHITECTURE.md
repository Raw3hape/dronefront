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
- LoC is lon/lat in `catalog/frontline.ts`, projected per theater bbox.

## Sides

- `west` | `east`. Player picks one. The other is the bot.
- Own ground = `sideAt(theater, x, y)` vs the Aug 2026 LoC, not WORLD_W/2.

## Victory

- Win: enemy **HQ** is dead.
- Lose: player HQ is dead.
- Yards (factory, ammo, …) feed the war; ПВО / РЭБ are not victory targets.

## Build

- Matches seed only HQ (also an airfield). Player and bot place the rest.
- Place on own side of the LoC, `MIN_SITE_GAP`, `MAX_SITES_PER_SIDE`.
- `placeSite` in `sim/build.ts`. Bot uses theater `slots`.

## Launch

- Player selects a drone type, then a target site or a hunt (interceptor).
- Interceptor needs a live inbound in range. Empty-map tap hunts the nearest. No HQ suicide hops.
- Multiple queued orders allowed (`LaunchOrder[]`).
- Spawn at nearest living airfield of that side; else HQ; else first living site.
- Catalog `range` is max path in world units. Spawn `fuel = range`.
- Launch blocked if nearest pad → target > range × 0.9 (`sim/range.ts`).
- Bingo crash at fuel 0. Jammed radio drones burn 1.4×.
- AA shot ttl = aaRange / aaSpeed (missiles die on the battery ring).
- Player ПВО uses catalog stats; `botAccuracy` / `aaMul` apply only to the bot.
- HUD km = range × `KM_PER_UNIT` (0.5).

## Systems order each tick

economy → bot AI → spawn queue → EW jam → flight → intercept acquire →
AA fire → projectiles/damage → fx age → win check → event drain

## Files

Keep each module < 180 lines. No god files. No dead exports.
