import type { SideId, TheaterId } from "./ids";

const WORLD_W = 2400;
const WORLD_H = 1350;

/** WGS84 bbox matching bake-geo-maps.py (west, south, east, north). */
const BBOX: Record<TheaterId, readonly [number, number, number, number]> = {
  front: [22.2, 44.1, 42.4, 53.4],
  north: [32.4, 48.55, 39.9, 52.45],
  south: [34.0, 45.85, 41.05, 49.45],
};

/**
 * Aug 2026 LoC, north→south then Dnipro left bank to Kinburn.
 * Occupied Crimea stays EAST. Keep in sync with scripts/bake-geo-maps.py LOC_LL.
 */
const LOC_LL: ReadonlyArray<readonly [number, number]> = [
  [35.15, 53.55], [35.12, 52.8], [35.1, 52.2], [35.08, 51.7],
  [35.02, 51.45], [35.18, 51.3], [35.38, 51.22], [35.5, 51.18],
  [35.4, 51.1], [35.22, 50.98], [35.45, 50.85], [35.7, 50.72],
  [36.0, 50.58], [36.3, 50.45], [36.6, 50.35], [36.85, 50.3],
  [36.95, 50.26], [37.12, 50.12], [37.35, 49.95], [37.52, 49.82],
  [37.65, 49.72], [37.72, 49.58], [37.76, 49.4], [37.78, 49.22],
  [37.8, 49.05], [37.81, 48.99], [37.95, 48.92], [38.1, 48.87],
  [38.02, 48.78], [37.88, 48.66], [37.84, 48.59], [37.74, 48.53],
  [37.55, 48.45], [37.38, 48.38], [37.22, 48.32], [37.12, 48.28],
  [37.08, 48.18], [37.15, 48.08], [37.26, 47.99], [37.22, 47.88],
  [37.05, 47.8], [36.8, 47.74], [36.5, 47.7], [36.28, 47.66],
  [36.1, 47.62], [35.92, 47.58], [35.8, 47.56], [35.55, 47.52],
  [35.25, 47.5], [34.9, 47.46], [34.55, 47.38], [34.2, 47.22],
  [33.85, 47.05], [33.5, 46.9], [33.15, 46.75], [32.85, 46.65],
  [32.62, 46.58], [32.35, 46.48], [32.05, 46.38], [31.8, 46.28],
  [31.6, 46.1], [31.52, 45.7], [31.5, 45.2], [31.5, 44.5], [31.5, 43.9],
];

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
  if (pts.length < 2) return WORLD_W * 0.5;
  if (y <= pts[0]!.y) return pts[0]!.x;
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
  const pts = locLine(theaterId);
  if (pts.length < 2) return x < WORLD_W * 0.5 ? "west" : "east";
  return x < locXAtY(pts, y) ? "west" : "east";
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
