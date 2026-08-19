import { DIFFICULTIES, SITE_TYPES } from "@/game/catalog";
import { clampStocks } from "./world";
import type { World } from "./types";

export function tickEconomy(world: World, dt: number): void {
  const mul = DIFFICULTIES[world.difficultyId].economyMul;
  for (const site of world.sites) {
    if (!site.alive) continue;
    const prod = SITE_TYPES[site.typeId].produce;
    const bag = world.stocks[site.side];
    if (prod.parts) bag.parts += prod.parts * mul * dt;
    if (prod.fuel) bag.fuel += prod.fuel * mul * dt;
    if (prod.warheads) bag.warheads += prod.warheads * mul * dt;
    if (prod.electronics) bag.electronics += prod.electronics * mul * dt;
  }
  clampStocks(world);
}
