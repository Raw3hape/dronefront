import { WORLD_H, WORLD_W } from "@/game/sim/constants";
import { clamp } from "@/game/sim/spatial";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function fitCamera(viewW: number, viewH: number): Camera {
  const zoom = Math.min(viewW / WORLD_W, viewH / WORLD_H);
  return { x: WORLD_W / 2, y: WORLD_H / 2, zoom };
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
  cam.x = clamp(cam.x - dx / cam.zoom, viewW / (2 * cam.zoom), WORLD_W - viewW / (2 * cam.zoom));
  cam.y = clamp(cam.y - dy / cam.zoom, viewH / (2 * cam.zoom), WORLD_H - viewH / (2 * cam.zoom));
  cam.x = clamp(cam.x, 0, WORLD_W);
  cam.y = clamp(cam.y, 0, WORLD_H);
}

export function zoomAt(cam: Camera, viewW: number, viewH: number, sx: number, sy: number, factor: number): void {
  const before = screenToWorld(cam, viewW, viewH, sx, sy);
  cam.zoom = clamp(cam.zoom * factor, 0.28, 2.4);
  const after = screenToWorld(cam, viewW, viewH, sx, sy);
  cam.x += before.x - after.x;
  cam.y += before.y - after.y;
}
