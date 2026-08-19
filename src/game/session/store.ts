import { create } from "zustand";
import type { DifficultyId, DroneTypeId, SideId, TheaterId } from "@/game/catalog/ids";
import type { HudSnap } from "@/game/sim/types";
import { DIFFICULTY_ORDER, DRONE_ORDER, THEATER_ORDER } from "@/game/catalog";

export type UiPhase = "menu" | "brief" | "play" | "paused" | "result";

export interface SessionState {
  ui: UiPhase;
  theaterId: TheaterId;
  playerSide: SideId;
  difficultyId: DifficultyId;
  selected: DroneTypeId | null;
  packageMode: boolean;
  muted: boolean;
  hud: HudSnap | null;
  hoverSiteId: string | null;
  result: "won" | "lost" | null;
  setUi: (ui: UiPhase) => void;
  setTheater: (id: TheaterId) => void;
  setSide: (s: SideId) => void;
  setDiff: (d: DifficultyId) => void;
  setSelected: (id: DroneTypeId | null) => void;
  togglePackage: () => void;
  toggleMute: () => void;
  setHud: (h: HudSnap | null) => void;
  setHover: (id: string | null) => void;
  setResult: (r: "won" | "lost" | null) => void;
}

const KEY = "dronefront-settings-v2";

function load(): Partial<SessionState> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Partial<SessionState>;
    return {
      theaterId: THEATER_ORDER.includes(p.theaterId as TheaterId) ? (p.theaterId as TheaterId) : "front",
      playerSide: p.playerSide === "east" ? "east" : "west",
      difficultyId: DIFFICULTY_ORDER.includes(p.difficultyId as DifficultyId)
        ? (p.difficultyId as DifficultyId)
        : "operator",
      muted: Boolean(p.muted),
    };
  } catch {
    return {};
  }
}

export const useSession = create<SessionState>((set, get) => ({
  ui: "menu",
  theaterId: "front",
  playerSide: "west",
  difficultyId: "operator",
  selected: DRONE_ORDER[0],
  packageMode: false,
  muted: false,
  hud: null,
  hoverSiteId: null,
  result: null,
  ...load(),
  setUi: (ui) => set({ ui }),
  setTheater: (theaterId) => {
    set({ theaterId });
    persist(get);
  },
  setSide: (playerSide) => {
    set({ playerSide });
    persist(get);
  },
  setDiff: (difficultyId) => {
    set({ difficultyId });
    persist(get);
  },
  setSelected: (selected) => set({ selected }),
  togglePackage: () => set({ packageMode: !get().packageMode }),
  toggleMute: () => {
    set({ muted: !get().muted });
    persist(get);
  },
  setHud: (hud) => set({ hud }),
  setHover: (hoverSiteId) => set({ hoverSiteId }),
  setResult: (result) => set({ result, ui: result ? "result" : get().ui }),
}));

function persist(get: () => SessionState): void {
  const s = get();
  localStorage.setItem(
    KEY,
    JSON.stringify({
      theaterId: s.theaterId,
      playerSide: s.playerSide,
      difficultyId: s.difficultyId,
      muted: s.muted,
    }),
  );
}
