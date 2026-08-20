import type { SideId } from "@/game/catalog/ids";
import type { FxKind, World } from "./types";
import { allocFx } from "./world";
import { range } from "./rng";

export function burst(
  world: World,
  x: number,
  y: number,
  kind: FxKind,
  side: SideId | null,
  n = 8,
): void {
  const count = kind === "burst" ? n + 6 : n;
  for (let i = 0; i < count; i++) {
    const f = allocFx(world);
    if (!f) return;
    const a = range(world, 0, Math.PI * 2);
    const sp = kind === "burst" ? range(world, 40, 180) : range(world, 8, 50);
    f.live = true;
    f.kind = i === 0 && kind === "burst" ? "burst" : kind === "burst" ? "spark" : kind;
    f.x = x;
    f.y = y;
    f.vx = Math.cos(a) * sp;
    f.vy = Math.sin(a) * sp;
    f.maxLife = kind === "burst" ? range(world, 0.28, 0.55) : range(world, 0.35, 0.9);
    f.life = f.maxLife;
    f.size = kind === "burst" ? range(world, 16, 34) : range(world, 3, 10);
    f.side = side;
  }
  if (kind !== "burst") return;
  const ring = allocFx(world);
  if (!ring) return;
  ring.live = true;
  ring.kind = "ring";
  ring.x = x;
  ring.y = y;
  ring.vx = 0;
  ring.vy = 0;
  ring.maxLife = 0.45;
  ring.life = 0.45;
  ring.size = 18;
  ring.side = side;
}

export function muzzle(world: World, x: number, y: number, heading: number): void {
  const bx = Math.cos(heading);
  const by = Math.sin(heading);
  const flash = allocFx(world);
  if (flash) {
    flash.live = true;
    flash.kind = "flash";
    flash.x = x + bx * 8;
    flash.y = y + by * 8;
    flash.vx = bx * 28;
    flash.vy = by * 28;
    flash.maxLife = 0.12;
    flash.life = 0.12;
    flash.size = 11;
    flash.side = null;
  }
  for (let i = 0; i < 3; i++) {
    const f = allocFx(world);
    if (!f) return;
    f.live = true;
    f.kind = "smoke";
    f.x = x + bx * 4;
    f.y = y + by * 4;
    f.vx = -bx * range(world, 14, 42) + range(world, -12, 12);
    f.vy = -by * range(world, 14, 42) + range(world, -12, 12);
    f.maxLife = range(world, 0.28, 0.55);
    f.life = f.maxLife;
    f.size = range(world, 4, 10);
    f.side = null;
  }
}

export function tickFx(world: World, dt: number): void {
  for (const f of world.fx) {
    if (!f.live) continue;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.vx *= 0.92;
    f.vy *= 0.92;
    f.life -= dt;
    if (f.life <= 0) f.live = false;
  }
}
