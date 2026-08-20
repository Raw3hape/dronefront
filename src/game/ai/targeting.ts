import { DRONE_TYPES, SITE_TYPES } from "@/game/catalog";
import type { DroneTypeId, SideId, SiteTypeId } from "@/game/catalog/ids";
import { dist2 } from "@/game/sim/spatial";
import { nextRng } from "@/game/sim/rng";
import { inRange } from "@/game/sim/range";
import type { SiteState, World } from "@/game/sim/types";

const VALUE: Partial<Record<SiteTypeId, number>> = {
  hq: 1.3,
  factory: 1.2,
  refinery: 1.15,
  power: 1.1,
  airfield: 1.05,
  ammo: 1,
  fuel: 0.95,
  rail: 0.9,
  aa: 0.75,
  ew: 0.8,
};

export function pickStrikeTarget(world: World, side: SideId, typeId?: DroneTypeId): SiteState | null {
  const enemy = side === "west" ? "east" : "west";
  let best: SiteState | null = null;
  let score = -1;
  for (const s of world.sites) {
    if (!s.alive || s.side !== enemy) continue;
    if (typeId && !inRange(world, side, typeId, s.x, s.y)) continue;
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
  const ox = hq?.x ?? 0;
  const oy = hq?.y ?? 0;
  for (const d of world.drones) {
    if (!d.live || d.side === side) continue;
    if (DRONE_TYPES[d.typeId].role === "intercept") continue;
    if (!inRange(world, side, "interceptor", d.x, d.y)) continue;
    const dd = dist2(d.x, d.y, ox, oy);
    if (dd < bestD) {
      bestD = dd;
      best = d.id;
    }
  }
  return best;
}

function pickMix(world: World, inbound: number): DroneTypeId {
  const r = nextRng(world);
  if (inbound >= 2 && r < 0.55) return "interceptor";
  if (r < 0.28) return "loiter";
  if (r < 0.4) return "fpv";
  if (r < 0.5) return "fiber";
  if (r < 0.62) return "lancet";
  if (r < 0.72) return "decoy";
  if (r < 0.82) return "recon";
  return "bomber";
}

export function pickStrikeType(world: World, side: SideId, inbound: number): DroneTypeId {
  const mix = pickMix(world, inbound);
  if (mix === "interceptor") return mix;
  if (pickStrikeTarget(world, side, mix)) return mix;
  return "loiter";
}

export function pickBuildType(world: World, side: SideId): SiteTypeId {
  let aa = 0;
  let ew = 0;
  let yards = 0;
  let pads = 0;
  let factory = 0;
  for (const s of world.sites) {
    if (!s.alive || s.side !== side) continue;
    if (s.typeId === "aa") aa += 1;
    else if (s.typeId === "ew") ew += 1;
    else yards += 1;
    if (s.typeId === "factory") factory += 1;
    if (SITE_TYPES[s.typeId].isAirfield) pads += 1;
  }
  let inbound = 0;
  for (const d of world.drones) if (d.live && d.side !== side) inbound += 1;
  const r = nextRng(world);
  if (aa < 1) return "aa";
  if (inbound >= 2 && aa < 2) return "aa";
  if (factory < 1) return "factory";
  if (ew < 1) return "ew";
  if (yards < 3) {
    if (r < 0.35) return "ammo";
    if (r < 0.6) return "refinery";
    if (r < 0.8) return "airfield";
    return "fuel";
  }
  const short = pickStrikeTarget(world, side, "fpv") === null;
  if (short && pads < 3 && r < 0.45) return "airfield";
  if (r < 0.4) return "aa";
  if (r < 0.65) return "ew";
  return r < 0.85 ? "power" : "rail";
}
