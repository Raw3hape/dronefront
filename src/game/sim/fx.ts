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
  for (let i = 0; i < n; i++) {
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
    f.size = kind === "burst" ? range(world, 14, 28) : range(world, 3, 10);
    f.side = side;
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
