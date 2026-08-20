import { createWorld } from "../src/game/sim/world";
import { tickWorld } from "../src/game/sim/loop";
import { enqueue } from "../src/game/sim/spawn";
import { canMove, canPlace, moveSite, placeSite } from "../src/game/sim/build";
import { inRange } from "../src/game/sim/range";
import { droneKnown, inRadar, revealSite, siteKnown } from "../src/game/sim/intel";
import { MAX_SITES_PER_SIDE, SIM_DT, WORLD_H, WORLD_W } from "../src/game/sim/constants";
import { DRONE_TYPES, SITE_TYPES, THEATER_ORDER, THEATERS, projectLl, projectOwned, sideAt } from "../src/game/catalog";
import { pickInbound, pickScoutAim, pickStrikeType } from "../src/game/ai/targeting";
import loc from "../src/game/catalog/loc.json";
import type { DifficultyId, TheaterId } from "../src/game/catalog/ids";
import type { World } from "../src/game/sim/types";
import { tickWin } from "../src/game/sim/win";

let fails = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) {
    fails += 1;
    console.error("FAIL", msg);
  }
}

function worldOf(
  theaterId: TheaterId = "front",
  difficultyId: DifficultyId = "recruit",
  playerSide: "west" | "east" = "west",
  seed = 7,
): World {
  return createWorld({ theaterId, difficultyId, playerSide, seed });
}

function hq(w: World, side: "west" | "east") {
  return w.sites.find((s) => s.side === side && s.typeId === "hq")!;
}

function placeOnApproach(w: World, typeId: "mog" | "aa", from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  for (let r = 100; r <= 240; r += 16) {
    const x = to.x - ux * r;
    const y = to.y - uy * r;
    if (placeSite(w, w.playerSide, typeId, x, y)) return true;
    for (const s of [-48, 48, -80, 80]) {
      if (placeSite(w, w.playerSide, typeId, x - uy * s, y + ux * s)) return true;
    }
  }
  for (let r = 96; r <= 280; r += 18) {
    for (let a = 0; a < 16; a++) {
      const x = to.x + Math.cos((a / 16) * Math.PI * 2) * r;
      const y = to.y + Math.sin((a / 16) * Math.PI * 2) * r;
      if (placeSite(w, w.playerSide, typeId, x, y)) return true;
    }
  }
  return false;
}

function know(w: World, side: "west" | "east"): void {
  for (const s of w.sites) if (s.side !== side) s.spotted[side] = true;
}

function step(w: World, seconds: number): void {
  const n = Math.floor(seconds / SIM_DT);
  for (let i = 0; i < n; i++) tickWorld(w, SIM_DT);
}

const front = worldOf();
const kyiv = hq(front, "west");
const rostov = hq(front, "east");
assert(siteKnown(kyiv, "west") && !siteKnown(rostov, "west"), "own HQ known, enemy HQ fogged");
assert(
  !enqueue(front, { side: "west", typeId: "loiter", targetSiteId: rostov.id, targetDroneId: null, delay: 0 }),
  "cannot strike fogged HQ",
);
assert(
  enqueue(front, { side: "west", typeId: "recon", targetSiteId: null, targetDroneId: null, wx: rostov.x, wy: rostov.y, delay: 0 }),
  "recon waypoint to Rostov",
);
step(front, 28);
assert(siteKnown(rostov, "west"), "overflight spots Rostov");
assert(front.drones.some((d) => d.live && d.typeId === "recon"), "recon still aloft after spot");
assert(
  enqueue(front, { side: "west", typeId: "loiter", targetSiteId: rostov.id, targetDroneId: null, delay: 0 }),
  "strike after spot",
);

assert(sideAt("front", kyiv.x, kyiv.y) === "west", "Kyiv is west of LoC");
assert(sideAt("front", rostov.x, rostov.y) === "east", "Rostov is east of LoC");
assert(!inRange(front, "west", "fpv", rostov.x, rostov.y), "FPV Kyiv→Rostov blocked");
assert(inRange(front, "west", "loiter", rostov.x, rostov.y), "Liutyi Kyiv→Rostov ok");
assert(
  !enqueue(front, { side: "west", typeId: "fpv", targetSiteId: rostov.id, targetDroneId: null, delay: 0 }),
  "enqueue FPV to Rostov fails",
);
assert(
  !enqueue(front, { side: "west", typeId: "interceptor", targetSiteId: rostov.id, targetDroneId: null, delay: 0 }),
  "interceptor cannot strike HQ",
);
assert(
  !enqueue(front, { side: "west", typeId: "loiter", targetSiteId: kyiv.id, targetDroneId: null, delay: 0 }),
  "cannot strike own HQ",
);

