import { FACTIONS } from "@/game/catalog";
import { locLine } from "@/game/catalog/frontline";
import { WORLD_H, WORLD_W } from "@/game/sim/constants";
import type { World } from "@/game/sim/types";
import { worldToScreen, type Camera } from "./camera";
import type { Atlas } from "./sprites";

export function drawShots(
  ctx: CanvasRenderingContext2D,
  world: World,
  atlas: Atlas,
  cam: Camera,
  viewW: number,
  viewH: number,
): void {
  for (const s of world.shots) {
    if (!s.live) continue;
    const speed = Math.hypot(s.vx, s.vy) || 1;
    const ux = s.vx / speed;
    const uy = s.vy / speed;
    const p = worldToScreen(cam, viewW, viewH, s.x, s.y);
    if (s.kind === "gun") {
      const tail = worldToScreen(cam, viewW, viewH, s.x - ux * 22, s.y - uy * 22);
      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255,164,64,0.28)";
      ctx.lineWidth = Math.max(3.4, 4.4 * cam.zoom);
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.strokeStyle = "#ffb347";
      ctx.lineWidth = Math.max(1.5, 2.1 * cam.zoom);
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.fillStyle = "#fff4c8";
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.5, 2.2 * cam.zoom), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }
    for (let i = 3; i >= 1; i--) {
      const tp = worldToScreen(cam, viewW, viewH, s.x - ux * i * 10, s.y - uy * i * 10);
      ctx.globalAlpha = 0.12 * (4 - i);
      ctx.fillStyle = "#e6e4d8";
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, Math.max(1.1, (4.2 - i) * cam.zoom), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const ang = Math.atan2(s.vy, s.vx);
    const img = atlas.missile[Math.floor(world.time * 12) % atlas.missile.length];
    const size = Math.max(10, 18 * cam.zoom);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    if (img) ctx.drawImage(img, -size / 2, -size / 4, size, size / 2);
    else {
      ctx.fillStyle = "#e6e4d8";
      ctx.fillRect(-size / 2, -1.5, size, 3);
    }
    ctx.restore();
  }
}

export function drawFx(
  ctx: CanvasRenderingContext2D,
  world: World,
  atlas: Atlas,
  cam: Camera,
  viewW: number,
  viewH: number,
): void {
  for (const f of world.fx) {
    if (!f.live) continue;
    const p = worldToScreen(cam, viewW, viewH, f.x, f.y);
    const t = 1 - f.life / f.maxLife;
    const a = Math.max(0, f.life / f.maxLife);
    if (f.kind === "burst") {
      const frame = atlas.explode[Math.min(3, Math.floor(t * 4))];
      const size = (f.size + 40) * cam.zoom;
      ctx.globalAlpha = a;
      if (frame) ctx.drawImage(frame, p.x - size / 2, p.y - size / 2, size, size);
      ctx.globalAlpha = 1;
      continue;
    }
    ctx.globalAlpha = a * 0.85;
    ctx.fillStyle =
      f.kind === "flash" ? "#e6e4d8" : f.side ? FACTIONS[f.side].tint : "rgba(230,228,216,0.8)";
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1, f.size * cam.zoom * (f.kind === "ring" ? 1 + t * 2 : 1)), 0, Math.PI * 2);
    if (f.kind === "ring") ctx.stroke();
    else ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  world: World,
  atlas: Atlas,
  cam: Camera,
  viewW: number,
  viewH: number,
): void {
  const mw = Math.min(176, viewW * 0.3);
  const mh = mw * (WORLD_H / WORLD_W);
  const x = viewW - mw - 12;
  const y = viewH - mh - 12 - Math.min(168, viewH * 0.28);
  ctx.save();
  ctx.globalAlpha = 0.92;
  const map = atlas.maps[world.theaterId];
  if (map) ctx.drawImage(map, x, y, mw, mh);
  else {
    ctx.fillStyle = "rgba(12,13,11,0.8)";
    ctx.fillRect(x, y, mw, mh);
  }
  ctx.globalAlpha = 1;
  const sx = mw / WORLD_W;
  const sy = mh / WORLD_H;
  const loc = locLine(world.theaterId);
  if (loc.length > 1) {
    ctx.beginPath();
    loc.forEach((p, i) => {
      const px = x + p.x * sx;
      const py = y + p.y * sy;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = "rgba(232,214,168,0.85)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(230,228,216,0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, mw, mh);
  for (const site of world.sites) {
    ctx.fillStyle = !site.alive ? "rgba(230,228,216,0.25)" : site.side === "west" ? "#6d8eae" : "#c56a52";
    const r = site.typeId === "hq" ? 2.4 : 1.6;
    ctx.fillRect(x + site.x * sx - r, y + site.y * sy - r, r * 2, r * 2);
  }
  for (const d of world.drones) {
    if (!d.live) continue;
    ctx.fillStyle = d.jammed ? "#b8a8d4" : d.side === "west" ? "#9bb6cc" : "#e09a86";
    ctx.fillRect(x + d.x * sx - 1, y + d.y * sy - 1, 2, 2);
  }
  ctx.strokeStyle = "rgba(230,228,216,0.55)";
  const vw = viewW / cam.zoom;
  const vh = viewH / cam.zoom;
  ctx.strokeRect(x + (cam.x - vw / 2) * sx, y + (cam.y - vh / 2) * sy, vw * sx, vh * sy);
  ctx.restore();
}
