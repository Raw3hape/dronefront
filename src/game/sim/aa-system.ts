import { DIFFICULTIES, DRONE_TYPES, SITE_TYPES } from "@/game/catalog";
import { siteMoving } from "./build";
import { muzzle } from "./fx";
import { nextRng } from "./rng";
import { angleTo, dist2 } from "./spatial";
import { allocShot } from "./world";
import type { World } from "./types";

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
    let pick: (typeof world.drones)[number] | null = null;
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
    const type = DRONE_TYPES[pick.typeId];
    const hitRoll = nextRng(world);
    const lead = 0.18 + (1 - type.aaProfile) * 0.12;
    const tx = pick.x + pick.vx * lead;
    const ty = pick.y + pick.vy * lead;
    const ang = angleTo(site.x, site.y, tx, ty);
    const shot = allocShot(world);
    if (!shot) continue;
    const profile = Math.min(0.96, type.aaProfile * (pick.jammed ? 1.35 : 1));
    const miss = hitRoll > profile * acc ? 0.35 : 0;
    const jitter = (nextRng(world) - 0.5) * miss;
    shot.live = true;
    shot.id = world.nextId++;
    shot.kind = "aa";
    shot.side = site.side;
    shot.x = site.x;
    shot.y = site.y;
    shot.vx = Math.cos(ang + jitter) * t.aaSpeed;
    shot.vy = Math.sin(ang + jitter) * t.aaSpeed;
    shot.ttl = t.aaSpeed > 0 ? (range / t.aaSpeed) * 1.2 : 0;
    shot.dmg = t.aaDamage * aaMul;
    shot.targetDroneId = pick.id;
    site.fireCd = 1 / (t.aaRate * aaMul);
    muzzle(world, site.x, site.y, ang + jitter);
    world.events.push({ kind: "aa", side: site.side, x: site.x, y: site.y });
  }
}
