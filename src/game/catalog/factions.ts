import type { SideId } from "./ids";

export interface Faction {
  id: SideId;
  name: string;
  short: string;
  blurb: string;
  tint: string;
  trail: string;
}

export const FACTIONS: Record<SideId, Faction> = {
  west: {
    id: "west",
    name: "Ukraine",
    short: "UA",
    blurb: "Kyiv command",
    tint: "#6d8eae",
    trail: "rgba(130,170,210,0.55)",
  },
  east: {
    id: "east",
    name: "Russia",
    short: "RU",
    blurb: "Rostov command",
    tint: "#c56a52",
    trail: "rgba(210,120,90,0.55)",
  },
};

export const OTHER_SIDE: Record<SideId, SideId> = {
  west: "east",
  east: "west",
};
