import { SITE_TYPES } from "@/game/catalog";
import { OTHER_SIDE } from "@/game/catalog/factions";
import type { SideId } from "@/game/catalog/ids";
import type { World } from "./types";

export function countStrategic(world: World, side: SideId): { alive: number; total: number } {
  let alive = 0;
  let total = 0;
  for (const s of world.sites) {
    if (s.side !== side) continue;
    if (!SITE_TYPES[s.typeId].strategic) continue;
    total += 1;
    if (s.alive) alive += 1;
  }
  return { alive, total };
}

export function tickWin(world: World): void {
  if (world.phase !== "play") return;
  const player = countStrategic(world, world.playerSide);
  const enemy = countStrategic(world, OTHER_SIDE[world.playerSide]);
  if (enemy.alive <= 0) world.phase = "won";
  else if (player.alive <= 0) world.phase = "lost";
}
