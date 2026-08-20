import { DRONE_ORDER, DRONE_TYPES, SITE_TYPES } from "@/game/catalog";
import { createWorld, enqueue, snapHud, tickWorld } from "@/game/sim";
import { canMove, canPlace } from "@/game/sim/build";
import { inRange } from "@/game/sim/range";
import { pickInbound } from "@/game/ai/targeting";
import { MAX_DT, SIM_DT } from "@/game/sim/constants";
import { dist2 } from "@/game/sim/spatial";
import { droneKnown, siteKnown } from "@/game/sim/intel";
import type { MatchConfig, World } from "@/game/sim/types";
import { sfxAa, sfxGun, sfxHit, sfxLaunch, sfxLose, sfxWin, setMuted, unlockAudio } from "@/game/audio/engine";
import { useSession } from "@/game/session/store";
import { pushRun } from "@/game/save/persist";
import { createPointer, pinchDistance } from "@/game/input/pointer";
import { fitCamera, pan, screenToWorld, zoomAt, type Camera } from "./camera";
import { drawMap } from "./draw-map";
import { drawDrones, drawGhost, drawSites } from "./draw-entities";
import { drawPadRanges, drawScoutGhost } from "./draw-range";
import { drawFx, drawMinimap, drawShots } from "./draw-fx";
import { loadAtlas, type Atlas } from "./sprites";
import { addShake, tickShake } from "./juice";
import { fortifyClick, launchAtSite, ownMobile, reconClick } from "./orders";

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
  let cursor = { x: 0, y: 0, on: false };
  let holdSite = false;
  let fitted = false;

  function resize(): void {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    viewW = Math.max(1, r.width);
    viewH = Math.max(1, r.height);
    canvas.width = Math.max(1, Math.floor(r.width * dpr));
    canvas.height = Math.max(1, Math.floor(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ready = viewW >= 280 && viewH >= 280;
    if (!fitted && ready) {
      fitted = true;
      const portrait = viewH / Math.max(1, viewW) > 1.15;
      const focus = world.sites.find((s) => s.side === world.playerSide && s.typeId === "hq");
      cam = fitCamera(viewW, viewH, portrait && focus ? { x: focus.x, y: focus.y } : undefined);
    }
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function hitSite(wx: number, wy: number) {
    let best = null as (typeof world.sites)[number] | null;
    const minR = Math.max(48, 28 / cam.zoom);
    let bestD = minR * minR;
    for (const s of world.sites) {
      if (!s.alive) continue;
      if (s.side !== world.playerSide && !siteKnown(s, world.playerSide)) continue;
      const rad = Math.max(SITE_TYPES[s.typeId].radius + 10, 28 / cam.zoom);
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
    const hitR = Math.max(40, 24 / cam.zoom);
    let bestD = hitR * hitR;
    for (const d of world.drones) {
      if (!d.live) continue;
      if (!droneKnown(world, d, world.playerSide)) continue;
      const dd = dist2(wx, wy, d.x, d.y);
      if (dd < bestD) {
        best = d;
        bestD = dd;
      }
    }
    return best;
  }

  function onLaunch(siteId: string): void {
    launchAtSite(world, useSession.getState(), siteId, sfxLaunch);
  }

  function onClick(sx: number, sy: number): void {
    const wpt = screenToWorld(cam, viewW, viewH, sx, sy);
    const session = useSession.getState();
    if (world.phase !== "play") return;
    if (session.dockTab === "fortify") {
      fortifyClick(world, session, wpt.x, wpt.y, hitSite(wpt.x, wpt.y), sfxLaunch);
      return;
    }
    const typeId = session.selected;
    if (!typeId) return;
    const type = DRONE_TYPES[typeId];
    if (type.role === "recon") {
      reconClick(world, session, wpt.x, wpt.y, hitDrone(wpt.x, wpt.y), sfxLaunch);
      return;
    }
    if (type.role === "intercept") {
      const d = hitDrone(wpt.x, wpt.y);
      const clicked = d && d.side !== world.playerSide ? d.id : null;
      const prey = clicked ?? pickInbound(world, world.playerSide);
      if (prey == null) return;
      const ok = enqueue(world, {
        side: world.playerSide,
        typeId,
        targetSiteId: null,
        targetDroneId: prey,
        delay: 0,
      });
      if (ok) sfxLaunch();
      return;
    }
    const site = hitSite(wpt.x, wpt.y);
    if (site && site.side !== world.playerSide) onLaunch(site.id);
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
    holdSite = false;
    bus.pinch0 = pinchDistance(bus);
    const session = useSession.getState();
    if (session.dockTab === "fortify" && world.phase === "play") {
      const wpt = screenToWorld(cam, viewW, viewH, p.x, p.y);
      const pick = ownMobile(world, hitSite(wpt.x, wpt.y));
      if (pick) {
        session.setRelocate(pick.id);
        holdSite = true;
      }
    }
  };
  const onMove = (e: PointerEvent) => {
    const p = localXY(e);
    bus.pointers.set(e.pointerId, p);
    const wpt = screenToWorld(cam, viewW, viewH, p.x, p.y);
    cursor = { x: wpt.x, y: wpt.y, on: true };
    useSession.getState().setHover(hitSite(wpt.x, wpt.y)?.id ?? null);
    const pinch = pinchDistance(bus);
    if (pinch && bus.pinch0) {
      zoomAt(cam, viewW, viewH, p.x, p.y, pinch / bus.pinch0);
      bus.pinch0 = pinch;
      return;
    }
    if (bus.pointers.size === 1 && (e.buttons & 1 || e.pointerType === "touch")) {
      const dx = p.x - bus.lastX;
      const dy = p.y - bus.lastY;
      const slop = holdSite ? 22 : e.pointerType === "touch" ? 14 : 5;
      if (Math.hypot(dx, dy) > slop) bus.dragging = true;
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
    holdSite = false;
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
    const map: Record<string, (typeof DRONE_ORDER)[number]> = {
      Digit1: "fpv", Digit2: "fiber", Digit3: "loiter", Digit4: "lancet",
      Digit5: "interceptor", Digit6: "recon", Digit7: "bomber", Digit8: "decoy",
    };
    const id = map[e.code];
    if (id) useSession.getState().setSelected(id);
    if (e.code === "KeyB") {
      const tab = useSession.getState().dockTab;
      useSession.getState().setDockTab(tab === "fortify" ? "sortie" : "fortify");
    }
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
    const rawDt = Math.min(MAX_DT, (now - last) / 1000);
    last = now;
    const paused = useSession.getState().ui === "paused" || world.phase === "paused";
    if (!paused && world.phase === "play") {
      acc += rawDt;
      while (acc >= SIM_DT) {
        const evN = world.events.length;
        tickWorld(world, SIM_DT);
        for (let i = evN; i < world.events.length; i++) {
          const ev = world.events[i]!;
          if (ev.kind === "aa") sfxAa();
          if (ev.kind === "gun") sfxGun();
          if (ev.kind === "hit" || ev.kind === "site" || ev.kind === "bingo") sfxHit();
          if (ev.kind === "kill") addShake(2.2);
          if (ev.kind === "site") addShake(4.5);
        }
        if (world.events.length > 40) world.events.splice(0, world.events.length - 24);
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
    hudT += rawDt;
    if (hudT > 0.12) {
      hudT = 0;
      useSession.getState().setHud(snapHud(world));
    }
    const sh = tickShake(rawDt);
    ctx.fillStyle = "#0c0d0b";
    ctx.fillRect(0, 0, viewW, viewH);
    if (atlas) {
      ctx.save();
      ctx.translate(sh.x, sh.y);
      drawMap(ctx, world, atlas, cam, viewW, viewH);
      const session = useSession.getState();
      const showRanges = session.dockTab === "fortify" || session.selected === "recon";
      drawSites(ctx, world, atlas, cam, viewW, viewH, session.hoverSiteId, showRanges);
      if (session.selected && (session.dockTab === "sortie" || session.buildType === "airfield")) {
        drawPadRanges(ctx, world, cam, viewW, viewH, world.playerSide, session.selected, session.hoverSiteId);
      }
      if (session.dockTab === "fortify" && cursor.on) {
        const rs = session.relocateId ? world.sites.find((s) => s.id === session.relocateId) : null;
        const typeId = rs?.typeId ?? session.buildType;
        if (typeId) {
          const ok = rs
            ? canMove(world, rs.id, cursor.x, cursor.y) === null
            : canPlace(world, world.playerSide, typeId, cursor.x, cursor.y) === null;
          const padRange =
            !rs && typeId === "airfield" && session.selected ? DRONE_TYPES[session.selected].range : 0;
          drawGhost(ctx, atlas, cam, viewW, viewH, cursor.x, cursor.y, typeId, ok, padRange);
        }
      }
      if (session.dockTab === "sortie" && session.selected && DRONE_TYPES[session.selected].role === "recon" && cursor.on) {
        drawScoutGhost(
          ctx,
          cam,
          viewW,
          viewH,
          cursor.x,
          cursor.y,
          DRONE_TYPES[session.selected].spotRange,
          inRange(world, world.playerSide, session.selected, cursor.x, cursor.y),
        );
      }
      drawDrones(ctx, world, atlas, cam, viewW, viewH);
      drawShots(ctx, world, atlas, cam, viewW, viewH);
      drawFx(ctx, world, atlas, cam, viewW, viewH);
      ctx.restore();
      drawMinimap(ctx, world, atlas, cam, viewW, viewH);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    world,
    launchAt: onLaunch,
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
