import type { SideId, TheaterId } from "./ids";
import loc from "./loc.json";

const WORLD_W = loc.world[0];
const WORLD_H = loc.world[1];

/** WGS84 bbox matching bake-geo-maps.py (west, south, east, north). */
const BBOX = loc.bbox as unknown as Record<TheaterId, readonly [number, number, number, number]>;

/**
 * Aug 2026 LoC. North of Kupyansk follows the internationally recognized
 * Ukraine–Russia border (Natural Earth). South of that is the occupation line
 * through Donbas / Dnipro / Kinburn. Crimea stays EAST.
 * Single source: catalog/loc.json (baker reads the same file).
 */
const LOC_LL = loc.ll as unknown as ReadonlyArray<readonly [number, number]>;

export interface Pt {
  x: number;
  y: number;
}

export function projectLl(lon: number, lat: number, theaterId: TheaterId): Pt {
  const [west, south, east, north] = BBOX[theaterId];
  return {
    x: ((lon - west) / (east - west)) * WORLD_W,
    y: ((north - lat) / (north - south)) * WORLD_H,
  };
}

function clipSeg(a: Pt, b: Pt): [Pt, Pt] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const p = [-dx, dx, -dy, dy];
  const q = [a.x, WORLD_W - a.x, a.y, WORLD_H - a.y];
  for (let i = 0; i < 4; i++) {
    const pi = p[i]!;
    const qi = q[i]!;
    if (pi === 0) {
      if (qi < 0) return null;
      continue;
    }
    const t = qi / pi;
    if (pi < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  return [
    { x: a.x + t0 * dx, y: a.y + t0 * dy },
    { x: a.x + t1 * dx, y: a.y + t1 * dy },
  ];
}

function clipPoly(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  const push = (p: Pt) => {
    const last = out[out.length - 1];
    if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 0.4) out.push(p);
  };
  for (let i = 0; i < pts.length - 1; i++) {
    const hit = clipSeg(pts[i]!, pts[i + 1]!);
    if (!hit) continue;
    push(hit[0]);
    push(hit[1]);
  }
  return out;
}

const CACHE: Partial<Record<TheaterId, Pt[]>> = {};

export function locLine(theaterId: TheaterId): Pt[] {
  const hit = CACHE[theaterId];
  if (hit) return hit;
  const pts = clipPoly(LOC_LL.map(([lon, lat]) => projectLl(lon, lat, theaterId)));
  CACHE[theaterId] = pts;
  return pts;
}

function locXAtY(pts: Pt[], y: number): number {
  if (pts.length < 2) return 0;
  // North of the LoC is Russia — do not extend a vertical line through Kursk/Orel.
  if (y < pts[0]!.y) return 0;
  const last = pts[pts.length - 1]!;
  if (y >= last.y) return last.x;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const lo = Math.min(a.y, b.y);
    const hi = Math.max(a.y, b.y);
    if (y < lo || y > hi || hi - lo < 0.001) continue;
    const t = (y - a.y) / (b.y - a.y);
    return a.x + t * (b.x - a.x);
  }
  return last.x;
}

export function sideAt(theaterId: TheaterId, x: number, y: number): SideId {
  return x < locXAtY(locLine(theaterId), y) ? "west" : "east";
}

/** Project lon/lat; nudge ~0.15° toward own rear until sideAt matches. */
export function projectOwned(theaterId: TheaterId, lon: number, lat: number, side: SideId): Pt {
  let lo = lon;
  for (let n = 0; n < 16; n++) {
    const p = projectLl(lo, lat, theaterId);
    if (sideAt(theaterId, p.x, p.y) === side) return p;
    lo += side === "west" ? -0.15 : 0.15;
  }
  return projectLl(lo, lat, theaterId);
}
