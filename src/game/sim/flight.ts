import { DRONE_TYPES, JAM_FUEL, SITE_TYPES } from "@/game/catalog";
import { angleTo, dist2, inWorld, turnToward } from "./spatial";
import { nextRng } from "./rng";
import { burst } from "./fx";
import type { World } from "./types";

export function tickFlight(world: World, dt: number): void {
  for (const d of world.drones) {
    if (!d.live) continue;
    const type = DRONE_TYPES[d.typeId];
    d.age += dt;
    d.bob += dt * 6;
    let tx = d.destX;
    let ty = d.destY;
    if (d.life === "hunt" && d.targetDroneId != null) {
      const prey = world.drones.find((o) => o.live && o.id === d.targetDroneId);
      if (prey) {
        tx = prey.x;
        ty = prey.y;
      }
    } else if (d.targetSiteId) {
      const site = world.sites.find((s) => s.id === d.targetSiteId);
      if (site && site.alive) {
        tx = site.x;
        ty = site.y;
      }
    }
    const toDest = Math.hypot(tx - d.x, ty - d.y);
    const loiter = type.role === "recon" && toDest < 28;
    const desired = loiter ? d.heading + 1.1 : angleTo(d.x, d.y, tx, ty);
    d.heading = turnToward(d.heading, desired, type.turnRate * dt);
    const wobble = (nextRng(world) - 0.5) * 18;
    let sp = type.speed;
    if (d.jammed) {
      let slow = 0.62;
      for (const site of world.sites) {
        if (!site.alive || site.side === d.side) continue;
        const st = SITE_TYPES[site.typeId];
        if (!st.isEw) continue;
        if (dist2(site.x, site.y, d.x, d.y) > st.ewRange * st.ewRange) continue;
        slow = Math.min(slow, st.ewSlow + (1 - type.ewProfile) * 0.3);
      }
      sp *= slow;
    }
    if (loiter) sp *= 0.55;
    d.vx = Math.cos(d.heading) * sp;
    d.vy = Math.sin(d.heading) * sp + Math.sin(d.bob) * 8 + wobble * 0.15;
    const x0 = d.x;
    const y0 = d.y;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    let burn = Math.hypot(d.x - x0, d.y - y0);
    if (d.jammed) burn *= JAM_FUEL;
    d.fuel -= burn;
    if (d.fuel <= 0 || (!inWorld(d.x, d.y) && d.age > 1.2)) {
      d.fuel = 0;
      d.live = false;
      d.life = "dead";
      world.stats[d.side].lost += 1;
      world.events.push({
        kind: "bingo",
        side: d.side,
        x: d.x,
        y: d.y,
        label: type.names[d.side],
      });
      burst(world, d.x, d.y, "smoke", d.side, 6);
    }
  }
}
