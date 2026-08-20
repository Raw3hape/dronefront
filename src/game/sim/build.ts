import { SITE_TYPES, canAfford, payCost, sideAt } from "@/game/catalog";
import type { SideId, SiteTypeId } from "@/game/catalog/ids";
import { MAX_SITES_PER_SIDE, MIN_SITE_GAP, WORLD_H, WORLD_W } from "./constants";
import { dist2 } from "./spatial";
import type { World } from "./types";
import { burst } from "./fx";

export type PlaceFail = "phase" | "type" | "afford" | "side" | "gap" | "cap" | "edge";

function countSide(world: World, side: SideId): number {
  let n = 0;
  for (const s of world.sites) if (s.side === side && s.alive) n += 1;
  return n;
}

export function canPlace(
  world: World,
  side: SideId,
  typeId: SiteTypeId,
  x: number,
  y: number,
): PlaceFail | null {
  if (world.phase !== "play") return "phase";
  const t = SITE_TYPES[typeId];
  if (!t?.placeable) return "type";
  if (x < 48 || y < 48 || x > WORLD_W - 48 || y > WORLD_H - 48) return "edge";
  if (sideAt(world.theaterId, x, y) !== side) return "side";
  if (countSide(world, side) >= MAX_SITES_PER_SIDE) return "cap";
  if (!canAfford(world.stocks[side], t.build)) return "afford";
  const gap2 = MIN_SITE_GAP * MIN_SITE_GAP;
  for (const s of world.sites) {
    if (dist2(s.x, s.y, x, y) < gap2) return "gap";
  }
  return null;
}

export function placeSite(
  world: World,
  side: SideId,
  typeId: SiteTypeId,
  x: number,
  y: number,
  name?: string,
): boolean {
  const fail = canPlace(world, side, typeId, x, y);
  if (fail) return false;
  const t = SITE_TYPES[typeId];
  payCost(world.stocks[side], t.build);
  world.sites.push({
    id: `${side}-${typeId}-${world.nextId++}`,
    typeId,
    side,
    name: name ?? t.name,
    x,
    y,
    hp: t.hp,
    maxHp: t.hp,
    fireCd: 0.4,
    markedUntil: 0,
    alive: true,
  });
  world.events.push({ kind: "build", side, x, y, label: t.name });
  burst(world, x, y, "flash", side, 8);
  return true;
}