assert(canPlace(front, "west", "aa", rostov.x - 40, rostov.y) === "side", "AA on enemy side blocked");
assert(canPlace(front, "west", "aa", kyiv.x, kyiv.y) === "gap", "AA on HQ blocked by gap");
const aaOk = canPlace(front, "west", "aa", kyiv.x + 120, kyiv.y + 20);
assert(aaOk === null, `AA east of Kyiv placeable, got ${aaOk}`);
assert(placeSite(front, "west", "aa", kyiv.x + 120, kyiv.y + 20), "place AA");
assert(front.sites.some((s) => s.typeId === "aa" && s.side === "west" && s.alive), "AA exists");

const north = worldOf("north");
const kh = hq(north, "west");
const bel = hq(north, "east");
assert(sideAt("north", kh.x, kh.y) === "west", "Kharkiv west");
assert(sideAt("north", bel.x, bel.y) === "east", "Belgorod east");
assert(inRange(north, "west", "fpv", bel.x, bel.y), "north FPV reaches Belgorod");
assert(inRange(north, "west", "fiber", bel.x, bel.y), "north fiber reaches Belgorod");
const kursk = projectLl(36.1874, 51.7304, "front");
assert(sideAt("front", kursk.x, kursk.y) === "east", "Kursk is east of the international border");
const orel = projectLl(36.08, 52.97, "front");
assert(sideAt("front", orel.x, orel.y) === "east", "Orel stays east — LoC does not cut Russia");
assert(
  loc.ll.every((p) => p[1] <= 52.4),
  "LoC vertices stay on/south of the internationally recognized border",
);

const south = worldOf("south");
const dnipro = hq(south, "west");
const sRostov = hq(south, "east");
assert(sideAt("south", dnipro.x, dnipro.y) === "west", "Dnipro west");
assert(sideAt("south", sRostov.x, sRostov.y) === "east", "south Rostov east");
assert(!inRange(south, "west", "fpv", sRostov.x, sRostov.y), "south FPV cannot reach Rostov");
assert(inRange(south, "west", "loiter", sRostov.x, sRostov.y), "south Liutyi reaches Rostov");
assert(inRange(south, "west", "decoy", sRostov.x, sRostov.y), "south decoy escorts Liutyi");

const depth = worldOf("depth");
const dKyiv = hq(depth, "west");
const dMos = hq(depth, "east");
assert(dKyiv.name === "Kyiv" && dMos.name === "Moscow", "depth HQs are Kyiv and Moscow");
assert(sideAt("depth", dKyiv.x, dKyiv.y) === "west", "depth Kyiv west");
assert(sideAt("depth", dMos.x, dMos.y) === "east", "depth Moscow east");
assert(!siteKnown(dMos, "west"), "Moscow starts fogged");
assert(!inRange(depth, "west", "fpv", dMos.x, dMos.y), "FPV cannot Kyiv→Moscow");
assert(!inRange(depth, "west", "fiber", dMos.x, dMos.y), "fiber cannot Kyiv→Moscow");
assert(inRange(depth, "west", "loiter", dMos.x, dMos.y), "Liutyi Kyiv→Moscow");
assert(inRange(depth, "east", "loiter", dKyiv.x, dKyiv.y), "Geran Moscow→Kyiv");
const kalin = projectLl(20.4522, 54.7104, "depth");
assert(sideAt("depth", kalin.x, kalin.y) === "east", "Kaliningrad is east exclave");
const yekat = projectOwned("depth", 60.6122, 56.8519, "east");
assert(sideAt("depth", yekat.x, yekat.y) === "east", "Yekaterinburg east");
assert(yekat.x <= WORLD_W - 48, "Yekaterinburg inside placeable bounds");
const spb = projectLl(30.3351, 59.9343, "depth");
assert(sideAt("depth", spb.x, spb.y) === "east", "St. Petersburg east of LoC band");
assert(
  !enqueue(depth, { side: "west", typeId: "loiter", targetSiteId: dMos.id, targetDroneId: null, delay: 0 }),
  "cannot strike fogged Moscow",
);
assert(canPlace(depth, "west", "mog", dMos.x, dMos.y) === "side", "west cannot fortify Moscow");
assert(depth.sites.filter((s) => s.side === "west").length <= MAX_SITES_PER_SIDE, "depth west seed under cap");
assert(depth.sites.filter((s) => s.side === "east").length <= MAX_SITES_PER_SIDE, "depth east seed under cap");
const crimea = projectLl(34.1, 45.35, "depth");
assert(sideAt("depth", crimea.x, crimea.y) === "east", "Crimea stays east on depth");
const sochi = projectLl(39.7231, 43.5996, "depth");
assert(sideAt("depth", sochi.x, sochi.y) === "east", "Sochi east");
const lviv = projectLl(24.0297, 49.8397, "depth");
assert(sideAt("depth", lviv.x, lviv.y) === "west", "Lviv west");
const eastDepth = worldOf("depth", "recruit", "east", 5);
assert(!siteKnown(hq(eastDepth, "west"), "east"), "east player starts with Kyiv fogged");
assert(siteKnown(hq(eastDepth, "east"), "east"), "east player sees Moscow");
assert(pickScoutAim(depth, "west") != null, "scout aim while HQ hidden");
assert(pickScoutAim(depth, "west")!.x === dMos.x, "scout prefers hidden HQ");

