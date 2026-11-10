import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const root = "docs/screenshots/stage9/after";
await mkdir(root, { recursive: true });
const browser = await chromium.launch();
const records = [];
try {
  const page = await browser.newPage();
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    for (const id of ["gb", "sp"]) {
      await page.goto(`http://127.0.0.1:5173/#/play/${id}`);
      await expect(page.locator(".power-button")).toBeEnabled();
      await page.locator(".power-button").click();
      const before = await page
        .locator(".lcd")
        .evaluate((e) => ({
          w: e.getBoundingClientRect().width,
          h: e.getBoundingClientRect().height,
        }));
      await page.getByRole("button", { name: "专注游玩", exact: true }).click();
      const after = await page
        .locator(".lcd")
        .evaluate((e) => ({
          w: e.getBoundingClientRect().width,
          h: e.getBoundingClientRect().height,
        }));
      expect(after.w).toBeGreaterThan(before.w);
      expect(
        Math.abs(after.w / after.h - (id === "gb" ? 160 / 144 : 1.5)),
      ).toBeLessThan(0.02);
      for (const name of [
        "A",
        "B",
        "Start",
        "Select",
        "Up",
        "Down",
        "Left",
        "Right",
      ]) {
        const rect = await page
          .locator(`.focus-controls [data-button="${name}"]`)
          .boundingBox();
        expect(rect).toBeTruthy();
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight + 1,
        ),
      ).toBe(true);
      const path = `${root}/${id}-focus-${viewport.width}x${viewport.height}.png`;
      await page.screenshot({ path });
      records.push({
        device: id,
        viewport,
        before,
        after,
        screenWidthGain: after.w / before.w,
        path,
      });
    }
  }
  await writeFile(
    "docs/screenshots/stage9/focus-measurements.json",
    JSON.stringify(records, null, 2) + "\n",
  );
  console.log(
    "8 focus layouts captured with native aspect ratios, visible controls and no document scroll.",
  );
} finally {
  await browser.close();
}
