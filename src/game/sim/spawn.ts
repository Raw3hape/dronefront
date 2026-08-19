import { DRONE_TYPES, SITE_TYPES, canAfford, payCost } from "@/game/catalog";
import { angleTo, dist2 } from "./spatial";
import { allocDrone } from "./world";
import { nextRng } from "./rng";
import type { LaunchOrder, SiteState, World } from "./types";
import { burst } from "./fx";

export function enqueue(world: World, order: LaunchOrder): boolean {
  const type = DRONE_TYPES[order.typeId];
  if (!canAfford(world.stocks[order.side], type.cost)) return false;
  world.queue.push(order);
  return true;
}

function padOf(world: World, side: LaunchOrder["side"], tx: number, ty: number): SiteState | null {
  let best: SiteState | null = null;
  let bestD = Infinity;
  for (const s of world.sites) {
    if (!s.alive || s.side !== side) continue;
    const t = SITE_TYPES[s.typeId];
    if (!t.isAirfield) continue;
    const d = dist2(s.x, s.y, tx, ty);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  if (best) return best;
  return world.sites.find((s) => s.alive && s.side === side) ?? null;
}

export function tickSpawn(world: World, dt: number): void {
  for (const order of world.queue) order.delay -= dt;
  const ready = world.queue.filter((o) => o.delay <= 0);
  world.queue = world.queue.filter((o) => o.delay > 0);
  for (const order of ready) {
    const type = DRONE_TYPES[order.typeId];
    if (!canAfford(world.stocks[order.side], type.cost)) continue;
    let tx = order.side === "west" ? 1800 : 600;
    let ty = 675;
    if (order.targetSiteId) {
      const t = world.sites.find((s) => s.id === order.targetSiteId);
      if (t) {
        tx = t.x;
        ty = t.y;
      }
    }
    const pad = padOf(world, order.side, tx, ty);
    if (!pad) continue;
    const slot = allocDrone(world);
    if (!slot) continue;
    payCost(world.stocks[order.side], type.cost);
    const jitter = (nextRng(world) - 0.5) * 28;
    slot.live = true;
    slot.id = world.nextId++;
    slot.typeId = order.typeId;
    slot.side = order.side;
    slot.x = pad.x + jitter;
    slot.y = pad.y + (nextRng(world) - 0.5) * 28;
    slot.hp = type.hp;
    slot.maxHp = type.hp;
    slot.targetSiteId = order.targetSiteId;
    slot.targetDroneId = order.targetDroneId;
    slot.age = 0;
    slot.bob = nextRng(world) * Math.PI * 2;
    slot.life = type.role === "intercept" ? "hunt" : "cruise";
    slot.heading = angleTo(slot.x, slot.y, tx, ty);
    slot.vx = Math.cos(slot.heading) * type.speed * 0.25;
    slot.vy = Math.sin(slot.heading) * type.speed * 0.25;
    world.stats[order.side].launched += 1;
    world.events.push({ kind: "launch", side: order.side, x: slot.x, y: slot.y, label: type.callsign });
    burst(world, slot.x, slot.y, "flash", order.side, 10);
  }
}