for (const id of THEATER_ORDER) {
  for (const sl of THEATERS[id].slots) {
    const p = projectOwned(id, sl.lon, sl.lat, sl.side);
    assert(sideAt(id, p.x, p.y) === sl.side, `slot ${id}/${sl.key} on ${sl.side}`);
    assert(p.x >= 48 && p.y >= 48 && p.x <= WORLD_W - 48 && p.y <= WORLD_H - 48, `slot ${id}/${sl.key} in bounds`);
  }
  for (const s of THEATERS[id].sites) {
    const p = projectOwned(id, s.lon, s.lat, s.side);
    assert(sideAt(id, p.x, p.y) === s.side, `site ${id}/${s.key} on ${s.side}`);
    assert(p.x >= 48 && p.y >= 48 && p.x <= WORLD_W - 48 && p.y <= WORLD_H - 48, `site ${id}/${s.key} in bounds`);
  }
}

const eastW = worldOf("front", "recruit", "east", 3);
assert(inRange(eastW, "east", "loiter", hq(eastW, "west").x, hq(eastW, "west").y), "Geran Rostov→Kyiv");
assert(!inRange(eastW, "east", "fpv", hq(eastW, "west").x, hq(eastW, "west").y), "east FPV cannot reach Kyiv");

const ew = worldOf();
const eHq = hq(ew, "west");
assert(placeSite(ew, "west", "ew", eHq.x + 100, eHq.y + 40), "place EW");
know(ew, "east");
enqueue(ew, { side: "east", typeId: "loiter", targetSiteId: eHq.id, targetDroneId: null, delay: 0 });
step(ew, 2);
const geran = ew.drones.find((d) => d.live && d.typeId === "loiter");
assert(Boolean(geran), "Geran spawned from east");

const fiberW = worldOf();
const fHq = hq(fiberW, "west");
const fE = hq(fiberW, "east");
assert(placeSite(fiberW, "east", "ew", fE.x + 100, fE.y), "bot-side EW");
assert(
  !enqueue(fiberW, { side: "west", typeId: "fiber", targetSiteId: fE.id, targetDroneId: null, delay: 0 }),
  "fiber Kyiv→Rostov still blocked",
);
assert(DRONE_TYPES.fiber.ewProfile < 0.12, "fiber is jam-proof");
assert(SITE_TYPES.hq.isAirfield, "HQ is a pad");

assert(SITE_TYPES.mog.aaRange < SITE_TYPES.aa.aaRange, "mog radius < SAM");
assert(SITE_TYPES.aa.aaRange < SITE_TYPES.longsam.aaRange, "SAM radius < longsam");
assert(SITE_TYPES.mog.aaRange === 85, "mog 85 wu");
assert(SITE_TYPES.aa.aaRange === 240, "SAM 240 wu");
assert(SITE_TYPES.longsam.aaRange === 400, "longsam 400 wu");
assert(SITE_TYPES.shorad.aaRange > SITE_TYPES.mog.aaRange, "shorad longer than mog");
assert(SITE_TYPES.shorad.aaRange < SITE_TYPES.aa.aaRange, "shorad shorter than SAM");
assert(DRONE_TYPES.loiter.speed < 70, `loiter speed < 70, got ${DRONE_TYPES.loiter.speed}`);
assert(SITE_TYPES.mog.aaOrdnance === "gun", "mog fires guns");
assert(SITE_TYPES.mog.aaBurst === 3, "mog burst is three bullets");
assert(SITE_TYPES.mog.aaSpeed < SITE_TYPES.aa.aaSpeed, "gun slower than SAM so tracers read");
assert(SITE_TYPES.shorad.aaOrdnance === "missile", "shorad missiles");
assert(SITE_TYPES.shorad.aaBurst === 1, "SAM volley is one");
assert(SITE_TYPES.aa.aaOrdnance === "missile", "SAM missiles");
assert(SITE_TYPES.longsam.aaOrdnance === "missile", "longsam missiles");
assert(SITE_TYPES.radar.isRadar && SITE_TYPES.radar.radarRange === SITE_TYPES.aa.aaRange, "radar ring matches medium SAM");
assert(!SITE_TYPES.radar.isAa, "radar is not a battery");
assert(DRONE_TYPES.recon.spotRange > 0, "Leleka spots");
assert(DRONE_TYPES.fpv.spotRange === 0, "FPV does not spot");

