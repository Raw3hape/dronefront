let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

export function unlockAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.28;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setMuted(v: boolean): void {
  muted = v;
  if (master && ctx) master.gain.setTargetAtTime(v ? 0 : 0.28, ctx.currentTime, 0.02);
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.12): void {
  if (!ctx || !master || muted) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g);
  g.connect(master);
  o.start();
  o.stop(ctx.currentTime + dur);
}

export function sfxLaunch(): void {
  beep(420, 0.09, "square", 0.06);
  beep(640, 0.07, "triangle", 0.04);
}

export function sfxHit(): void {
  beep(90, 0.18, "sawtooth", 0.1);
}

export function sfxAa(): void {
  beep(980, 0.04, "square", 0.03);
}

export function sfxWin(): void {
  beep(440, 0.2, "triangle", 0.08);
  beep(660, 0.28, "triangle", 0.07);
}

export function sfxLose(): void {
  beep(140, 0.4, "sawtooth", 0.1);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") unlockAudio();
  });
}
