function mulberry(seed: number): number {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function nextRng(world: { rng: number }): number {
  const n = mulberry(world.rng | 0);
  world.rng = (Math.imul(world.rng + 1, 747796405) + 2891336453) | 0;
  return n;
}

export function range(world: { rng: number }, a: number, b: number): number {
  return a + (b - a) * nextRng(world);
}