for (const id of THEATER_ORDER) {
  const seeded = worldOf(id);
  const westN = seeded.sites.filter((s) => s.side === "west").length;
  const eastN = seeded.sites.filter((s) => s.side === "east").length;
  assert(westN > 2, `seeded ${id} west sites >2, got ${westN}`);
  assert(eastN > 2, `seeded ${id} east sites >2, got ${eastN}`);
  assert(westN <= MAX_SITES_PER_SIDE, `seeded ${id} west under cap`);
  assert(eastN <= MAX_SITES_PER_SIDE, `seeded ${id} east under cap`);
}

const rel = worldOf();
const rHq = hq(rel, "west");
assert(placeSite(rel, "west", "mog", rHq.x + 130, rHq.y + 30), "place mog");
const mog = rel.sites.find((s) => s.typeId === "mog" && s.side === "west")!;
assert(canMove(rel, mog.id, hq(rel, "east").x, hq(rel, "east").y) === "side", "canMove across LoC fails");
const destX = mog.x - 40;
const destY = mog.y + 20;
assert(moveSite(rel, mog.id, destX, destY), "moveSite orders dest");
assert(Math.hypot(mog.x - destX, mog.y - destY) > 2, "moveSite does not teleport");
assert(mog.destX === destX && mog.destY === destY, "dest set");
step(rel, 3);
assert(Math.hypot(mog.x - destX, mog.y - destY) <= 2, "tickRelocate eventually arrives");

const guns = worldOf("north");
const gHq = hq(guns, "west");
const gEast = hq(guns, "east");
assert(placeOnApproach(guns, "mog", gEast, gHq), "place mog for gun fire");
const mogGun = guns.sites.find((s) => s.typeId === "mog" && s.side === "west")!;
know(guns, "east");
assert(
  enqueue(guns, { side: "east", typeId: "fpv", targetSiteId: gHq.id, targetDroneId: null, delay: 0 }),
  "east FPV inbound on north for mog",
);
let maxGunLive = 0;
let sawGunSprite = false;
for (let i = 0; i < 360; i++) {
  tickWorld(guns, SIM_DT);
  const liveGun = guns.shots.filter((s) => s.live && s.kind === "gun").length;
  maxGunLive = Math.max(maxGunLive, liveGun);
  if (guns.shots.some((s) => s.live && s.kind === "missile" && Math.hypot(s.x - mogGun.x, s.y - mogGun.y) < 18)) {
    sawGunSprite = true;
  }
}
assert(guns.events.some((e) => e.kind === "gun"), "mog emits gun events");
assert(
  !guns.events.some((e) => e.kind === "aa" && Math.hypot(e.x - mogGun.x, e.y - mogGun.y) < 3),
  "mog does not emit SAM events",
);
assert(maxGunLive >= 3, `mog volley puts 3 tracers in flight, got ${maxGunLive}`);
assert(!sawGunSprite, "mog never spawned a SAM sprite");

const samW = worldOf("north");
const sHq = hq(samW, "west");
const sEast = hq(samW, "east");
assert(placeOnApproach(samW, "aa", sEast, sHq), "place SAM");
const sam = samW.sites.find((s) => s.typeId === "aa" && s.side === "west")!;
know(samW, "east");
assert(
  enqueue(samW, { side: "east", typeId: "loiter", targetSiteId: sHq.id, targetDroneId: null, delay: 0 }),
  "Geran inbound for SAM",
);
step(samW, 10);
assert(samW.events.some((e) => e.kind === "aa" && Math.hypot(e.x - sam.x, e.y - sam.y) < 3), "SAM emits aa events");
assert(
  !samW.events.some((e) => e.kind === "gun" && Math.hypot(e.x - sam.x, e.y - sam.y) < 3),
  "SAM does not emit gun events",
);

