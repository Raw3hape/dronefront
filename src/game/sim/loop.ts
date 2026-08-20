import { tickEconomy } from "./economy";
import { tickSpawn } from "./spawn";
import { tickFlight } from "./flight";
import { tickInterceptAcquire } from "./intercept";
import { tickAa } from "./aa-system";
import { tickEw } from "./ew-system";
import { tickCombat } from "./combat";
import { tickFx } from "./fx";
import { tickWin } from "./win";
import { tickRelocate } from "./build";
import { tickIntel, droneKnown, siteKnown } from "./intel";
import { tickBot } from "@/game/ai/bot";
import { SITE_TYPES } from "@/game/catalog";
import { OTHER_SIDE } from "@/game/catalog/factions";
import type { HudSnap, World } from "./types";

export function tickWorld(world: World, dt: number): void {
  if (world.phase !== "play") {
    tickFx(world, dt);
    return;
  }
  world.time += dt;
  world.tick += 1;
  tickEconomy(world, dt);
  tickRelocate(world, dt);
  tickBot(world, dt);
  tickSpawn(world, dt);
  tickEw(world, dt);
  tickFlight(world, dt);
  tickIntel(world);
  tickInterceptAcquire(world);
  tickAa(world, dt);
  tickCombat(world, dt);
  tickFx(world, dt);
  tickWin(world);
}

export function snapHud(world: World): HudSnap {
  const me = world.playerSide;
  const them = OTHER_SIDE[me];
  let ownS = 0;
  let enemyS = 0;
  let ownT = 0;
  let enemyT = 0;
  for (const s of world.sites) {
    if (!SITE_TYPES[s.typeId].strategic) continue;
    if (s.side === me) {
      ownT += 1;
      if (s.alive) ownS += 1;
    } else if (siteKnown(s, me)) {
      enemyT += 1;
      if (s.alive) enemyS += 1;
    }
  }
  let inbound = 0;
  let airborne = 0;
  for (const d of world.drones) {
    if (!d.live) continue;
    if (d.side === me) airborne += 1;
    else if (droneKnown(world, d, me)) inbound += 1;
  }
  const ownHq = world.sites.find((s) => s.side === me && s.typeId === "hq");
  const enemyHq = world.sites.find((s) => s.side === them && s.typeId === "hq");
  return {
    time: world.time,
    phase: world.phase,
    stocks: { ...world.stocks[me] },
    ownStrategic: ownS,
    enemyStrategic: enemyS,
    ownTotal: ownT,
    enemyTotal: enemyT,
    inbound,
    airborne,
    ownHq: ownHq && ownHq.maxHp > 0 ? ownHq.hp / ownHq.maxHp : 0,
    enemyHq:
      enemyHq && siteKnown(enemyHq, me) && enemyHq.maxHp > 0 ? enemyHq.hp / enemyHq.maxHp : -1,
    stats: { ...world.stats[me] },
  };
}
