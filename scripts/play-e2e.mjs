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