const rad = worldOf("north");
const radHq = hq(rad, "west");
const radE = hq(rad, "east");
know(rad, "east");
assert(
  enqueue(rad, { side: "east", typeId: "fpv", targetSiteId: radHq.id, targetDroneId: null, delay: 0 }),
  "east FPV for radar test",
);
step(rad, 0.4);
const inbound = rad.drones.find((d) => d.live && d.side === "east");
assert(Boolean(inbound), "inbound exists");
assert(inbound != null && !droneKnown(rad, inbound, "west"), "no radar → inbound dark");
assert(placeSite(rad, "west", "radar", radHq.x + 90, radHq.y - 90), "place radar");
assert(inbound != null && droneKnown(rad, inbound, "west") === inRadar(rad, "west", inbound.x, inbound.y), "contact iff in radar");
assert(
  !enqueue(rad, { side: "west", typeId: "interceptor", targetSiteId: null, targetDroneId: inbound!.id, delay: 0 }) ||
    droneKnown(rad, inbound!, "west"),
  "cannot hunt a dark contact",
);

const steer = worldOf("north");
const stE = hq(steer, "east");
assert(
  enqueue(steer, { side: "west", typeId: "recon", targetSiteId: null, targetDroneId: null, wx: stE.x, wy: stE.y, delay: 0 }),
  "recon launch north",
);
step(steer, 1);
const bird = steer.drones.find((d) => d.live && d.typeId === "recon")!;
assert(Boolean(bird), "recon airborne");
const ox = bird.x;
const oy = bird.y;
bird.destX = bird.x + 40;
bird.destY = bird.y - 20;
step(steer, 1.2);
assert(Math.hypot(bird.x - ox, bird.y - oy) > 8, "steer moves recon");
assert(
  !enqueue(steer, { side: "west", typeId: "recon", targetSiteId: stE.id, targetDroneId: null, delay: 0 }),
  "recon still needs a waypoint, not a site id",
);
assert(steer.drones.some((d) => d.live && d.typeId === "recon"), "recon does not kamikaze on launch");

assert(pickStrikeType(worldOf("depth"), "west", 0) === "recon", "bot scouts while enemy HQ is fogged");
assert(pickInbound(worldOf("north"), "west") == null, "no intercept without a radar picture");
assert(WORLD_W === loc.world[0] && WORLD_H === loc.world[1], "sim world size is loc.json");

const acq = worldOf("north");
const acqHq = hq(acq, "west");
const acqE = hq(acq, "east");
know(acq, "east");
assert(enqueue(acq, { side: "east", typeId: "fpv", targetSiteId: acqHq.id, targetDroneId: null, delay: 0 }), "dark FPV for acquire");
step(acq, 0.4);
const acqPrey = acq.drones.find((d) => d.live && d.side === "east")!;
assert(Boolean(acqPrey) && !droneKnown(acq, acqPrey, "west"), "acquire prey is dark");
assert(enqueue(acq, { side: "west", typeId: "recon", targetSiteId: null, targetDroneId: null, wx: acqHq.x + 80, wy: acqHq.y, delay: 0 }), "west bird");
step(acq, 0.5);
const kite = acq.drones.find((d) => d.live && d.side === "west")!;
assert(Boolean(kite), "west bird airborne");
kite.typeId = "interceptor";
kite.targetDroneId = null;
kite.life = "hunt";
kite.fuel = DRONE_TYPES.interceptor.range;
tickWorld(acq, SIM_DT);
assert(kite.targetDroneId !== acqPrey.id, "airborne interceptor does not acquire a dark contact");

const idle = worldOf("front", "operator", "west", 11);
step(idle, 200);
assert(idle.phase === "lost", `idle operator loses, got ${idle.phase} t=${idle.time.toFixed(1)}`);

const play = worldOf("front", "recruit", "west", 21);
const pHq = hq(play, "west");
const pE = hq(play, "east");
placeSite(play, "west", "aa", pHq.x + 110, pHq.y);
placeSite(play, "west", "aa", pHq.x + 110, pHq.y + 90);
placeSite(play, "west", "ew", pHq.x + 40, pHq.y + 100);
know(play, "west");
let fire = 0;
for (let i = 0; i < Math.floor(240 / SIM_DT); i++) {
  fire -= SIM_DT;
  if (fire <= 0 && play.phase === "play") {
    if (
      enqueue(play, {
        side: "west",
        typeId: "loiter",
        targetSiteId: pE.id,
        targetDroneId: null,
        delay: 0,
      })
    ) {
      fire = 2.1;
    }
  }
  tickWorld(play, SIM_DT);
  if (play.phase !== "play") break;
}
assert(play.phase === "won", `recruit push wins, got ${play.phase} t=${play.time.toFixed(1)} ehq=${hq(play, "east").hp}`);
assert(hq(play, "west").alive, "player HQ lives on recruit win");

