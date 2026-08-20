import { DRONE_TYPES, SITE_TYPES } from "@/game/catalog";
import type { DroneTypeId, SideId } from "@/game/catalog/ids";
import { dist2 } from "./spatial";
import type { LaunchOrder, SiteState, World } from "./types";

/** Straight-line launch gate vs catalog `range` (wobble reserve). */
export const RANGE_SLACK = 0.9;

export function padOf(world: World, side: SideId, tx: number, ty: number): SiteState | null {
  let best: SiteState | null = null;
  let bestD = Infinity;
  for (const s of world.sites) {
    if (!s.alive || s.side !== side) continue;
    if (!SITE_TYPES[s.typeId].isAirfield) continue;
    const d = dist2(s.x, s.y, tx, ty);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  if (best) return best;
  return world.sites.find((s) => s.alive && s.side === side) ?? null;
}

export function livingEnemySite(world: World, side: SideId): SiteState | null {
  return (
    world.sites.find((s) => s.alive && s.side !== side && s.typeId === "hq") ??
    world.sites.find((s) => s.alive && s.side !== side) ??
    null
  );
}

export function aimOf(
  world: World,
  order: Pick<LaunchOrder, "side" | "targetSiteId" | "targetDroneId" | "wx" | "wy">,
): { x: number; y: number } {
  if (order.wx != null && order.wy != null) return { x: order.wx, y: order.wy };
  if (order.targetSiteId) {
    const t = world.sites.find((s) => s.id === order.targetSiteId && s.alive);
    if (t) return { x: t.x, y: t.y };
  }
  if (order.targetDroneId != null) {
    const d = world.drones.find((o) => o.live && o.id === order.targetDroneId);
    if (d) return { x: d.x, y: d.y };
  }
  const enemy = livingEnemySite(world, order.side);
  if (enemy) return { x: enemy.x, y: enemy.y };
  const pad = padOf(world, order.side, 0, 0);
  return { x: pad?.x ?? 0, y: pad?.y ?? 0 };
}

export function inRange(world: World, side: SideId, typeId: DroneTypeId, tx: number, ty: number): boolean {
  const pad = padOf(world, side, tx, ty);
  if (!pad) return false;
  const r = DRONE_TYPES[typeId].range * RANGE_SLACK;
  return dist2(pad.x, pad.y, tx, ty) <= r * r;
}

export function siteInRange(world: World, side: SideId, typeId: DroneTypeId, siteId: string): boolean {
  const s = world.sites.find((x) => x.id === siteId);
  if (!s || !s.alive) return false;
  return inRange(world, side, typeId, s.x, s.y);
}

export function canReachFuel(fuel: number, x: number, y: number, tx: number, ty: number): boolean {
  return dist2(x, y, tx, ty) <= fuel * fuel;
}
