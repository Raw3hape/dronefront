import type { AaOrdnance, DifficultyId, DroneTypeId, SideId, SiteTypeId, TheaterId } from "@/game/catalog/ids";
import type { StockCost } from "@/game/catalog/drones";

export type Phase = "play" | "paused" | "won" | "lost";
export type DroneLife = "cruise" | "hunt" | "dead";
export type ShotKind = AaOrdnance;
export type FxKind = "burst" | "smoke" | "spark" | "flash" | "ring";

export interface SiteState {
  id: string;
  typeId: SiteTypeId;
  side: SideId;
  name: string;
  x: number;
  y: number;
  destX: number;
  destY: number;
  hp: number;
  maxHp: number;
  fireCd: number;
  markedUntil: number;
  spotted: Record<SideId, boolean>;
  alive: boolean;
}

export interface DroneState {
  id: number;
  live: boolean;
  typeId: DroneTypeId;
  side: SideId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  hp: number;
  maxHp: number;
  fuel: number;
  maxFuel: number;
  targetSiteId: string | null;
  targetDroneId: number | null;
  destX: number;
  destY: number;
  age: number;
  life: DroneLife;
  bob: number;
  jammed: boolean;
}

export interface ShotState {
  id: number;
  live: boolean;
  kind: ShotKind;
  side: SideId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  dmg: number;
  targetDroneId: number | null;
}

export interface FxState {
  live: boolean;
  kind: FxKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  side: SideId | null;
}

export interface LaunchOrder {
  side: SideId;
  typeId: DroneTypeId;
  targetSiteId: string | null;
  targetDroneId: number | null;
  wx?: number | null;
  wy?: number | null;
  delay: number;
}

export interface SimEvent {
  kind: "hit" | "kill" | "site" | "launch" | "mark" | "aa" | "gun" | "jam" | "build" | "bingo";
  side: SideId;
  x: number;
  y: number;
  label?: string;
}

export interface MatchStats {
  launched: number;
  killed: number;
  lost: number;
  damage: number;
}

export interface World {
  seed: number;
  time: number;
  tick: number;
  theaterId: TheaterId;
  difficultyId: DifficultyId;
  playerSide: SideId;
  phase: Phase;
  sites: SiteState[];
  drones: DroneState[];
  shots: ShotState[];
  fx: FxState[];
  stocks: Record<SideId, StockCost>;
  nextId: number;
  queue: LaunchOrder[];
  events: SimEvent[];
  stats: Record<SideId, MatchStats>;
  botCd: number;
  botBuildCd: number;
  rng: number;
}

export interface MatchConfig {
  theaterId: TheaterId;
  difficultyId: DifficultyId;
  playerSide: SideId;
  seed?: number;
}

export interface HudSnap {
  time: number;
  phase: Phase;
  stocks: StockCost;
  ownStrategic: number;
  enemyStrategic: number;
  ownTotal: number;
  enemyTotal: number;
  inbound: number;
  airborne: number;
  ownHq: number;
  enemyHq: number;
  stats: MatchStats;
}