const depthIdle = worldOf("depth", "operator", "west", 13);
step(depthIdle, 220);
assert(depthIdle.phase === "lost", `idle operator loses on depth, got ${depthIdle.phase} t=${depthIdle.time.toFixed(1)}`);
assert(hq(depthIdle, "west").hp < hq(depthIdle, "west").maxHp || !hq(depthIdle, "west").alive, "bot found Kyiv");

const depthPush = worldOf("depth", "recruit", "west", 21);
const dpHq = hq(depthPush, "west");
const dpE = hq(depthPush, "east");
placeSite(depthPush, "west", "aa", dpHq.x + 110, dpHq.y);
placeSite(depthPush, "west", "ew", dpHq.x + 40, dpHq.y + 100);
know(depthPush, "west");
let dFire = 0;
for (let i = 0; i < Math.floor(240 / SIM_DT); i++) {
  dFire -= SIM_DT;
  if (dFire <= 0 && depthPush.phase === "play") {
    if (
      enqueue(depthPush, {
        side: "west",
        typeId: "loiter",
        targetSiteId: dpE.id,
        targetDroneId: null,
        delay: 0,
      })
    ) {
      dFire = 2.1;
    }
  }
  tickWorld(depthPush, SIM_DT);
  if (depthPush.phase !== "play") break;
}
assert(depthPush.phase === "won", `depth recruit push wins, got ${depthPush.phase} t=${depthPush.time.toFixed(1)}`);
assert(hq(depthPush, "west").alive, "player HQ lives on depth win");

const dead = worldOf();
const dE = hq(dead, "east");
dE.alive = false;
dE.hp = 0;
assert(
  !enqueue(dead, { side: "west", typeId: "loiter", targetSiteId: dE.id, targetDroneId: null, delay: 0 }),
  "cannot launch at wreck",
);

const cap = worldOf();
const cHq = hq(cap, "west");
let placed = cap.sites.filter((s) => s.side === "west" && s.alive).length;
for (let i = 0; i < 24; i++) {
  const x = cHq.x - 90 - (i % 5) * 90;
  const y = cHq.y + Math.floor(i / 5) * 90 - 80;
  if (placeSite(cap, "west", "fuel", x, y)) placed += 1;
}
assert(placed <= MAX_SITES_PER_SIDE, `cap ${MAX_SITES_PER_SIDE}, placed ${placed}`);
assert(
  canPlace(cap, "west", "fuel", cHq.x - 400, cHq.y) === "cap" || placed < MAX_SITES_PER_SIDE,
  "cap fail or ran out of valid tiles",
);

const FPV_HQ: Record<TheaterId, boolean> = { north: true, front: false, south: false, depth: false };
for (const id of THEATER_ORDER) {
  for (const player of ["west", "east"] as const) {
    const w = worldOf(id, "recruit", player, 7);
    const own = hq(w, player);
    const enemy = hq(w, player === "west" ? "east" : "west");
    const tag = `${id}/${player}`;
    assert(siteKnown(own, player), `${tag} own HQ known at start`);
    assert(!siteKnown(enemy, player), `${tag} enemy HQ fogged at start`);
    assert(sideAt(id, own.x, own.y) === player, `${tag} HQ on own side of LoC`);
    assert(sideAt(id, enemy.x, enemy.y) !== player, `${tag} enemy HQ on far side`);
    assert(inRange(w, player, "loiter", enemy.x, enemy.y), `${tag} loiter reaches enemy HQ`);
    assert(
      inRange(w, player, "fpv", enemy.x, enemy.y) === FPV_HQ[id],
      `${tag} FPV HQ reach expected ${FPV_HQ[id]}, got ${inRange(w, player, "fpv", enemy.x, enemy.y)}`,
    );
    assert(
      inRange(w, player, "fiber", enemy.x, enemy.y) === FPV_HQ[id],
      `${tag} fiber HQ reach expected ${FPV_HQ[id]}`,
    );
    const nOwn = w.sites.filter((s) => s.side === player && s.alive).length;
    const nEnemy = w.sites.filter((s) => s.side !== player && s.alive).length;
    assert(nOwn <= MAX_SITES_PER_SIDE, `${tag} own seed under cap, got ${nOwn}`);
    assert(nEnemy <= MAX_SITES_PER_SIDE, `${tag} enemy seed under cap, got ${nEnemy}`);
    assert(canPlace(w, player, "mog", enemy.x, enemy.y) === "side", `${tag} cannot fortify enemy HQ`);
    assert(pickStrikeType(w, player, 0) === "recon", `${tag} bot mix is recon while enemy HQ fogged`);
    assert(pickStrikeType(w, player, 4) === "recon", `${tag} still recon while HQ fogged even with inbound`);
  }
}

