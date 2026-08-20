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
- LoC is lon/lat in `catalog/loc.json` (baker + sim share it), projected per theater bbox.
- Theaters: `depth` (default; Ukraine — European Russia to the Urals), `front`, `north`, `south`.
  Full Pacific Russia is not a theater — that bbox would collapse FPV range to a postage stamp.
- North of Kupyansk the line is the internationally recognized UA–RU border. North of that
  vertex (`y < locLine[0].y`) `locXAtY` returns 0: the whole northern band is east
  (Moscow, St. Petersburg, Urals). Kaliningrad is an east exclave. Never a vertical cut
  through Kursk/Orel.
- Sprites are orthographic top-down (drones nose-up, sites roof-plan, missiles +X) on keyed transparency. Bake with `scripts/chroma-sprites.py` from `assets/sprites/new/<id>/raw-sheet.png`.
- FX sheets: explode 3×3 (9 frames), missile 2×4 (8), muzzle 2×2 (4). Rotor discs are code-drawn from catalog `rotor`.

## Sides

- `west` | `east`. Player picks one. The other is the bot.
- Own ground = `sideAt(theater, x, y)` vs the Aug 2026 LoC, not WORLD_W/2.
- On `depth`, north of the LoC is east (Moscow, St. Petersburg, Urals). Kaliningrad stays east.

## Victory

- Win: enemy **HQ** is dead.
- Lose: player HQ is dead.
- Yards (factory, ammo, …) feed the war; ПВО / РЭБ are not victory targets.

## Build

- Theaters may seed HQ plus yards. Seeded yards are still placeable (`placeable: true`);
  they occupy `MAX_SITES_PER_SIDE` (16) slots.
- Place on own side of the LoC, `MIN_SITE_GAP`, `MAX_SITES_PER_SIDE`.
- `placeSite` in `sim/build.ts`. Bot uses theater `slots`.

## AA tiers

Catalog-only. `aa` is the medium SAM. All types carry `value` (strike priority),
`mobile`, `relocateSpeed` (wu/s, 0 = cannot move).

- `mog` — МОГ, cheap mobile fire group vs FPV. `aaOrdnance: "gun"`, `aaBurst: 3` (code-drawn tracers, not SAM sprites).
- `shorad` — Pantsir/Gepard class, mid ring, mobile, missiles.
- `aa` — medium SAM, slow relocate.
- `longsam` — Patriot/S-300 class, long ring, fixed (`mobile: false`).
- `radar` — air picture, `radarRange` (same band as medium SAM). Mobile. Enemy drones
  are drawn only inside a living friendly radar ring.

`BUILD_ORDER`: mog, shorad, radar, aa, longsam, ew, then yards.

## Intel

- Enemy **sites** start unknown (`spotted[side] = false`). Own sites are known.
- A recon drone (`spotRange` in the catalog) flying within that radius permanently
  reveals the yard. Revealed yards stay on the map and can be struck.
- Recon is waypointed: tap the map to launch, tap the bird then the map to steer
  (same click pattern as relocating ПВО). It loiters at dest until bingo — it does
  not kamikaze.
- Strike `enqueue` requires `siteKnown`. Interceptor launch and in-flight acquire require `droneKnown`.
- HUD / minimap / dock hide unknown enemy yards and air contacts.
- Bot inbound census and extra-AA builds use radar picture only. Airfield siting uses known enemy yards, not fogged HQ.
- `WORLD_W/H` come from `loc.json` (sim constants import the catalog). `EW_IMMUNE` / `JAM_FUEL` live on the drone catalog.

## Relocate

- Mobile living sites on the player's side can be retasked in Fortify.
- `canMove` / `moveSite` set `destX`/`destY` (no teleport). Same checks as place
  except afford / type / cap; skip gap vs self; own side of the LoC only.
- `tickRelocate` lerps at `relocateSpeed`. While hypot(dest−pos) > 2 the site is
  moving: `fireCd` stays > 0 and AA does not shoot. Snap when close.
- `createWorld` sets `destX`/`destY` after site `x`,`y` exist (theaters may use lon/lat).

## Launch

- Player selects a drone type, then a target site or a hunt (interceptor).
- Interceptor needs a live inbound in range. Empty-map tap hunts the nearest. No HQ suicide hops.
- Multiple queued orders allowed (`LaunchOrder[]`).
- Spawn at nearest living airfield of that side; else HQ; else first living site.
- Catalog `range` is max path in world units. Spawn `fuel = range`.
- Launch blocked if nearest pad → target > range × 0.9 (`sim/range.ts`).
- Bingo crash at fuel 0. Jammed radio drones burn 1.4×.
- AA shot ttl = aaRange / aaSpeed × 1.2. `aaOrdnance` on the catalog type picks
  `gun` (code-drawn tracers) or `missile` (sprite). `aaBurst` is the volley size
  (МОГ fires three bullets per trigger). No type-id branches in render.
- Player ПВО uses catalog stats; `botAccuracy` / `aaMul` apply only to the bot.
- HUD km = range × `KM_PER_UNIT` (0.5).
- Drone catalog speeds are ~0.58× the old hop so the map reads as an operational theater.

## Systems order each tick

economy → relocate → bot AI → spawn queue → EW jam → flight → intel → intercept acquire →
AA fire → projectiles/damage → fx age → win check → event drain

## Files

Keep each module < 180 lines. No god files. No dead exports.
