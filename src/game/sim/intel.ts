import { DRONE_TYPES, SITE_TYPES } from "@/game/catalog";
import type { SideId } from "@/game/catalog/ids";
import { dist2 } from "./spatial";
import type { DroneState, SiteState, World } from "./types";

export function spottedMap(owner: SideId): Record<SideId, boolean> {
  return { west: owner === "west", east: owner === "east" };
}

export function siteKnown(site: SiteState, side: SideId): boolean {
  return site.side === side || site.spotted[side];
}

export function inRadar(world: World, side: SideId, x: number, y: number): boolean {
  for (const s of world.sites) {
    if (!s.alive || s.side !== side) continue;
    const t = SITE_TYPES[s.typeId];
    if (!t.isRadar || t.radarRange <= 0) continue;
    if (dist2(s.x, s.y, x, y) <= t.radarRange * t.radarRange) return true;
  }
  return false;
}

export function droneKnown(world: World, d: DroneState, side: SideId): boolean {
  if (d.side === side) return true;
  return inRadar(world, side, d.x, d.y);
}

export function revealSite(site: SiteState, side: SideId, now: number): boolean {
  if (site.spotted[side]) return false;
  site.spotted[side] = true;
  site.markedUntil = Math.max(site.markedUntil, now + 28);
  return true;
}

export function tickIntel(world: World): void {
  for (const d of world.drones) {
    if (!d.live) continue;
    const r = DRONE_TYPES[d.typeId].spotRange;
    if (r <= 0) continue;
    const r2 = r * r;
    for (const site of world.sites) {
      if (!site.alive || site.side === d.side) continue;
      if (dist2(d.x, d.y, site.x, site.y) > r2) continue;
      if (!revealSite(site, d.side, world.time)) continue;
      world.events.push({ kind: "mark", side: d.side, x: site.x, y: site.y, label: site.name });
    }
  }
}