const frontCrimea = projectLl(34.1, 45.35, "front");
assert(sideAt("front", frontCrimea.x, frontCrimea.y) === "east", "Crimea stays east on front");
const frontLviv = projectLl(24.0297, 49.8397, "front");
assert(sideAt("front", frontLviv.x, frontLviv.y) === "west", "Lviv west on front");
assert(sideAt("depth", kalin.x, kalin.y) === "east", "Kaliningrad east exclave (repeat)");
assert(yekat.x >= 48 && yekat.x <= WORLD_W - 48 && yekat.y >= 48 && yekat.y <= WORLD_H - 48, "Yekaterinburg in bounds");

const recFact = worldOf("north");
recFact.botCd = 1e9;
recFact.botBuildCd = 1e9;
const sheb = recFact.sites.find((s) => s.side === "east" && s.typeId === "factory")!;
assert(Boolean(sheb) && !siteKnown(sheb, "west"), "east factory starts fogged");
assert(
  enqueue(recFact, { side: "west", typeId: "recon", targetSiteId: sheb.id, targetDroneId: null, delay: 0 }) === false,
  "recon needs waypoint, not a factory site id",
);
assert(
  enqueue(recFact, { side: "west", typeId: "recon", targetSiteId: null, targetDroneId: null, wx: sheb.x, wy: sheb.y, delay: 0 }),
  "recon waypoint over factory",
);
step(recFact, 8);
assert(siteKnown(sheb, "west"), "recon overflight reveals factory");
assert(recFact.drones.some((d) => d.live && d.typeId === "recon"), "recon does not kamikaze on factory");
assert(!recFact.events.some((e) => e.kind === "hit"), "recon does not strike the yard");

const darkHunt = worldOf("north");
darkHunt.botCd = 1e9;
darkHunt.botBuildCd = 1e9;
const dhHq = hq(darkHunt, "west");
know(darkHunt, "east");
assert(
  enqueue(darkHunt, { side: "east", typeId: "fpv", targetSiteId: dhHq.id, targetDroneId: null, delay: 0 }),
  "inbound FPV for dark intercept",
);
step(darkHunt, 0.5);
const darkPrey = darkHunt.drones.find((d) => d.live && d.side === "east")!;
assert(Boolean(darkPrey), "dark prey exists");
assert(!droneKnown(darkHunt, darkPrey, "west"), "no radar → prey unknown");
assert(
  !enqueue(darkHunt, { side: "west", typeId: "interceptor", targetSiteId: null, targetDroneId: darkPrey.id, delay: 0 }),
  "intercept requires radar contact (droneKnown)",
);
assert(placeSite(darkHunt, "west", "radar", dhHq.x + 90, dhHq.y - 90), "place radar for contact");
assert(
  enqueue(darkHunt, { side: "west", typeId: "interceptor", targetSiteId: null, targetDroneId: darkPrey.id, delay: 0 }) ===
    droneKnown(darkHunt, darkPrey, "west"),
  "hunt allowed iff contact",
);

assert(SITE_TYPES.radar.radarRange > 0, "radarRange > 0");
assert(!SITE_TYPES.radar.isAa, "radar is not AA");
assert(SITE_TYPES.radar.aaRange === 0 && SITE_TYPES.radar.aaBurst === 1, "radar has no battery stats");

const radSilent = worldOf("north");
radSilent.botCd = 1e9;
radSilent.botBuildCd = 1e9;
const rsHq = hq(radSilent, "west");
assert(placeSite(radSilent, "west", "radar", rsHq.x + 90, rsHq.y - 90), "radar for silent AA");
const radarSite = radSilent.sites.find((s) => s.typeId === "radar" && s.side === "west")!;
know(radSilent, "east");
enqueue(radSilent, { side: "east", typeId: "fpv", targetSiteId: rsHq.id, targetDroneId: null, delay: 0 });
step(radSilent, 2.2);
assert(
  !radSilent.events.some((e) => (e.kind === "aa" || e.kind === "gun") && Math.hypot(e.x - radarSite.x, e.y - radarSite.y) < 3),
  "radar does not fire AA",
);
assert(!radSilent.shots.some((s) => s.live), "radar-only map has no tracers");

