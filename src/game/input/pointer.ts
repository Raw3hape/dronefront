export interface PointerBus {
  dragging: boolean;
  lastX: number;
  lastY: number;
  pointers: Map<number, { x: number; y: number }>;
  pinch0: number | null;
}

export function createPointer(): PointerBus {
  return { dragging: false, lastX: 0, lastY: 0, pointers: new Map(), pinch0: null };
}

export function pinchDistance(bus: PointerBus): number | null {
  if (bus.pointers.size < 2) return null;
  const [a, b] = [...bus.pointers.values()];
  if (!a || !b) return null;
  return Math.hypot(a.x - b.x, a.y - b.y);
}
