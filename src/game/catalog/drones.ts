import type { DroneRole, DroneTypeId, StockId } from "./ids";

export interface StockCost {
  parts: number;
  fuel: number;
  warheads: number;
  electronics: number;
}

export interface DroneType {
  id: DroneTypeId;
  name: string;
  callsign: string;
  role: DroneRole;
  blurb: string;
  cost: StockCost;
  speed: number;
  turnRate: number;
  hp: number;
  radius: number;
  payload: number;
  aaProfile: number;
  aggro: number;
  interceptDmg: number;
  sprite: string;
  drawSize: number;
  hotkey: string;
}

export const DRONE_TYPES: Record<DroneTypeId, DroneType> = {
  fpv: {
    id: "fpv",
    name: "FPV",
    callsign: "Wasp",
    role: "strike",
    blurb: "Fast kamikaze. Guns struggle to track it.",
    cost: { parts: 4, fuel: 2, warheads: 1, electronics: 0 },
    speed: 268,
    turnRate: 6.2,
    hp: 9,
    radius: 6,
    payload: 34,
    aaProfile: 0.38,
    aggro: 0.55,
    interceptDmg: 7,
    sprite: "fpv",
    drawSize: 22,
    hotkey: "1",
  },
  loiter: {
    id: "loiter",
    name: "Loiter",
    callsign: "Moth",
    role: "strike",
    blurb: "Cheap wing. Slow, heavy warhead, easy prey.",
    cost: { parts: 7, fuel: 6, warheads: 3, electronics: 0 },
    speed: 96,
    turnRate: 1.8,
    hp: 22,
    radius: 10,
    payload: 78,
    aaProfile: 0.82,
    aggro: 1,
    interceptDmg: 10,
    sprite: "loiter",
    drawSize: 34,
    hotkey: "2",
  },
  interceptor: {
    id: "interceptor",
    name: "Hunter",
    callsign: "Kite",
    role: "intercept",
    blurb: "Hunts incoming drones. Assign a bandit or a hunt zone.",
    cost: { parts: 6, fuel: 4, warheads: 0, electronics: 2 },
    speed: 290,
    turnRate: 5.8,
    hp: 14,
    radius: 7,
    payload: 0,
    aaProfile: 0.5,
    aggro: 0.35,
    interceptDmg: 22,
    sprite: "interceptor",
    drawSize: 28,
    hotkey: "3",
  },
  recon: {
    id: "recon",
    name: "Scout",
    callsign: "Owl",
    role: "recon",
    blurb: "Marks a site. Marked targets take extra damage.",
    cost: { parts: 5, fuel: 5, warheads: 0, electronics: 3 },
    speed: 170,
    turnRate: 3.4,
    hp: 11,
    radius: 8,
    payload: 4,
    aaProfile: 0.48,
    aggro: 0.4,
    interceptDmg: 5,
    sprite: "recon",
    drawSize: 32,
    hotkey: "4",
  },
  bomber: {
    id: "bomber",
    name: "Heavy",
    callsign: "Ox",
    role: "strike",
    blurb: "Twin-boom strike UAV. Expensive. Cracks hardened yards.",
    cost: { parts: 14, fuel: 10, warheads: 6, electronics: 2 },
    speed: 118,
    turnRate: 2.1,
    hp: 40,
    radius: 12,
    payload: 150,
    aaProfile: 0.7,
    aggro: 0.85,
    interceptDmg: 16,
    sprite: "bomber",
    drawSize: 40,
    hotkey: "5",
  },
  decoy: {
    id: "decoy",
    name: "Decoy",
    callsign: "Crow",
    role: "decoy",
    blurb: "Draws batteries. Pair with a real strike package.",
    cost: { parts: 3, fuel: 3, warheads: 0, electronics: 1 },
    speed: 150,
    turnRate: 3.8,
    hp: 6,
    radius: 7,
    payload: 0,
    aaProfile: 0.9,
    aggro: 1.45,
    interceptDmg: 3,
    sprite: "decoy",
    drawSize: 24,
    hotkey: "6",
  },
};

export const DRONE_ORDER: DroneTypeId[] = [
  "fpv",
  "loiter",
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
