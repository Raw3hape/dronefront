import type { AaOrdnance, SideId } from "@/game/catalog/ids";
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

export function muzzle(world: World, x: number, y: number, heading: number, ordnance: AaOrdnance = "missile"): void {
  const bx = Math.cos(heading);
  const by = Math.sin(heading);
  const gun = ordnance === "gun";
  const flash = allocFx(world);
  if (flash) {
    flash.live = true;
    flash.kind = "flash";
    flash.x = x + bx * (gun ? 10 : 8);
    flash.y = y + by * (gun ? 10 : 8);
    flash.vx = bx * (gun ? 48 : 28);
    flash.vy = by * (gun ? 48 : 28);
    flash.maxLife = gun ? 0.06 : 0.12;
    flash.life = flash.maxLife;
    flash.size = gun ? 6 : 11;
    flash.side = null;
  }
  const n = gun ? 5 : 3;
  for (let i = 0; i < n; i++) {
    const f = allocFx(world);
    if (!f) return;
    f.live = true;
    f.kind = gun ? "spark" : "smoke";
    f.x = x + bx * 4;
    f.y = y + by * 4;
    f.vx = (gun ? bx : -bx) * range(world, gun ? 80 : 14, gun ? 220 : 42) + range(world, -12, 12);
    f.vy = (gun ? by : -by) * range(world, gun ? 80 : 14, gun ? 220 : 42) + range(world, -12, 12);
    f.maxLife = gun ? range(world, 0.08, 0.16) : range(world, 0.28, 0.55);
    f.life = f.maxLife;
    f.size = gun ? range(world, 1.5, 3.2) : range(world, 4, 10);
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
