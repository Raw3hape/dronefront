import type { DifficultyId } from "./ids";
import type { StockCost } from "./drones";

export interface Difficulty {
  id: DifficultyId;
  name: string;
  blurb: string;
  start: StockCost;
  botInterval: number;
  botBurst: number;
  botAccuracy: number;
  aaMul: number;
  economyMul: number;
}

export const DIFFICULTIES: Record<DifficultyId, Difficulty> = {
  recruit: {
    id: "recruit",
    name: "Recruit",
    blurb: "Sparse fire, slow sorties. Learn the map.",
    start: { parts: 48, fuel: 40, warheads: 22, electronics: 16 },
    botInterval: 9.5,
    botBurst: 1,
    botAccuracy: 0.72,
    aaMul: 0.78,
    economyMul: 1.1,
  },
  operator: {
    id: "operator",
    name: "Operator",
    blurb: "Honest duel. Packages vs batteries.",
    start: { parts: 36, fuel: 30, warheads: 16, electronics: 12 },
    botInterval: 6.4,
    botBurst: 2,
    botAccuracy: 1,
    aaMul: 1,
    economyMul: 1,
  },
  veteran: {
    id: "veteran",
    name: "Veteran",
    blurb: "The sky fills. Interceptors and guns never rest.",
    start: { parts: 28, fuel: 24, warheads: 12, electronics: 10 },
    botInterval: 4.2,
    botBurst: 3,
    botAccuracy: 1.15,
    aaMul: 1.22,
    economyMul: 0.92,
  },
};

export const DIFFICULTY_ORDER: DifficultyId[] = ["recruit", "operator", "veteran"];
