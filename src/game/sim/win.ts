import { OTHER_SIDE } from "@/game/catalog/factions";
import type { SideId } from "@/game/catalog/ids";
import type { World } from "./types";

function hqAlive(world: World, side: SideId): boolean {
  const hq = world.sites.find((s) => s.side === side && s.typeId === "hq");
  return Boolean(hq && hq.alive);
}

export function tickWin(world: World): void {
  if (world.phase !== "play") return;
  if (!hqAlive(world, world.playerSide)) world.phase = "lost";
  else if (!hqAlive(world, OTHER_SIDE[world.playerSide])) world.phase = "won";
}
