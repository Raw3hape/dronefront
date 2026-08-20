import type { DroneRole, DroneTypeId, SideId, StockId } from "./ids";

export interface StockCost {
  parts: number;
  fuel: number;
  warheads: number;
  electronics: number;
}

export interface DroneType {
  id: DroneTypeId;
  names: Record<SideId, string>;
  callsign: string;
  role: DroneRole;
  blurb: string;
  cost: StockCost;
  speed: number;
  turnRate: number;
  hp: number;
  radius: number;
  payload: number;
  range: number;
  aaProfile: number;
  ewProfile: number;
  aggro: number;
  interceptDmg: number;
  sprite: string;
  drawSize: number;
  hotkey: string;
  spotRange: number;
}

/** Game-scale km per world unit. HUD km = catalog range × this. */
export const KM_PER_UNIT = 0.5;

export function rangeKm(units: number): number {
  return Math.round(units * KM_PER_UNIT);
}

export const DRONE_TYPES: Record<DroneTypeId, DroneType> = {
  fpv: {
    id: "fpv",
    names: { west: "FPV", east: "FPV" },
    callsign: "Wasp",
    role: "strike",
    blurb: "Radio FPV. Short hop — needs a pad near the LoC.",
    cost: { parts: 4, fuel: 2, warheads: 1, electronics: 0 },
    speed: 155,
    turnRate: 6.2,
    hp: 9,
    radius: 6,
    payload: 12,
    range: 460,
    aaProfile: 0.38,
    ewProfile: 0.92,
    aggro: 0.55,
    interceptDmg: 7,
    sprite: "fpv",
    drawSize: 22,
    hotkey: "1",
    spotRange: 0,
  },
  fiber: {
    id: "fiber",
    names: { west: "FPV fiber", east: "FPV ВОГ" },
    callsign: "Thread",
    role: "strike",
    blurb: "Fiber-optic FPV. Jam-proof, short spool.",
    cost: { parts: 6, fuel: 2, warheads: 1, electronics: 3 },
    speed: 109,
    turnRate: 5.4,
    hp: 10,
    radius: 6,
    payload: 14,
    range: 400,
    aaProfile: 0.42,
    ewProfile: 0.06,
    aggro: 0.5,
    interceptDmg: 7,
    sprite: "fiber",
    drawSize: 24,
    hotkey: "2",
    spotRange: 0,
  },
  loiter: {
    id: "loiter",
    names: { west: "AN-196 Liutyi", east: "Geran-2" },
    callsign: "One-way",
    role: "strike",
    blurb: "Deep strike. Reaches enemy HQ from yours.",
    cost: { parts: 8, fuel: 7, warheads: 3, electronics: 1 },
    speed: 56,
    turnRate: 1.8,
    hp: 34,
    radius: 10,
    payload: 24,
    range: 2000,
    aaProfile: 0.82,
    ewProfile: 0.38,
    aggro: 1,
    interceptDmg: 10,
    sprite: "loiter",
    drawSize: 36,
    hotkey: "3",
    spotRange: 0,
  },
  lancet: {
    id: "lancet",
    names: { west: "Warmate", east: "Lancet-3" },
    callsign: "Needle",
    role: "strike",
    blurb: "Loitering munition. From a forward pad, not from Kyiv.",
    cost: { parts: 7, fuel: 4, warheads: 2, electronics: 3 },
    speed: 89,
    turnRate: 3.6,
    hp: 13,
    radius: 7,
    payload: 18,
    range: 680,
    aaProfile: 0.44,
    ewProfile: 0.34,
    aggro: 0.7,
    interceptDmg: 9,
    sprite: "lancet",
    drawSize: 28,
    hotkey: "4",
    spotRange: 0,
  },
  interceptor: {
    id: "interceptor",
    names: { west: "Sting", east: "Okhotnik" },
    callsign: "Kite",
    role: "intercept",
    blurb: "Interceptor FPV. CAP around your pads, then bingo.",
    cost: { parts: 6, fuel: 4, warheads: 0, electronics: 2 },
    speed: 168,
    turnRate: 5.8,
    hp: 14,
    radius: 7,
    payload: 0,
    range: 520,
    aaProfile: 0.5,
    ewProfile: 0.55,
    aggro: 0.35,
    interceptDmg: 38,
    sprite: "interceptor",
    drawSize: 28,
    hotkey: "5",
    spotRange: 0,
  },
  recon: {
    id: "recon",
    names: { west: "Leleka-100", east: "Orlan-10" },
    callsign: "Owl",
    role: "recon",
    blurb: "Tap the map to fly a scout. Yards it overflies stay on the map.",
    cost: { parts: 5, fuel: 5, warheads: 0, electronics: 3 },
    speed: 99,
    turnRate: 3.4,
    hp: 11,
    radius: 8,
    payload: 3,
    range: 2000,
    aaProfile: 0.48,
    ewProfile: 0.58,
    aggro: 0.4,
    interceptDmg: 5,
    sprite: "recon",
    drawSize: 32,
    hotkey: "6",
    spotRange: 140,
  },
  bomber: {
    id: "bomber",
    names: { west: "Vampire", east: "Molniya-2" },
    callsign: "Hex",
    role: "strike",
    blurb: "Heavy UAS. Crosses the LoC from HQ, not the deep rear.",
    cost: { parts: 14, fuel: 10, warheads: 6, electronics: 2 },
    speed: 63,
    turnRate: 2.2,
    hp: 36,
    radius: 12,
    payload: 48,
    range: 800,
    aaProfile: 0.68,
    ewProfile: 0.62,
    aggro: 0.85,
    interceptDmg: 14,
    sprite: "bomber",
    drawSize: 40,
    hotkey: "7",
    spotRange: 0,
  },
  decoy: {
    id: "decoy",
    names: { west: "RAM II", east: "Gerbera" },
    callsign: "Crow",
    role: "decoy",
    blurb: "Cheap decoy. Escorts Geran / Liutyi. Pulls ПВО.",
    cost: { parts: 3, fuel: 3, warheads: 0, electronics: 1 },
    speed: 87,
    turnRate: 3.8,
    hp: 6,
    radius: 7,
    payload: 0,
    range: 2000,
    aaProfile: 0.9,
    ewProfile: 0.5,
    aggro: 1.45,
    interceptDmg: 3,
    sprite: "decoy",
    drawSize: 24,
    hotkey: "8",
    spotRange: 0,
  },
};