const fiberJam = worldOf("north");
fiberJam.botCd = 1e9;
fiberJam.botBuildCd = 1e9;
const fjE = hq(fiberJam, "east");
let ewPlaced = false;
for (const [dx, dy] of [
  [-110, 0],
  [-100, 50],
  [-90, -60],
  [0, 110],
  [80, 90],
  [-80, 80],
] as const) {
  if (placeSite(fiberJam, "east", "ew", fjE.x + dx, fjE.y + dy)) {
    ewPlaced = true;
    break;
  }
}
assert(ewPlaced, "place EW on north approach");
know(fiberJam, "west");
assert(
  enqueue(fiberJam, { side: "west", typeId: "fiber", targetSiteId: fjE.id, targetDroneId: null, delay: 0 }),
  "fiber launch through EW",
);
assert(
  enqueue(fiberJam, { side: "west", typeId: "fpv", targetSiteId: fjE.id, targetDroneId: null, delay: 0 }),
  "radio FPV launch through EW",
);
step(fiberJam, 0.5);
const fib = fiberJam.drones.find((d) => d.live && d.typeId === "fiber");
const radio = fiberJam.drones.find((d) => d.live && d.typeId === "fpv");
assert(Boolean(fib), "fiber airborne");
assert(Boolean(radio), "radio FPV airborne");
const fibFuel0 = fib!.fuel;
step(fiberJam, 1.2);
assert(fib!.live, "fiber still aloft in EW");
assert(!fib!.jammed, "fiber jam-proof (ewProfile near 0)");
assert(fib!.fuel < fibFuel0, "fiber still burns fuel");
assert(radio!.jammed, "radio FPV is jammed in EW");
assert(DRONE_TYPES.fiber.ewProfile < 0.12, "fiber ewProfile near 0");

const ePlace = worldOf("front", "recruit", "east");
assert(canPlace(ePlace, "east", "aa", hq(ePlace, "west").x, hq(ePlace, "west").y) === "side", "east cannot place on west HQ");
const depthRel = worldOf("depth");
assert(placeSite(depthRel, "west", "mog", hq(depthRel, "west").x + 130, hq(depthRel, "west").y + 40), "depth mog");
const depthMog = depthRel.sites.find((s) => s.typeId === "mog" && s.side === "west")!;
assert(canMove(depthRel, depthMog.id, hq(depthRel, "east").x, hq(depthRel, "east").y) === "side", "relocate across LoC fails on depth");

const wreckYard = worldOf();
const eastFac = wreckYard.sites.find((s) => s.side === "east" && s.typeId === "factory")!;
revealSite(eastFac, "west", wreckYard.time);
eastFac.alive = false;
eastFac.hp = 0;
assert(
  !enqueue(wreckYard, { side: "west", typeId: "loiter", targetSiteId: eastFac.id, targetDroneId: null, delay: 0 }),
  "cannot launch at factory wreck",
);

const yards = worldOf();
for (const s of yards.sites) {
  if (s.side === "east" && s.typeId !== "hq") {
    s.alive = false;
    s.hp = 0;
  }
}
tickWin(yards);
assert(yards.phase === "play", "killing factory/yards does not win");
assert(hq(yards, "east").alive, "enemy HQ still standing after yard wipe");
const eDead = hq(yards, "east");
eDead.alive = false;
eDead.hp = 0;
tickWin(yards);
assert(yards.phase === "won", "win only when enemy HQ dead");

const ownDown = worldOf();
const oHq = hq(ownDown, "west");
oHq.alive = false;
oHq.hp = 0;
tickWin(ownDown);
assert(ownDown.phase === "lost", "own HQ dead is a loss even if enemy HQ lives");

if (fails) {
  console.error(`${fails} failed`);
  process.exit(1);
}
console.log("ok", {
  frontDist: Math.round(Math.hypot(rostov.x - kyiv.x, rostov.y - kyiv.y)),
  northDist: Math.round(Math.hypot(bel.x - kh.x, bel.y - kh.y)),
  southDist: Math.round(Math.hypot(sRostov.x - dnipro.x, sRostov.y - dnipro.y)),
  idleT: +idle.time.toFixed(1),
  winT: +play.time.toFixed(1),
  depthIdleT: +depthIdle.time.toFixed(1),
  depthWinT: +depthPush.time.toFixed(1),
});
