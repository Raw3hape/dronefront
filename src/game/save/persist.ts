import type { DifficultyId, SideId, TheaterId } from "@/game/catalog/ids";

export interface RunRecord {
  theaterId: TheaterId;
  difficultyId: DifficultyId;
  side: SideId;
  won: boolean;
  duration: number;
  damage: number;
  at: number;
}

const KEY = "dronefront-runs-v2";

export function loadRuns(): RunRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RunRecord[]) : [];
  } catch {
    return [];
  }
}

export function pushRun(run: RunRecord): void {
  const all = [run, ...loadRuns()].slice(0, 24);
  localStorage.setItem(KEY, JSON.stringify(all));
}