export const DRONE_ORDER: DroneTypeId[] = [
  "fpv",
  "fiber",
  "loiter",
  "lancet",
  "interceptor",
  "recon",
  "bomber",
  "decoy",
];

export const STOCK_ORDER: StockId[] = ["parts", "fuel", "warheads", "electronics"];

export const STOCK_LABEL: Record<StockId, string> = {
  parts: "Parts",
  fuel: "Fuel",
  warheads: "Warheads",
  electronics: "Comms",
};

export function droneName(id: DroneTypeId, side: SideId): string {
  return DRONE_TYPES[id].names[side];
}

export function canAfford(have: StockCost, cost: StockCost): boolean {
  return (
    have.parts >= cost.parts &&
    have.fuel >= cost.fuel &&
    have.warheads >= cost.warheads &&
    have.electronics >= cost.electronics
  );
}

export function payCost(have: StockCost, cost: StockCost): void {
  have.parts -= cost.parts;
  have.fuel -= cost.fuel;
  have.warheads -= cost.warheads;
  have.electronics -= cost.electronics;
}

export function refundCost(have: StockCost, cost: StockCost): void {
  have.parts += cost.parts;
  have.fuel += cost.fuel;
  have.warheads += cost.warheads;
  have.electronics += cost.electronics;
}
