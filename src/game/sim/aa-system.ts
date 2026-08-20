import { DIFFICULTIES, DRONE_TYPES, SITE_TYPES, type SiteType } from "@/game/catalog";
import { siteMoving } from "./build";
import { muzzle } from "./fx";
import { nextRng } from "./rng";
import { angleTo, dist2 } from "./spatial";
import { allocShot } from "./world";
import type { DroneState, SiteState, World } from "./types";

function fireVolley(
  world: World,
  site: SiteState,
  t: SiteType,
  pick: DroneState,
  range: number,
  acc: number,
  aaMul: number,
): void {
  const type = DRONE_TYPES[pick.typeId];
  const gun = t.aaOrdnance === "gun";
  const lead = gun ? 0.08 + (1 - type.aaProfile) * 0.06 : 0.18 + (1 - type.aaProfile) * 0.12;
  const ang = angleTo(site.x, site.y, pick.x + pick.vx * lead, pick.y + pick.vy * lead);
  const profile = Math.min(0.96, type.aaProfile * (pick.jammed ? 1.35 : 1));
  const n = Math.max(1, t.aaBurst);
  let heading = ang;
  for (let i = 0; i < n; i++) {
    const shot = allocShot(world);
    if (!shot) break;
    const miss = nextRng(world) > profile * acc ? (gun ? 0.16 : 0.35) : 0;
    const spread = gun ? (i - (n - 1) / 2) * 0.038 : 0;
    heading = ang + (nextRng(world) - 0.5) * miss + spread;
    const muzzleOff = gun ? 10 + i * 3 : 0;
    shot.live = true;
    shot.id = world.nextId++;
    shot.kind = t.aaOrdnance;
    shot.side = site.side;
    shot.x = site.x + Math.cos(heading) * muzzleOff;
    shot.y = site.y + Math.sin(heading) * muzzleOff;
    shot.vx = Math.cos(heading) * t.aaSpeed;
    shot.vy = Math.sin(heading) * t.aaSpeed;
    shot.ttl = t.aaSpeed > 0 ? (range / t.aaSpeed) * 1.2 : 0;
    shot.dmg = t.aaDamage * aaMul;
    shot.targetDroneId = pick.id;
  }
  muzzle(world, site.x, site.y, heading, t.aaOrdnance);
  world.events.push({ kind: gun ? "gun" : "aa", side: site.side, x: site.x, y: site.y });
}

export function tickAa(world: World, dt: number): void {
  const diff = DIFFICULTIES[world.difficultyId];
  for (const site of world.sites) {
    if (!site.alive) continue;
    const t = SITE_TYPES[site.typeId];
    if (!t.isAa) continue;
    if (siteMoving(site)) continue;
    site.fireCd -= dt;
    if (site.fireCd > 0) continue;
    const bot = site.side !== world.playerSide;
    const acc = bot ? diff.botAccuracy : 1;
    const aaMul = bot ? diff.aaMul : 1;
    const range = t.aaRange * aaMul;
    const range2 = range * range;
    let pick: DroneState | null = null;
    let score = -1;
    for (const d of world.drones) {
      if (!d.live || d.side === site.side) continue;
      const dd = dist2(site.x, site.y, d.x, d.y);
      if (dd > range2) continue;
      const type = DRONE_TYPES[d.typeId];
      const s = type.aggro * (1.2 - Math.sqrt(dd) / range) * (d.jammed ? 1.25 : 1);
      if (s > score) {
        score = s;
        pick = d;
      }
    }
    if (!pick) continue;
    fireVolley(world, site, t, pick, range, acc, aaMul);
    site.fireCd = 1 / (t.aaRate * aaMul);
  }
}
