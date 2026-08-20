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
  botLead: number;
  botBuildLead: number;
  aaMul: number;
  economyMul: number;
}

export const DIFFICULTIES: Record<DifficultyId, Difficulty> = {
  recruit: {
    id: "recruit",
    name: "Recruit",
    blurb: "Place ПВО first. The sky waits — then it doesn’t.",
    start: { parts: 118, fuel: 64, warheads: 30, electronics: 52 },
    botInterval: 8.8,
    botBurst: 1,
    botAccuracy: 0.78,
    botLead: 9.5,
    botBuildLead: 3.2,
    aaMul: 0.88,
    economyMul: 1.12,
  },
  operator: {
    id: "operator",
    name: "Operator",
    blurb: "Fortify, then package. Honest duel — HQ can fall, yards still hold.",
    start: { parts: 96, fuel: 54, warheads: 24, electronics: 44 },
    botInterval: 6.6,
    botBurst: 2,
    botAccuracy: 1,
    botLead: 7.2,
    botBuildLead: 1.7,
    aaMul: 1,
    economyMul: 1,
  },
  veteran: {
    id: "veteran",
    name: "Veteran",
    blurb: "Thin stocks. The bot fortifies and Geran-pushes. Two ПВО or you leak.",
    start: { parts: 76, fuel: 42, warheads: 18, electronics: 34 },
    botInterval: 4.6,
    botBurst: 2,
    botAccuracy: 1.12,
    botLead: 2.8,
    botBuildLead: 0.9,
    aaMul: 1.12,
    economyMul: 0.94,
  },
};

export const DIFFICULTY_ORDER: DifficultyId[] = ["recruit", "operator", "veteran"];
