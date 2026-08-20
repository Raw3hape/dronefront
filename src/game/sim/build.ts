import { SITE_TYPES, canAfford, payCost, sideAt } from "@/game/catalog";
import type { SideId, SiteTypeId } from "@/game/catalog/ids";
import { MAX_SITES_PER_SIDE, MIN_SITE_GAP, WORLD_H, WORLD_W } from "./constants";
import { dist2 } from "./spatial";
import type { SiteState, World } from "./types";
import { burst } from "./fx";
import { spottedMap } from "./intel";

export type PlaceFail = "phase" | "type" | "afford" | "side" | "gap" | "cap" | "edge";
export type MoveFail = "phase" | "type" | "side" | "gap" | "edge" | "dead";

function countSide(world: World, side: SideId): number {
  let n = 0;
  for (const s of world.sites) if (s.side === side && s.alive) n += 1;
  return n;
}

function inBounds(x: number, y: number): boolean {
  return x >= 48 && y >= 48 && x <= WORLD_W - 48 && y <= WORLD_H - 48;
}

export function siteMoving(site: Pick<SiteState, "x" | "y" | "destX" | "destY">): boolean {
  return Math.hypot(site.destX - site.x, site.destY - site.y) > 2;
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
  if (!inBounds(x, y)) return "edge";
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
    destX: x,
    destY: y,
    hp: t.hp,
    maxHp: t.hp,
    fireCd: 0.4,
    markedUntil: 0,
    spotted: spottedMap(side),
    alive: true,
  });
  world.events.push({ kind: "build", side, x, y, label: t.name });
  burst(world, x, y, "flash", side, 8);
  return true;
}

export function canMove(world: World, siteId: string, x: number, y: number): MoveFail | null {
  if (world.phase !== "play") return "phase";
  const site = world.sites.find((s) => s.id === siteId);
  if (!site || !site.alive) return "dead";
  if (!SITE_TYPES[site.typeId].mobile) return "type";
  if (!inBounds(x, y)) return "edge";
  if (sideAt(world.theaterId, x, y) !== site.side) return "side";
  const gap2 = MIN_SITE_GAP * MIN_SITE_GAP;
  for (const s of world.sites) {
    if (s.id === siteId) continue;
    if (dist2(s.x, s.y, x, y) < gap2) return "gap";
  }
  return null;
}

export function moveSite(world: World, siteId: string, x: number, y: number): boolean {
  if (canMove(world, siteId, x, y)) return false;
  const site = world.sites.find((s) => s.id === siteId);
  if (!site) return false;
  site.destX = x;
  site.destY = y;
  return true;
}

export function tickRelocate(world: World, dt: number): void {
  for (const s of world.sites) {
    if (!s.alive) continue;
    const t = SITE_TYPES[s.typeId];
    if (!t.mobile || t.relocateSpeed <= 0) continue;
    const dx = s.destX - s.x;
    const dy = s.destY - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 2) {
      s.x = s.destX;
      s.y = s.destY;
      continue;
    }
    s.fireCd = Math.max(s.fireCd, 0.2);
    const step = t.relocateSpeed * dt;
    if (step >= dist) {
      s.x = s.destX;
      s.y = s.destY;
    } else {
      s.x += (dx / dist) * step;
      s.y += (dy / dist) * step;
    }
  }
}
