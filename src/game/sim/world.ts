import { DIFFICULTIES, SITE_TYPES, THEATERS, projectOwned } from "@/game/catalog";
import { MAX_DRONES, MAX_FX, MAX_SHOTS, STOCK_CAP } from "./constants";
import { spottedMap } from "./intel";
import type { DroneState, FxState, MatchConfig, ShotState, SiteState, World } from "./types";

function poolDrones(): DroneState[] {
  return Array.from({ length: MAX_DRONES }, () => ({
    id: 0,
    live: false,
    typeId: "fpv",
    side: "west",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    heading: 0,
    hp: 0,
    maxHp: 0,
    fuel: 0,
    maxFuel: 0,
    targetSiteId: null,
    targetDroneId: null,
    destX: 0,
    destY: 0,
    age: 0,
    life: "dead",
    bob: 0,
    jammed: false,
  }));
}

function poolShots(): ShotState[] {
  return Array.from({ length: MAX_SHOTS }, () => ({
    id: 0,
    live: false,
    kind: "missile",
    side: "west",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ttl: 0,
    dmg: 0,
    targetDroneId: null,
  }));
}

function poolFx(): FxState[] {
  return Array.from({ length: MAX_FX }, () => ({
    live: false,
    kind: "smoke",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 0.4,
    size: 6,
    side: null,
  }));
}

export function createWorld(cfg: MatchConfig): World {
  const theater = THEATERS[cfg.theaterId];
  const diff = DIFFICULTIES[cfg.difficultyId];
  const sites: SiteState[] = theater.sites.map((bp) => {
    const t = SITE_TYPES[bp.typeId];
    const { x, y } = projectOwned(cfg.theaterId, bp.lon, bp.lat, bp.side);
    return {
      id: `${bp.side}-${bp.key}`,
      typeId: bp.typeId,
      side: bp.side,
      name: bp.name,
      x,
      y,
      destX: x,
      destY: y,
      hp: t.hp,
      maxHp: t.hp,
      fireCd: 0,
      markedUntil: 0,
      spotted: spottedMap(bp.side),
      alive: true,
    };
  });
  const start = { ...diff.start };
  const seed = cfg.seed ?? ((Math.random() * 1e9) | 0);
  return {
    seed,
    time: 0,
    tick: 0,
    theaterId: cfg.theaterId,
    difficultyId: cfg.difficultyId,
    playerSide: cfg.playerSide,
    phase: "play",
    sites,
    drones: poolDrones(),
    shots: poolShots(),
    fx: poolFx(),
    stocks: {
      west: { ...start },
      east: { ...start },
    },
    nextId: 1,
    queue: [],
    events: [],
    stats: {
      west: { launched: 0, killed: 0, lost: 0, damage: 0 },
      east: { launched: 0, killed: 0, lost: 0, damage: 0 },
    },
    botCd: diff.botLead,
    botBuildCd: diff.botBuildLead,
    rng: seed,
  };
}

export function allocDrone(world: World): DroneState | null {
  for (const d of world.drones) if (!d.live) return d;
  return null;
}

export function allocShot(world: World): ShotState | null {
  for (const s of world.shots) if (!s.live) return s;
  return null;
}

export function allocFx(world: World): FxState | null {
  for (const f of world.fx) if (!f.live) return f;
  return null;
}

export function clampStocks(world: World): void {
  for (const side of ["west", "east"] as const) {
    const s = world.stocks[side];
    s.parts = Math.min(STOCK_CAP, s.parts);
    s.fuel = Math.min(STOCK_CAP, s.fuel);
    s.warheads = Math.min(STOCK_CAP, s.warheads);
    s.electronics = Math.min(STOCK_CAP, s.electronics);
  }
}
