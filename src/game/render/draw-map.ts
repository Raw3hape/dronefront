import { locLine } from "@/game/catalog/frontline";
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
  drawLoc(ctx, world, cam, viewW, viewH);
}

function drawLoc(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  viewW: number,
  viewH: number,
): void {
  const pts = locLine(world.theaterId);
  if (pts.length < 2) return;
  const to = (p: { x: number; y: number }) => worldToScreen(cam, viewW, viewH, p.x, p.y);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const path = () => {
    ctx.beginPath();
    pts.forEach((pt, i) => {
      const p = to(pt);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
  };
  path();
  ctx.strokeStyle = "rgba(8,9,8,0.7)";
  ctx.lineWidth = Math.max(8, 11 * cam.zoom);
  ctx.stroke();
  path();
  ctx.strokeStyle = "rgba(236, 220, 168, 0.96)";
  ctx.lineWidth = Math.max(3, 4.4 * cam.zoom);
  ctx.stroke();
  path();
  ctx.strokeStyle = "rgba(196, 92, 74, 0.7)";
  ctx.lineWidth = Math.max(1.2, 1.8 * cam.zoom);
  ctx.setLineDash([7 * cam.zoom, 5 * cam.zoom]);
  ctx.stroke();
  ctx.setLineDash([]);
  const step = Math.max(1, Math.floor(pts.length / 16));
  ctx.strokeStyle = "rgba(236, 220, 168, 0.8)";
  ctx.lineWidth = Math.max(1.2, 1.6 * cam.zoom);
  for (let i = 0; i < pts.length - 1; i += step) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 14;
    const ny = (dx / len) * 14;
    const p = to(a);
    const q = to({ x: a.x + nx, y: a.y + ny });
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
  const mid = pts[Math.floor(pts.length * 0.42)]!;
  const label = to(mid);
  ctx.font = `${Math.max(10, Math.round(11 * Math.min(1.3, cam.zoom + 0.35)))}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "left";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(12,13,11,0.85)";
  ctx.fillStyle = "rgba(236,220,168,0.92)";
  ctx.strokeText("LoC · Aug 2026", label.x + 8, label.y - 8);
  ctx.fillText("LoC · Aug 2026", label.x + 8, label.y - 8);
  ctx.restore();
}
