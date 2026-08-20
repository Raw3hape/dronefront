import { DRONE_TYPES, canAfford, payCost, refundCost } from "@/game/catalog";
import { angleTo } from "./spatial";
import { allocDrone } from "./world";
import { nextRng } from "./rng";
import { aimOf, inRange, padOf } from "./range";
import { siteKnown } from "./intel";
import type { LaunchOrder, World } from "./types";
import { burst } from "./fx";

export function enqueue(world: World, order: LaunchOrder): boolean {
  const type = DRONE_TYPES[order.typeId];
  if (!canAfford(world.stocks[order.side], type.cost)) return false;
  if (type.role === "intercept") {
    const prey = world.drones.find((d) => d.live && d.id === order.targetDroneId);
    if (!prey || prey.side === order.side) return false;
    if (!inRange(world, order.side, order.typeId, prey.x, prey.y)) return false;
  } else if (type.role === "recon") {
    if (order.wx == null || order.wy == null) return false;
    if (!inRange(world, order.side, order.typeId, order.wx, order.wy)) return false;
  } else {
    if (!order.targetSiteId) return false;
    const site = world.sites.find((s) => s.id === order.targetSiteId);
    if (!site || !site.alive || site.side === order.side) return false;
    if (!siteKnown(site, order.side)) return false;
    if (!inRange(world, order.side, order.typeId, site.x, site.y)) return false;
  }
  payCost(world.stocks[order.side], type.cost);
  world.queue.push(order);
  return true;
}

export function tickSpawn(world: World, dt: number): void {
  for (const order of world.queue) order.delay -= dt;
  const ready = world.queue.filter((o) => o.delay <= 0);
  world.queue = world.queue.filter((o) => o.delay > 0);
  for (const order of ready) {
    const type = DRONE_TYPES[order.typeId];
    const refund = () => refundCost(world.stocks[order.side], type.cost);
    if (type.role === "intercept") {
      const prey = world.drones.find((d) => d.live && d.id === order.targetDroneId);
      if (!prey) {
        refund();
        continue;
      }
    } else if (type.role === "recon") {
      if (order.wx == null || order.wy == null || !inRange(world, order.side, order.typeId, order.wx, order.wy)) {
        refund();
        continue;
      }
    } else {
      const site = world.sites.find((s) => s.id === order.targetSiteId);
      if (!site || !site.alive || !siteKnown(site, order.side)) {
        refund();
        continue;
      }
      if (!inRange(world, order.side, order.typeId, site.x, site.y)) {
        refund();
        continue;
      }
    }
    const aim = aimOf(world, order);
    const pad = padOf(world, order.side, aim.x, aim.y);
    if (!pad) {
      refund();
      continue;
    }
    const slot = allocDrone(world);
    if (!slot) {
      refund();
      continue;
    }
    const jitter = (nextRng(world) - 0.5) * 28;
    slot.live = true;
    slot.id = world.nextId++;
    slot.typeId = order.typeId;
    slot.side = order.side;
    slot.x = pad.x + jitter;
    slot.y = pad.y + (nextRng(world) - 0.5) * 28;
    slot.hp = type.hp;
    slot.maxHp = type.hp;
    slot.fuel = type.range;
    slot.maxFuel = type.range;
    slot.targetSiteId = type.role === "intercept" || type.role === "recon" ? null : order.targetSiteId;
    slot.targetDroneId = type.role === "intercept" ? order.targetDroneId : null;
    slot.destX = aim.x;
    slot.destY = aim.y;
    slot.age = 0;
    slot.bob = nextRng(world) * Math.PI * 2;
    slot.life = type.role === "intercept" ? "hunt" : "cruise";
    slot.heading = angleTo(slot.x, slot.y, aim.x, aim.y);
    slot.vx = Math.cos(slot.heading) * type.speed * 0.25;
    slot.vy = Math.sin(slot.heading) * type.speed * 0.25;
    slot.jammed = false;
    world.stats[order.side].launched += 1;
    world.events.push({
      kind: "launch",
      side: order.side,
      x: slot.x,
      y: slot.y,
      label: type.names[order.side],
    });
    burst(world, slot.x, slot.y, "flash", order.side, 10);
  }
}
