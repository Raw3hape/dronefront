import { DRONE_TYPES, SITE_TYPES } from "@/game/catalog";
import { enqueue } from "@/game/sim";
import { moveSite, placeSite } from "@/game/sim/build";
import { inRange } from "@/game/sim/range";
import type { SessionState } from "@/game/session/store";
import type { SiteState, World } from "@/game/sim/types";

export function ownMobile(world: World, site: SiteState | null): SiteState | null {
  if (!site || site.side !== world.playerSide || !SITE_TYPES[site.typeId].mobile) return null;
  return site;
}

export function launchAtSite(world: World, session: SessionState, siteId: string, sfx: () => void): void {
  const typeId = session.selected;
  if (!typeId || world.phase !== "play") return;
  const site = world.sites.find((s) => s.id === siteId);
  if (!site || !site.alive || site.side === world.playerSide) return;
  if (DRONE_TYPES[typeId].role === "intercept") return;
  const orders = session.packageMode
    ? [
        { typeId, delay: 0.55 },
        { typeId: "decoy" as const, delay: 0 },
        { typeId: "fpv" as const, delay: 0.28 },
      ]
    : [{ typeId, delay: 0 }];
  let any = false;
  for (const o of orders) {
    if (DRONE_TYPES[o.typeId].role === "intercept") continue;
    if (!inRange(world, world.playerSide, o.typeId, site.x, site.y)) continue;
    any = enqueue(world, {
      side: world.playerSide,
      typeId: o.typeId,
      targetSiteId: siteId,
      targetDroneId: null,
      delay: o.delay,
    }) || any;
  }
  if (any) sfx();
}

export function fortifyClick(
  world: World,
  session: SessionState,
  x: number,
  y: number,
  pick: SiteState | null,
  sfx: () => void,
): void {
  const mobile = ownMobile(world, pick);
  if (session.relocateId) {
    if (mobile) {
      session.setRelocate(mobile.id);
      return;
    }
    if (moveSite(world, session.relocateId, x, y)) sfx();
    session.setRelocate(null);
    return;
  }
  if (mobile) {
    session.setRelocate(mobile.id);
    return;
  }
  if (session.buildType && placeSite(world, world.playerSide, session.buildType, x, y)) sfx();
}
