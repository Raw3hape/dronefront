import { DIFFICULTIES, DRONE_TYPES, canAfford } from "@/game/catalog";
import { OTHER_SIDE } from "@/game/catalog/factions";
import { enqueue } from "@/game/sim/spawn";
import { pickInbound, pickMix, pickStrikeTarget } from "./targeting";
import type { World } from "@/game/sim/types";

export function tickBot(world: World, dt: number): void {
  if (world.phase !== "play") return;
  const bot = OTHER_SIDE[world.playerSide];
  const diff = DIFFICULTIES[world.difficultyId];
  world.botCd -= dt;
  if (world.botCd > 0) return;
  world.botCd = diff.botInterval * (0.75 + Math.random() * 0.5);
  let inbound = 0;
  for (const d of world.drones) if (d.live && d.side === world.playerSide) inbound += 1;
  const n = inbound >= 5 ? diff.botBurst + 1 : diff.botBurst;
  for (let i = 0; i < n; i++) {
    const typeId = pickMix(world, inbound);
    const type = DRONE_TYPES[typeId];
    if (!canAfford(world.stocks[bot], type.cost)) continue;
    if (type.role === "intercept") {
      const prey = pickInbound(world, bot);
      enqueue(world, {
        side: bot,
        typeId,
        targetSiteId: null,
        targetDroneId: prey,
        delay: i * 0.35,
      });
      continue;
    }
    const target = pickStrikeTarget(world, bot);
    if (!target) continue;
    enqueue(world, {
      side: bot,
      typeId,
      targetSiteId: target.id,
      targetDroneId: null,
      delay: i * 0.28,
    });
  }
}
