import { DRONE_TYPES, SITE_TYPES } from "@/game/catalog";
import type { DroneTypeId, SideId } from "@/game/catalog/ids";
import { dist2 } from "@/game/sim/spatial";
import { nextRng } from "@/game/sim/rng";
import type { SiteState, World } from "@/game/sim/types";

const VALUE: Partial<Record<SiteState["typeId"], number>> = {
  hq: 1.3,
  factory: 1.2,
  refinery: 1.15,
  power: 1.1,
  airfield: 1.05,
  ammo: 1,
  fuel: 0.95,
  rail: 0.9,
  aa: 0.7,
};

export function pickStrikeTarget(world: World, side: SideId): SiteState | null {
  const enemy = side === "west" ? "east" : "west";
  let best: SiteState | null = null;
  let score = -1;
  for (const s of world.sites) {
    if (!s.alive || s.side !== enemy) continue;
    const t = SITE_TYPES[s.typeId];
    const w = (VALUE[s.typeId] ?? 0.5) * (0.4 + s.hp / s.maxHp);
    const marked = s.markedUntil > world.time ? 1.25 : 1;
    const n = w * marked * (t.strategic ? 1 : 0.55) * (0.85 + nextRng(world) * 0.3);
    if (n > score) {
      score = n;
      best = s;
    }
  }
  return best;
}

export function pickInbound(world: World, side: SideId): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  const hq = world.sites.find((s) => s.side === side && s.typeId === "hq" && s.alive);
  const ox = hq?.x ?? (side === "west" ? 200 : 2200);
  const oy = hq?.y ?? 675;
  for (const d of world.drones) {
    if (!d.live || d.side === side) continue;
    if (DRONE_TYPES[d.typeId].role === "intercept") continue;
    const dd = dist2(d.x, d.y, ox, oy);
    if (dd < bestD) {
      bestD = dd;
      best = d.id;
    }
  }
  return best;
}

export function pickMix(world: World, inbound: number): DroneTypeId {
  const r = nextRng(world);
  if (inbound >= 4) return r < 0.7 ? "interceptor" : "decoy";
  if (r < 0.22) return "fpv";
  if (r < 0.4) return "loiter";
  if (r < 0.52) return "decoy";
  if (r < 0.64) return "recon";
  if (r < 0.78) return "interceptor";
  return "bomber";
}
