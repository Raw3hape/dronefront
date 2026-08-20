import { DRONE_TYPES, FACTIONS, SITE_TYPES } from "@/game/catalog";
import type { SiteTypeId } from "@/game/catalog/ids";
import { siteMoving } from "@/game/sim/build";
import type { World } from "@/game/sim/types";
import { worldToScreen, type Camera } from "./camera";
import type { Atlas } from "./sprites";

export function drawSites(
  ctx: CanvasRenderingContext2D,
  world: World,
  atlas: Atlas,
  cam: Camera,
  viewW: number,
  viewH: number,
  hoverId: string | null,
  showRanges: boolean,
): void {
  for (const site of world.sites) {
    const t = SITE_TYPES[site.typeId];
    const p = worldToScreen(cam, viewW, viewH, site.x, site.y);
    const size = Math.max(18, t.drawSize * cam.zoom * 0.82);
    const tint = site.side === "west" ? "rgba(109,142,174,0.55)" : "rgba(197,106,82,0.55)";
    const ring = site.side === "west" ? "rgba(109,142,174,0.9)" : "rgba(197,106,82,0.9)";
    const range = t.isAa ? t.aaRange : t.isEw ? t.ewRange : 0;
    if (range && (showRanges || hoverId === site.id || site.markedUntil > world.time)) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, range * cam.zoom, 0, Math.PI * 2);
      ctx.strokeStyle = t.isEw ? "rgba(168,150,210,0.35)" : site.side === "west" ? "rgba(109,142,174,0.28)" : "rgba(197,106,82,0.28)";
      ctx.setLineDash(t.isEw ? [5, 4] : []);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (site.alive && siteMoving(site)) {
      const dest = worldToScreen(cam, viewW, viewH, site.destX, site.destY);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = ring;
      ctx.lineWidth = Math.max(1.2, 1.6 * cam.zoom);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(dest.x, dest.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(dest.x, dest.y, size * 0.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.fillStyle = site.alive ? tint : "rgba(40,38,34,0.55)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = site.alive ? ring : "rgba(92,83,76,0.7)";
    ctx.lineWidth = Math.max(1.5, 2 * cam.zoom);
    ctx.stroke();
    const img = atlas.sites[t.sprite];
    if (!site.alive) ctx.globalAlpha = 0.4;
    if (img) ctx.drawImage(img, p.x - size / 2, p.y - size / 2, size, size);
    if (site.markedUntil > world.time && site.alive) {
      ctx.strokeStyle = "rgba(230,228,216,0.7)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    const bw = size * 0.85;
    const bh = Math.max(3, 3.5 * cam.zoom);
    ctx.fillStyle = "rgba(10,10,11,0.75)";
    ctx.fillRect(p.x - bw / 2, p.y + size * 0.4, bw, bh);
    ctx.fillStyle = site.alive ? (site.side === world.playerSide ? "#8fa37a" : "#c56a52") : "#5c534c";
    ctx.fillRect(p.x - bw / 2, p.y + size * 0.4, bw * (site.hp / site.maxHp), bh);
    const showName = hoverId === site.id || site.typeId === "hq" || cam.zoom > 0.72;
    if (showName) {
      const label = site.name;
      ctx.font = `${Math.max(10, Math.round(11 * Math.min(1.2, cam.zoom + 0.4)))}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(12,13,11,0.8)";
      ctx.fillStyle = "rgba(230,228,216,0.92)";
      ctx.strokeText(label, p.x, p.y - size * 0.5);
      ctx.fillText(label, p.x, p.y - size * 0.5);
    }
  }
}

export function drawGhost(
  ctx: CanvasRenderingContext2D,
  atlas: Atlas,
  cam: Camera,
  viewW: number,
  viewH: number,
  x: number,
  y: number,
  typeId: SiteTypeId,
  ok: boolean,
  padRange = 0,
): void {
  const t = SITE_TYPES[typeId];
  const p = worldToScreen(cam, viewW, viewH, x, y);
  const size = Math.max(18, t.drawSize * cam.zoom * 0.82);
  ctx.save();
  ctx.globalAlpha = 0.55;
  const range = t.isAa ? t.aaRange : t.isEw ? t.ewRange : t.isAirfield ? padRange : 0;
  if (range) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, range * cam.zoom, 0, Math.PI * 2);
    ctx.strokeStyle = ok ? "rgba(141,163,122,0.45)" : "rgba(196,92,74,0.5)";
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = ok ? "rgba(141,163,122,0.9)" : "rgba(196,92,74,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, size * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  const img = atlas.sites[t.sprite];
  if (img) ctx.drawImage(img, p.x - size / 2, p.y - size / 2, size, size);
  ctx.restore();
}

export function drawDrones(
  ctx: CanvasRenderingContext2D,
  world: World,
  atlas: Atlas,
  cam: Camera,
  viewW: number,
  viewH: number,
): void {
  for (const d of world.drones) {
    if (!d.live) continue;
    const type = DRONE_TYPES[d.typeId];
    const p = worldToScreen(cam, viewW, viewH, d.x, d.y);
    const size = Math.max(16, type.drawSize * cam.zoom);
    const img = atlas.drones[type.sprite];
    const low = d.maxFuel > 0 && d.fuel / d.maxFuel < 0.22;
    ctx.save();
    ctx.strokeStyle = d.jammed ? "rgba(168,150,210,0.8)" : FACTIONS[d.side].trail;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - Math.cos(d.heading) * 18 * cam.zoom, p.y - Math.sin(d.heading) * 18 * cam.zoom);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.translate(p.x, p.y);
    ctx.rotate(d.heading + Math.PI / 2);
    ctx.fillStyle = d.jammed ? "rgba(168,150,210,0.55)" : low ? "rgba(196,92,74,0.6)" : FACTIONS[d.side].tint;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.32, size * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size);
    else {
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 3, size / 2);
      ctx.lineTo(-size / 3, size / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const bw = size * 0.7;
    const bh = Math.max(2, 2.4 * cam.zoom);
    ctx.fillStyle = "rgba(10,10,11,0.7)";
    ctx.fillRect(p.x - bw / 2, p.y + size * 0.42, bw, bh);
    ctx.fillStyle = low ? "#c45c4a" : "#e8d6a8";
    ctx.fillRect(p.x - bw / 2, p.y + size * 0.42, bw * Math.max(0, d.fuel / Math.max(1, d.maxFuel)), bh);
  }
}
