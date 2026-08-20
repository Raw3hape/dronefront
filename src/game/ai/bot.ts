import { BUILD_ORDER, DIFFICULTIES, DRONE_TYPES, SITE_TYPES, THEATERS, canAfford, projectOwned } from "@/game/catalog";
import { OTHER_SIDE } from "@/game/catalog/factions";
import { enqueue } from "@/game/sim/spawn";
import { placeSite } from "@/game/sim/build";
import { inRange } from "@/game/sim/range";
import { MIN_SITE_GAP } from "@/game/sim/constants";
import { nextRng } from "@/game/sim/rng";
import { pickInbound, pickStrikeTarget, pickBuildType, pickStrikeType, pickScoutAim } from "./targeting";
import type { World } from "@/game/sim/types";

export function tickBot(world: World, dt: number): void {
  if (world.phase !== "play") return;
  const bot = OTHER_SIDE[world.playerSide];
  const diff = DIFFICULTIES[world.difficultyId];
  world.botBuildCd -= dt;
  if (world.botBuildCd <= 0) {
    world.botBuildCd = diff.botInterval * 1.1 + nextRng(world) * 2.8;
    tryBotBuild(world, bot);
  }
  world.botCd -= dt;
  if (world.botCd > 0) return;
  world.botCd = diff.botInterval * (0.8 + nextRng(world) * 0.4);
  let inbound = 0;
  for (const d of world.drones) if (d.live && d.side === world.playerSide) inbound += 1;
  const n = inbound >= 5 ? diff.botBurst + 1 : diff.botBurst;
  for (let i = 0; i < n; i++) {
    const typeId = pickStrikeType(world, bot, inbound);
    const type = DRONE_TYPES[typeId];
    if (!canAfford(world.stocks[bot], type.cost)) continue;
    if (type.role === "intercept") {
      const prey = pickInbound(world, bot);
      if (prey == null) continue;
      enqueue(world, {
        side: bot,
        typeId,
        targetSiteId: null,
        targetDroneId: prey,
        delay: i * 0.35,
      });
      continue;
    }
    if (type.role === "recon") {
      const aim = pickScoutAim(world, bot);
      if (!aim || !inRange(world, bot, typeId, aim.x, aim.y)) continue;
      enqueue(world, {
        side: bot,
        typeId,
        targetSiteId: null,
        targetDroneId: null,
        wx: aim.x,
        wy: aim.y,
        delay: i * 0.28,
      });
      continue;
    }
    const target = pickStrikeTarget(world, bot, typeId);
    if (!target) continue;
    let delay = i * 0.28;
    const decoyCost = DRONE_TYPES.decoy.cost;
    const combo = {
      parts: type.cost.parts + decoyCost.parts,
      fuel: type.cost.fuel + decoyCost.fuel,
      warheads: type.cost.warheads + decoyCost.warheads,
      electronics: type.cost.electronics + decoyCost.electronics,
    };
    if (typeId === "loiter" && canAfford(world.stocks[bot], combo) && nextRng(world) < 0.42) {
      enqueue(world, {
        side: bot,
        typeId: "decoy",
        targetSiteId: target.id,
        targetDroneId: null,
        delay,
      });
      delay += 0.4;
    }
    enqueue(world, {
      side: bot,
      typeId,
      targetSiteId: target.id,
      targetDroneId: null,
      delay,
    });
  }
}

function tryBotBuild(world: World, bot: World["playerSide"]): void {
  const typeId = pickBuildType(world, bot);
  if (!BUILD_ORDER.includes(typeId)) return;
  const t = THEATERS[world.theaterId];
  const open = t.slots.flatMap((sl) => {
    if (sl.side !== bot) return [];
    const p = projectOwned(world.theaterId, sl.lon, sl.lat, sl.side);
    if (world.sites.some((s) => Math.hypot(s.x - p.x, s.y - p.y) < MIN_SITE_GAP)) return [];
    return [{ name: sl.name, x: p.x, y: p.y }];
  });
  if (open.length === 0) return;
  let sl = open[Math.floor(nextRng(world) * open.length)]!;
  if (SITE_TYPES[typeId].isAa || SITE_TYPES[typeId].isRadar || typeId === "ew") {
    const hq = world.sites.find((s) => s.alive && s.side === bot && s.typeId === "hq");
    if (hq) {
      open.sort((a, b) => Math.hypot(a.x - hq.x, a.y - hq.y) - Math.hypot(b.x - hq.x, b.y - hq.y));
      sl = open[Math.min(open.length - 1, Math.floor(nextRng(world) * Math.min(3, open.length)))]!;
    }
  } else if (typeId === "airfield") {
    const hq = world.sites.find((s) => s.alive && s.side !== bot && s.typeId === "hq");
    if (hq) {
      open.sort((a, b) => Math.hypot(a.x - hq.x, a.y - hq.y) - Math.hypot(b.x - hq.x, b.y - hq.y));
      sl = open[Math.min(open.length - 1, Math.floor(nextRng(world) * Math.min(3, open.length)))]!;
    }
  }
  placeSite(world, bot, typeId, sl.x, sl.y, sl.name);
}
