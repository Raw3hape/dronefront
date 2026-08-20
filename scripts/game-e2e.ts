import { createWorld } from "../src/game/sim/world";
import { tickWorld } from "../src/game/sim/loop";
import { enqueue } from "../src/game/sim/spawn";
import { canMove, canPlace, moveSite, placeSite } from "../src/game/sim/build";
import { inRange } from "../src/game/sim/range";
import { MAX_SITES_PER_SIDE, SIM_DT } from "../src/game/sim/constants";
import { DRONE_TYPES, SITE_TYPES, projectLl, projectOwned, sideAt, THEATERS } from "../src/game/catalog";
import loc from "../src/game/catalog/loc.json";
import type { DifficultyId, TheaterId } from "../src/game/catalog/ids";
import type { World } from "../src/game/sim/types";

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

function step(w: World, seconds: number): void {
  const n = Math.floor(seconds / SIM_DT);
  for (let i = 0; i < n; i++) tickWorld(w, SIM_DT);
}

const front = worldOf();
const kyiv = hq(front, "west");
const rostov = hq(front, "east");
assert(sideAt("front", kyiv.x, kyiv.y) === "west", "Kyiv is west of LoC");
assert(sideAt("front", rostov.x, rostov.y) === "east", "Rostov is east of LoC");
assert(!inRange(front, "west", "fpv", rostov.x, rostov.y), "FPV Kyiv→Rostov blocked");
assert(inRange(front, "west", "loiter", rostov.x, rostov.y), "Liutyi Kyiv→Rostov ok");
assert(
  !enqueue(front, { side: "west", typeId: "fpv", targetSiteId: rostov.id, targetDroneId: null, delay: 0 }),
  "enqueue FPV to Rostov fails",
);
assert(
  enqueue(front, { side: "west", typeId: "loiter", targetSiteId: rostov.id, targetDroneId: null, delay: 0 }),
  "enqueue Liutyi to Rostov",
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

for (const id of ["front", "north", "south"] as const) {
  for (const sl of THEATERS[id].slots) {
    const p = projectOwned(id, sl.lon, sl.lat, sl.side);
    assert(sideAt(id, p.x, p.y) === sl.side, `slot ${id}/${sl.key} on ${sl.side}`);
  }
  for (const s of THEATERS[id].sites) {
    const p = projectOwned(id, s.lon, s.lat, s.side);
    assert(sideAt(id, p.x, p.y) === s.side, `site ${id}/${s.key} on ${s.side}`);
  }
}

const eastW = worldOf("front", "recruit", "east", 3);
assert(inRange(eastW, "east", "loiter", hq(eastW, "west").x, hq(eastW, "west").y), "Geran Rostov→Kyiv");
assert(!inRange(eastW, "east", "fpv", hq(eastW, "west").x, hq(eastW, "west").y), "east FPV cannot reach Kyiv");

const ew = worldOf();
const eHq = hq(ew, "west");
assert(placeSite(ew, "west", "ew", eHq.x + 100, eHq.y + 40), "place EW");
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

for (const id of ["front", "north", "south"] as const) {
  const seeded = worldOf(id);
  const westN = seeded.sites.filter((s) => s.side === "west").length;
  const eastN = seeded.sites.filter((s) => s.side === "east").length;
  assert(westN > 2, `seeded ${id} west sites >2, got ${westN}`);
  assert(eastN > 2, `seeded ${id} east sites >2, got ${eastN}`);
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

const idle = worldOf("front", "operator", "west", 11);
step(idle, 200);
assert(idle.phase === "lost", `idle operator loses, got ${idle.phase} t=${idle.time.toFixed(1)}`);

const play = worldOf("front", "recruit", "west", 21);
const pHq = hq(play, "west");
const pE = hq(play, "east");
placeSite(play, "west", "aa", pHq.x + 110, pHq.y);
placeSite(play, "west", "aa", pHq.x + 110, pHq.y + 90);
placeSite(play, "west", "ew", pHq.x + 40, pHq.y + 100);
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
});
