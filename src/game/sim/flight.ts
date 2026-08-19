import { DRONE_TYPES } from "@/game/catalog";
import { angleTo, inWorld, turnToward } from "./spatial";
import { nextRng } from "./rng";
import type { World } from "./types";

export function tickFlight(world: World, dt: number): void {
  for (const d of world.drones) {
    if (!d.live) continue;
    const type = DRONE_TYPES[d.typeId];
    d.age += dt;
    d.bob += dt * 6;
    let tx = d.x + Math.cos(d.heading) * 80;
    let ty = d.y + Math.sin(d.heading) * 80;
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
    const desired = angleTo(d.x, d.y, tx, ty);
    d.heading = turnToward(d.heading, desired, type.turnRate * dt);
    const wobble = (nextRng(world) - 0.5) * 18;
    const sp = type.speed;
    d.vx = Math.cos(d.heading) * sp;
    d.vy = Math.sin(d.heading) * sp + Math.sin(d.bob) * 8 + wobble * 0.15;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (!inWorld(d.x, d.y) && d.age > 1.2) {
      d.live = false;
      d.life = "dead";
    }
  }
}
