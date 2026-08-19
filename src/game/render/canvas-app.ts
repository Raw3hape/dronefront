import { DRONE_TYPES, SITE_TYPES } from "@/game/catalog";
import { createWorld, enqueue, snapHud, tickWorld } from "@/game/sim";
import { MAX_DT, SIM_DT } from "@/game/sim/constants";
import { dist2 } from "@/game/sim/spatial";
import type { MatchConfig, World } from "@/game/sim/types";
import { sfxAa, sfxHit, sfxLaunch, sfxLose, sfxWin, setMuted, unlockAudio } from "@/game/audio/engine";
import { useSession } from "@/game/session/store";
import { pushRun } from "@/game/save/persist";
import { createPointer, pinchDistance } from "@/game/input/pointer";
import { fitCamera, pan, screenToWorld, zoomAt, type Camera } from "./camera";
import { drawMap } from "./draw-map";
import { drawDrones, drawSites } from "./draw-entities";
import { drawFx, drawMinimap, drawShots } from "./draw-fx";
import { loadAtlas, type Atlas } from "./sprites";

export interface Handle {
  world: World;
  destroy: () => void;
  launchAt: (siteId: string) => void;
}

export function startGame(canvas: HTMLCanvasElement, cfg: MatchConfig): Handle {
  const raw = canvas.getContext("2d");
  if (!raw) throw new Error("canvas");
  const ctx: CanvasRenderingContext2D = raw;
  const world = createWorld(cfg);
  let atlas: Atlas | null = null;
  void loadAtlas().then((a) => {
    atlas = a;
  });
  let cam: Camera = fitCamera(1, 1);
  let acc = 0;
  let last = performance.now();
  let hudT = 0;
  let running = true;
  const bus = createPointer();
  let viewW = 1;
  let viewH = 1;
  let ended = false;

  function resize(): void {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    viewW = r.width;
    viewH = r.height;
    canvas.width = Math.max(1, Math.floor(r.width * dpr));
    canvas.height = Math.max(1, Math.floor(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (cam.zoom < 0.05) cam = fitCamera(viewW, viewH);
  }
  resize();
  cam = fitCamera(viewW, viewH);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function hitSite(wx: number, wy: number) {
    let best = null as (typeof world.sites)[number] | null;
    let bestD = 48 * 48;
    for (const s of world.sites) {
      const rad = SITE_TYPES[s.typeId].radius + 10;
      const d = dist2(wx, wy, s.x, s.y);
      if (d < rad * rad && d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  function hitDrone(wx: number, wy: number) {
    let best = null as (typeof world.drones)[number] | null;
    let bestD = 28 * 28;
    for (const d of world.drones) {
      if (!d.live) continue;
      const dd = dist2(wx, wy, d.x, d.y);
      if (dd < bestD) {
        best = d;
        bestD = dd;
      }
    }
    return best;
  }

  function launchAtSite(siteId: string): void {
    const session = useSession.getState();
    const typeId = session.selected;
    if (!typeId || world.phase !== "play") return;
    const side = world.playerSide;
    const orders = session.packageMode
      ? [
          { typeId: "decoy" as const, delay: 0 },
          { typeId: "fpv" as const, delay: 0.35 },
          { typeId, delay: 0.7 },
        ]
      : [{ typeId, delay: 0 }];
    let any = false;
    for (const o of orders) {
      const ok = enqueue(world, {
        side,
        typeId: o.typeId,
        targetSiteId: siteId,
        targetDroneId: null,
        delay: o.delay,
      });
      any = any || ok;
    }
    if (any) sfxLaunch();
  }

  function onClick(sx: number, sy: number): void {
    const wpt = screenToWorld(cam, viewW, viewH, sx, sy);
    const session = useSession.getState();
    const typeId = session.selected;
    if (!typeId || world.phase !== "play") return;
    const type = DRONE_TYPES[typeId];
    if (type.role === "intercept") {
      const d = hitDrone(wpt.x, wpt.y);
      enqueue(world, {
        side: world.playerSide,
        typeId,
        targetSiteId: null,
        targetDroneId: d && d.side !== world.playerSide ? d.id : null,
        delay: 0,
      });
      sfxLaunch();
      return;
    }
    const site = hitSite(wpt.x, wpt.y);
    if (site && site.side !== world.playerSide) launchAtSite(site.id);
  }

  function localXY(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  const onDown = (e: PointerEvent) => {
    unlockAudio();
    setMuted(useSession.getState().muted);
    canvas.setPointerCapture(e.pointerId);
    const p = localXY(e);
    bus.pointers.set(e.pointerId, p);
    bus.lastX = p.x;
    bus.lastY = p.y;
    bus.dragging = false;
    bus.pinch0 = pinchDistance(bus);
  };
  const onMove = (e: PointerEvent) => {
    const p = localXY(e);
    bus.pointers.set(e.pointerId, p);
    const wpt = screenToWorld(cam, viewW, viewH, p.x, p.y);
    const site = hitSite(wpt.x, wpt.y);
    useSession.getState().setHover(site?.id ?? null);
    const pinch = pinchDistance(bus);
    if (pinch && bus.pinch0) {
      zoomAt(cam, viewW, viewH, p.x, p.y, pinch / bus.pinch0);
      bus.pinch0 = pinch;
      return;
    }
    if (bus.pointers.size === 1 && (e.buttons & 1 || e.pointerType === "touch")) {
      const dx = p.x - bus.lastX;
      const dy = p.y - bus.lastY;
      if (Math.hypot(dx, dy) > 3) bus.dragging = true;
      if (bus.dragging) pan(cam, dx, dy, viewW, viewH);
      bus.lastX = p.x;
      bus.lastY = p.y;
    }
  };
  const onUp = (e: PointerEvent) => {
    const p = localXY(e);
    if (!bus.dragging && bus.pointers.size <= 1) onClick(p.x, p.y);
    bus.pointers.delete(e.pointerId);
    bus.pinch0 = pinchDistance(bus);
    bus.dragging = false;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    zoomAt(cam, viewW, viewH, e.clientX - r.left, e.clientY - r.top, e.deltaY > 0 ? 0.9 : 1.1);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (world.phase === "play") {
        world.phase = "paused";
        useSession.getState().setUi("paused");
      } else if (world.phase === "paused") {
        world.phase = "play";
        useSession.getState().setUi("play");
      }
    }
    const map: Record<string, (typeof DRONE_TYPES)[keyof typeof DRONE_TYPES]["id"]> = {
      Digit1: "fpv",
      Digit2: "loiter",
      Digit3: "interceptor",
      Digit4: "recon",
      Digit5: "bomber",
      Digit6: "decoy",
    };
    const id = map[e.code];
    if (id) useSession.getState().setSelected(id);
    if (e.code === "KeyQ") useSession.getState().togglePackage();
    if (e.code === "KeyM") useSession.getState().toggleMute();
    if (e.code === "Escape") {
      if (world.phase === "play") {
        world.phase = "paused";
        useSession.getState().setUi("paused");
      } else if (world.phase === "paused") {
        world.phase = "play";
        useSession.getState().setUi("play");
      }
    }
  };

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);

  function frame(now: number): void {
    if (!running) return;
    const raw = Math.min(MAX_DT, (now - last) / 1000);
    last = now;
    const paused = useSession.getState().ui === "paused" || world.phase === "paused";
    if (!paused && world.phase === "play") {
      acc += raw;
      while (acc >= SIM_DT) {
        const evN = world.events.length;
        tickWorld(world, SIM_DT);
        for (let i = evN; i < world.events.length; i++) {
          const ev = world.events[i]!;
          if (ev.kind === "aa") sfxAa();
          if (ev.kind === "hit" || ev.kind === "site") sfxHit();
        }
        acc -= SIM_DT;
      }
    }
    if (!ended && (world.phase === "won" || world.phase === "lost")) {
      ended = true;
      useSession.getState().setResult(world.phase);
      if (world.phase === "won") sfxWin();
      else sfxLose();
      pushRun({
        theaterId: world.theaterId,
        difficultyId: world.difficultyId,
        side: world.playerSide,
        won: world.phase === "won",
        duration: world.time,
        damage: world.stats[world.playerSide].damage,
        at: Date.now(),
      });
    }
    hudT += raw;
    if (hudT > 0.12) {
      hudT = 0;
      useSession.getState().setHud(snapHud(world));
    }
    ctx.fillStyle = "#0c0d0b";
    ctx.fillRect(0, 0, viewW, viewH);
    if (atlas) {
      drawMap(ctx, world, atlas, cam, viewW, viewH);
      const selected = useSession.getState().selected;
      const aaOn = selected === "recon" || selected === "decoy";
      drawSites(ctx, world, atlas, cam, viewW, viewH, useSession.getState().hoverSiteId, aaOn);
      drawDrones(ctx, world, atlas, cam, viewW, viewH);
      drawShots(ctx, world, atlas, cam, viewW, viewH);
      drawFx(ctx, world, atlas, cam, viewW, viewH);
      drawMinimap(ctx, world, atlas, cam, viewW, viewH);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    world,
    launchAt: launchAtSite,
    destroy: () => {
      running = false;
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    },
  };
}
