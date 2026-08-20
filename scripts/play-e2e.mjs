#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { checkedOutputPath, checkedUrl } from "./browser-guard.mjs";

const base = checkedUrl(process.argv[2] || "http://127.0.0.1:8080/");
const outDir = "/workspace/screenshots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const errors = [];
let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL", msg);
  }
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (err) => errors.push(String(err?.message || err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(base, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(400);
  assert((await page.getByRole("heading", { name: "DRONEFRONT" }).count()) > 0, "title heading");
  await page.screenshot({ path: checkedOutputPath(`${outDir}/title.png`, ["/workspace"]) });
  assert((await page.getByText("Strategic depth").count()) > 0, "depth theater on title");
  assert((await page.getByText("Full theater").count()) > 0, "front theater on title");
  assert((await page.getByText("Kharkiv — Belgorod").count()) > 0, "north theater on title");
  assert((await page.getByText("Donbas — Azov").count()) > 0, "south theater on title");
  const thumbs = page.locator('button img[src*="/game/maps/"]');
  assert((await thumbs.count()) >= 4, "4 theater thumbs");
  await page.goto(`${base.replace(/\/$/, "")}/play?t=depth&s=west&d=recruit`, {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.waitForSelector("canvas", { timeout: 20000 });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: checkedOutputPath(`${outDir}/play-depth.png`, ["/workspace"]) });
  assert((await page.getByText("Enemy fog").count()) > 0, "depth starts fogged");
  assert((await page.getByText(/No spotted yards|send Leleka/i).count()) > 0, "recon prompt while fogged");
  await page.keyboard.press("Digit6");
  await page.waitForTimeout(300);
  assert((await page.getByText(/Tap the map to send a scout/i).count()) > 0, "recon waypoint hint");
  await page.screenshot({ path: checkedOutputPath(`${outDir}/play-depth-recon.png`, ["/workspace"]) });
  const depthCanvas = page.locator("canvas");
  const dbox = await depthCanvas.boundingBox();
  if (dbox) {
    await page.mouse.click(dbox.x + dbox.width * 0.48, dbox.y + dbox.height * 0.32);
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: checkedOutputPath(`${outDir}/play-depth-scout.png`, ["/workspace"]) });

  const mobile = await browser.newPage({ viewport: { width: 440, height: 956 } });
  mobile.on("pageerror", (err) => errors.push(`mobile ${err?.message || err}`));
  await mobile.goto(`${base.replace(/\/$/, "")}/play?t=depth&s=west&d=recruit`, {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await mobile.waitForSelector("canvas", { timeout: 20000 });
  await mobile.waitForTimeout(800);
  await mobile.screenshot({ path: checkedOutputPath(`${outDir}/play-depth-mobile.png`, ["/workspace"]) });
  assert((await mobile.getByText("Enemy fog").count()) > 0, "mobile depth fogged");
  await mobile.close();

  const east = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  east.on("pageerror", (err) => errors.push(`east ${err?.message || err}`));
  await east.goto(`${base.replace(/\/$/, "")}/play?t=depth&s=east&d=recruit`, {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await east.waitForSelector("canvas", { timeout: 20000 });
  await east.waitForTimeout(800);
  await east.screenshot({ path: checkedOutputPath(`${outDir}/play-depth-east.png`, ["/workspace"]) });
  assert((await east.getByText("Enemy fog").count()) > 0, "east starts with Kyiv fogged");
  await east.close();

  await page.goto(`${base.replace(/\/$/, "")}/play?t=north&s=west&d=recruit`, {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.waitForSelector("canvas", { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: checkedOutputPath(`${outDir}/play-north.png`, ["/workspace"]) });
  assert((await page.getByText("Enemy fog").count()) > 0, "enemy yards start fogged");

  const recon = page.locator('img[src*="/game/sprites/drones/recon.png"]');
  assert((await recon.count()) > 0, "Leleka sprite in sortie dock");
  await recon.first().screenshot({ path: checkedOutputPath(`${outDir}/sprite-recon.png`, ["/workspace"]) });

  await page.getByRole("button", { name: /Fortify/ }).click();
  await page.waitForTimeout(400);
  const mog = page.locator('img[src*="/game/sprites/sites/mog.png"]');
  assert((await mog.count()) > 0, "МОГ sprite in fortify dock");
  assert((await page.getByText("МОГ", { exact: true }).count()) > 0, "МОГ label");
  assert((await page.getByText("Radar", { exact: true }).count()) > 0, "Radar in fortify");
  await mog.first().screenshot({ path: checkedOutputPath(`${outDir}/sprite-mog.png`, ["/workspace"]) });
  await page.screenshot({ path: checkedOutputPath(`${outDir}/play-fortify.png`, ["/workspace"]) });

  const box = await page.locator("canvas").boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width * 0.38, box.y + box.height * 0.45);
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: checkedOutputPath(`${outDir}/play-placed-mog.png`, ["/workspace"]) });

  await page.waitForTimeout(7000);
  await page.screenshot({ path: checkedOutputPath(`${outDir}/play-guns.png`, ["/workspace"]) });

  assert(errors.length === 0, `console errors: ${errors.join(" | ")}`);
} finally {
  await browser.close();
}

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("ok", { screenshots: outDir, errors });
