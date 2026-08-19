import { WORLD_H, WORLD_W } from "@/game/sim/constants";
import type { World } from "@/game/sim/types";
import type { Atlas } from "./sprites";
import type { Camera } from "./camera";
import { worldToScreen } from "./camera";

export function drawMap(
  ctx: CanvasRenderingContext2D,
  world: World,
  atlas: Atlas,
  cam: Camera,
  viewW: number,
  viewH: number,
): void {
  const img = atlas.maps[world.theaterId];
  const origin = worldToScreen(cam, viewW, viewH, 0, 0);
  const w = WORLD_W * cam.zoom;
  const h = WORLD_H * cam.zoom;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (img) ctx.drawImage(img, origin.x, origin.y, w, h);
  else {
    ctx.fillStyle = "#152022";
    ctx.fillRect(origin.x, origin.y, w, h);
  }
}
