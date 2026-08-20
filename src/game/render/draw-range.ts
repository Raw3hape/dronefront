import { DRONE_TYPES, SITE_TYPES } from "@/game/catalog";
import type { DroneTypeId, SideId } from "@/game/catalog/ids";
import type { World } from "@/game/sim/types";
import { RANGE_SLACK } from "@/game/sim/range";
import { worldToScreen, type Camera } from "./camera";

export function drawPadRanges(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  viewW: number,
  viewH: number,
  side: SideId,
  typeId: DroneTypeId,
  hoverId: string | null,
): void {
  const r = DRONE_TYPES[typeId].range * RANGE_SLACK;
  const stroke = side === "west" ? "rgba(109,142,174,0.38)" : "rgba(197,106,82,0.38)";
  const hot = "rgba(232,214,168,0.55)";
  for (const site of world.sites) {
    if (!site.alive || site.side !== side) continue;
    if (!SITE_TYPES[site.typeId].isAirfield) continue;
    const p = worldToScreen(cam, viewW, viewH, site.x, site.y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * cam.zoom, 0, Math.PI * 2);
    ctx.strokeStyle = hoverId ? hot : stroke;
    ctx.setLineDash([7, 5]);
    ctx.lineWidth = 1.25;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
