import { assetUrl } from "@/lib/assets";

const DRONE_KEYS = ["fpv", "loiter", "interceptor", "recon", "bomber", "decoy"] as const;
const SITE_KEYS = ["factory", "refinery", "power", "airfield", "ammo", "hq", "aa", "fuel", "rail"] as const;
const MAP_KEYS = ["front", "north", "south"] as const;

export interface Atlas {
  drones: Record<string, HTMLImageElement>;
  sites: Record<string, HTMLImageElement>;
  explode: HTMLImageElement[];
  missile: HTMLImageElement[];
  maps: Record<string, HTMLImageElement>;
  ready: boolean;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

export async function loadAtlas(): Promise<Atlas> {
  const drones: Atlas["drones"] = {};
  const sites: Atlas["sites"] = {};
  const [dImgs, sImgs, exp, mis, maps] = await Promise.all([
    Promise.all(DRONE_KEYS.map((k) => loadImg(assetUrl(`/game/sprites/drones/${k}.png`)))),
    Promise.all(SITE_KEYS.map((k) => loadImg(assetUrl(`/game/sprites/sites/${k}.png`)))),
    Promise.all([0, 1, 2, 3].map((i) => loadImg(assetUrl(`/game/sprites/explode/e${i}.png`)))),
    Promise.all([0, 1, 2, 3].map((i) => loadImg(assetUrl(`/game/sprites/missile/m${i}.png`)))),
    Promise.all(MAP_KEYS.map((k) => loadImg(assetUrl(`/game/maps/${k}.jpg`)))),
  ]);
  DRONE_KEYS.forEach((k, i) => {
    drones[k] = dImgs[i]!;
  });
  SITE_KEYS.forEach((k, i) => {
    sites[k] = sImgs[i]!;
  });
  const mapRec: Atlas["maps"] = {};
  MAP_KEYS.forEach((k, i) => {
    mapRec[k] = maps[i]!;
  });
  return { drones, sites, explode: exp, missile: mis, maps: mapRec, ready: true };
}
