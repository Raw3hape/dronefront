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
 * Approximate line of contact, Aug 2026, north→south then along the Dnipro.
 * Sudzha pocket, Vovchansk, Kupiansk, Lyman, Kostiantynivka, Pokrovsk,
 * Huliaipole, then the Dnipro to the Black Sea. Occupied Crimea sits east.
 */
const LOC_LL: ReadonlyArray<readonly [number, number]> = [
  [34.55, 51.55],
  [35.05, 51.22],
  [35.35, 51.32],
  [35.52, 51.18],
  [35.25, 51.02],
  [35.7, 50.72],
  [36.2, 50.48],
  [36.75, 50.22],
  [36.95, 50.12],
  [37.25, 49.92],
  [37.58, 49.72],
  [37.68, 49.48],
  [37.78, 49.2],
  [37.82, 48.98],
  [38.08, 48.87],
  [38.0, 48.68],
  [37.88, 48.58],
  [37.7, 48.5],
  [37.78, 48.38],
  [37.4, 48.32],
  [37.18, 48.22],
  [37.22, 48.02],
  [37.28, 47.82],
  [36.85, 47.7],
  [36.32, 47.64],
  [35.9, 47.56],
  [35.55, 47.5],
  [35.15, 47.48],
  [34.7, 47.4],
  [34.2, 47.15],
  [33.6, 46.85],
  [33.1, 46.68],
  [32.7, 46.52],
  [32.3, 46.32],
  [31.9, 46.1],
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

const CACHE: Partial<Record<TheaterId, Pt[]>> = {};

export function locLine(theaterId: TheaterId): Pt[] {
  const hit = CACHE[theaterId];
  if (hit) return hit;
  const pts = LOC_LL.map(([lon, lat]) => projectLl(lon, lat, theaterId)).filter(
    (p) => p.x > -80 && p.x < WORLD_W + 80 && p.y > -80 && p.y < WORLD_H + 80,
  );
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
