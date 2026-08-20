import { DRONE_TYPES } from "@/game/catalog";
import { dist2 } from "./spatial";
import { canReachFuel } from "./range";
import type { World } from "./types";

export function tickInterceptAcquire(world: World): void {
  for (const d of world.drones) {
    if (!d.live) continue;
    const type = DRONE_TYPES[d.typeId];
    if (type.role !== "intercept") continue;
    d.life = "hunt";
    if (d.targetDroneId != null) {
      const prey = world.drones.find((o) => o.live && o.id === d.targetDroneId);
      if (prey && canReachFuel(d.fuel, d.x, d.y, prey.x, prey.y)) continue;
      d.targetDroneId = null;
    }
    let best: number | null = null;
    let bestD = Infinity;
    for (const o of world.drones) {
      if (!o.live || o.side === d.side) continue;
      if (!canReachFuel(d.fuel, d.x, d.y, o.x, o.y)) continue;
      const dd = dist2(d.x, d.y, o.x, o.y);
      if (dd < bestD) {
        bestD = dd;
        best = o.id;
      }
    }
    d.targetDroneId = best;
  }
}
