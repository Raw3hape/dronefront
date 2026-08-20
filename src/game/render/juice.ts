let mag = 0;

export function addShake(n: number): void {
  mag = Math.min(6, mag + n);
}

export function tickShake(dt: number): { x: number; y: number } {
  mag *= Math.exp(-dt * 8);
  if (mag < 0.05) {
    mag = 0;
    return { x: 0, y: 0 };
  }
  const a = Math.random() * Math.PI * 2;
  return { x: Math.cos(a) * mag, y: Math.sin(a) * mag };
}
