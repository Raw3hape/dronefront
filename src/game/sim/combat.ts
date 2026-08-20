import { DRONE_TYPES, OTHER_SIDE, SITE_TYPES } from "@/game/catalog";
import { MARK_BONUS } from "./constants";
import { dist2 } from "./spatial";
import { burst } from "./fx";
import type { DroneState, World } from "./types";

function killDrone(world: World, d: DroneState, by: DroneState["side"]): void {
  d.live = false;
  d.life = "dead";
  world.stats[by].killed += 1;
  world.stats[d.side].lost += 1;
  world.events.push({
    kind: "kill",
    side: d.side,
    x: d.x,
    y: d.y,
    label: DRONE_TYPES[d.typeId].names[d.side],
  });
  burst(world, d.x, d.y, "burst", d.side, 10);
}

export function tickCombat(world: World, dt: number): void {
  for (const s of world.shots) {
    if (!s.live) continue;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.ttl -= dt;
    if (s.ttl <= 0) {
      s.live = false;
      continue;
    }
    for (const d of world.drones) {
      if (!d.live || d.side === s.side) continue;
      const pad = s.kind === "gun" ? 3 : 6;
      const r = DRONE_TYPES[d.typeId].radius + pad;
      if (dist2(s.x, s.y, d.x, d.y) > r * r) continue;
      d.hp -= s.dmg;
      s.live = false;
      burst(world, s.x, s.y, "spark", s.side, 4);
      if (d.hp <= 0) killDrone(world, d, s.side);
      break;
    }
  }

  for (const d of world.drones) {
    if (!d.live) continue;
    const type = DRONE_TYPES[d.typeId];
    if (type.role === "intercept" && d.targetDroneId != null) {
      const prey = world.drones.find((o) => o.live && o.id === d.targetDroneId);
      if (prey) {
        const r = type.radius + DRONE_TYPES[prey.typeId].radius;
        if (dist2(d.x, d.y, prey.x, prey.y) < r * r + 36) {
          prey.hp -= type.interceptDmg;
          burst(world, d.x, d.y, "spark", d.side, 5);
          if (prey.hp <= 0) killDrone(world, prey, d.side);
          killDrone(world, d, prey.side);
        }
      }
    }
    if (!d.targetSiteId) continue;
    const site = world.sites.find((s) => s.id === d.targetSiteId);
    if (!site || !site.alive) continue;
    const reach = SITE_TYPES[site.typeId].radius + type.radius;
    if (dist2(d.x, d.y, site.x, site.y) > reach * reach) continue;
    if (type.role === "recon") {
      site.markedUntil = world.time + 28;
      world.events.push({ kind: "mark", side: d.side, x: site.x, y: site.y, label: site.name });
      d.live = false;
      d.life = "dead";
      burst(world, site.x, site.y, "ring", d.side, 6);
      continue;
    }
    if (type.role === "decoy") {
      d.live = false;
      d.life = "dead";
      burst(world, d.x, d.y, "flash", d.side, 5);
      continue;
    }
    if (type.role === "intercept") continue;
    const mark = site.markedUntil > world.time ? MARK_BONUS : 1;
    const dmg = type.payload * mark;
    site.hp -= dmg;
    world.stats[d.side].damage += dmg;
    world.events.push({ kind: "hit", side: d.side, x: site.x, y: site.y, label: site.name });
    burst(world, site.x, site.y, "burst", d.side, 14);
    d.live = false;
    d.life = "dead";
    if (site.hp <= 0) {
      site.alive = false;
      site.hp = 0;
      world.events.push({ kind: "site", side: site.side, x: site.x, y: site.y, label: site.name });
      burst(world, site.x, site.y, "burst", OTHER_SIDE[site.side], 18);
    }
  }
}
