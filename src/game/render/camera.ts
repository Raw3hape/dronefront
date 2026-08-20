import { WORLD_H, WORLD_W } from "@/game/sim/constants";
import { clamp } from "@/game/sim/spatial";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function fitCamera(viewW: number, viewH: number, focus?: { x: number; y: number }): Camera {
  const contain = Math.min(viewW / WORLD_W, viewH / WORLD_H);
  const portrait = viewH / Math.max(1, viewW) > 1.15;
  const zoom = portrait ? Math.max(viewH / WORLD_H, 0.5) : contain;
  const cam: Camera = { x: focus?.x ?? WORLD_W / 2, y: focus?.y ?? WORLD_H / 2, zoom };
  clampCam(cam, viewW, viewH);
  return cam;
}

function clampCam(cam: Camera, viewW: number, viewH: number): void {
  const visW = viewW / cam.zoom;
  const visH = viewH / cam.zoom;
  if (visW >= WORLD_W) cam.x = WORLD_W / 2;
  else cam.x = clamp(cam.x, visW / 2, WORLD_W - visW / 2);
  if (visH >= WORLD_H) cam.y = WORLD_H / 2;
  else cam.y = clamp(cam.y, visH / 2, WORLD_H - visH / 2);
}

export function worldToScreen(cam: Camera, viewW: number, viewH: number, x: number, y: number) {
  return {
    x: (x - cam.x) * cam.zoom + viewW / 2,
    y: (y - cam.y) * cam.zoom + viewH / 2,
  };
}

export function screenToWorld(cam: Camera, viewW: number, viewH: number, sx: number, sy: number) {
  return {
    x: cam.x + (sx - viewW / 2) / cam.zoom,
    y: cam.y + (sy - viewH / 2) / cam.zoom,
  };
}

export function pan(cam: Camera, dx: number, dy: number, viewW: number, viewH: number): void {
  const visW = viewW / cam.zoom;
  const visH = viewH / cam.zoom;
  if (visW < WORLD_W) cam.x -= dx / cam.zoom;
  if (visH < WORLD_H) cam.y -= dy / cam.zoom;
  clampCam(cam, viewW, viewH);
}

export function zoomAt(cam: Camera, viewW: number, viewH: number, sx: number, sy: number, factor: number): void {
  const before = screenToWorld(cam, viewW, viewH, sx, sy);
  cam.zoom = clamp(cam.zoom * factor, 0.16, 2.4);
  const after = screenToWorld(cam, viewW, viewH, sx, sy);
  cam.x += before.x - after.x;
  cam.y += before.y - after.y;
  clampCam(cam, viewW, viewH);
}
