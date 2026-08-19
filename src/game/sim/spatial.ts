import { WORLD_H, WORLD_W } from "./constants";

const CELL = 140;

export function cellKey(x: number, y: number): number {
  const cx = Math.max(0, Math.min(Math.floor(x / CELL), Math.ceil(WORLD_W / CELL)));
  const cy = Math.max(0, Math.min(Math.floor(y / CELL), Math.ceil(WORLD_H / CELL)));
  return cy * 64 + cx;
}

export function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}

export function angleTo(ax: number, ay: number, bx: number, by: number): number {
  return Math.atan2(by - ay, bx - ax);
}

export function turnToward(from: number, to: number, max: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  if (d > max) d = max;
  if (d < -max) d = -max;
  return from + d;
}

export function inWorld(x: number, y: number): boolean {
  return x >= -40 && y >= -40 && x <= WORLD_W + 40 && y <= WORLD_H + 40;
}
