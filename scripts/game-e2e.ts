import { createWorld } from "../src/game/sim/world";
import { tickWorld } from "../src/game/sim/loop";
import { enqueue } from "../src/game/sim/spawn";
import { canPlace, placeSite } from "../src/game/sim/build";
import { inRange } from "../src/game/sim/range";
import { SIM_DT } from "../src/game/sim/constants";
import { DRONE_TYPES, SITE_TYPES, sideAt, THEATERS } from "../src/game/catalog";
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
assert(!inRange(front, "west", "bomber", rostov.x, rostov.y), "Vampire Kyiv→Rostov blocked");
assert(!inRange(front, "west", "lancet", rostov.x, rostov.y), "Warmate Kyiv→Rostov blocked");
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
    assert(sideAt(id, sl.x, sl.y) === sl.side, `slot ${id}/${sl.key} on ${sl.side}`);
  }
  for (const s of THEATERS[id].sites) {
    assert(sideAt(id, s.x, s.y) === s.side, `hq ${id}/${s.key} on ${s.side}`);
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
assert(placeSite(fiberW, "east", "ew", fE.x - 100, fE.y), "bot-side EW");
assert(
  !enqueue(fiberW, { side: "west", typeId: "fiber", targetSiteId: fE.id, targetDroneId: null, delay: 0 }),
  "fiber Kyiv→Rostov still blocked",
);
assert(DRONE_TYPES.fiber.ewProfile < 0.12, "fiber is jam-proof");
assert(SITE_TYPES.hq.isAirfield, "HQ is a pad");

const idle = worldOf("front", "operator", "west", 11);
step(idle, 90);
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
let placed = 1;
for (let i = 0; i < 20; i++) {
  const x = cHq.x - 90 - (i % 5) * 90;
  const y = cHq.y + Math.floor(i / 5) * 90 - 80;
  if (placeSite(cap, "west", "fuel", x, y)) placed += 1;
}
assert(placed <= 14, `cap 14, placed ${placed}`);
assert(
  canPlace(cap, "west", "fuel", cHq.x - 400, cHq.y) === "cap" || placed < 14,
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
