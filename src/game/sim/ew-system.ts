import { DRONE_TYPES, EW_IMMUNE, SITE_TYPES } from "@/game/catalog";
import { dist2 } from "./spatial";
import { nextRng } from "./rng";
import { burst } from "./fx";
import type { World } from "./types";

export function tickEw(world: World, dt: number): void {
  for (const d of world.drones) d.jammed = false;
  for (const site of world.sites) {
    if (!site.alive) continue;
    const t = SITE_TYPES[site.typeId];
    if (!t.isEw) continue;
    const range2 = t.ewRange * t.ewRange;
    for (const d of world.drones) {
      if (!d.live || d.side === site.side) continue;
      if (dist2(site.x, site.y, d.x, d.y) > range2) continue;
      const type = DRONE_TYPES[d.typeId];
      if (type.ewProfile < EW_IMMUNE) continue;
      d.jammed = true;
      const drop = t.ewJam * type.ewProfile * dt;
      if (nextRng(world) < drop) {
        d.hp -= 4 + type.ewProfile * 10;
        burst(world, d.x, d.y, "spark", site.side, 3);
        if (d.hp <= 0) {
          d.live = false;
          d.life = "dead";
          world.stats[site.side].killed += 1;
          world.stats[d.side].lost += 1;
          world.events.push({
            kind: "jam",
            side: d.side,
            x: d.x,
            y: d.y,
            label: type.names[d.side],
          });
          burst(world, d.x, d.y, "flash", site.side, 8);
        }
      }
    }
  }
}
