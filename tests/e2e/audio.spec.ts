import { test, expect } from "@playwright/test";
import { selectDevice } from "./helpers";
import type { Page } from "@playwright/test";
async function observe(page: Page) {
  await page.addInitScript(() => {
    const evidence = { started: 0, loops: 0, samples: 0, rate: 0, state: "" };
    (window as any).__audioEvidence = evidence;
    const start = AudioBufferSourceNode.prototype.start,
      stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.start = function (
      ...args: Parameters<typeof start>
    ) {
      const result = start.apply(this, args);
      evidence.started++;
      evidence.samples = this.buffer?.length ?? 0;
      evidence.rate = this.playbackRate.value;
      evidence.state = this.context.state;
      if (this.loop) evidence.loops++;
      return result;
    };
    AudioBufferSourceNode.prototype.stop = function (
      ...args: Parameters<typeof stop>
    ) {
      const result = stop.apply(this, args);
      if (this.loop) evidence.loops--;
      return result;
    };
  });
}
const snapshot = (p: Page) => p.evaluate(() => (window as any).__audioEvidence);
test("audio unlock, decoded CC0 playback, Key Tone and independent device volumes survive reload", async ({
  page,
}) => {
  await observe(page);
  await page.goto("/#/play/psp");
  await page.locator(".power-button").click();
  await expect(page.locator(".psp-xmb")).toBeVisible();
  expect((await snapshot(page)).started).toBe(0);
  await page.getByRole("button", { name: "开启声音", exact: true }).click();
  await page.getByRole("button", { name: "掌机 Right", exact: true }).click();
  await expect
    .poll(async () => (await snapshot(page)).started)
    .toBeGreaterThan(0);
  expect((await snapshot(page)).samples).toBeGreaterThan(0);
  expect((await snapshot(page)).state).toBe("running");
  await page.getByRole("button", { name: "掌机 Left", exact: true }).click();
  await page
    .getByRole("button", { name: "Sound Settings", exact: true })
    .click();
  await page.getByRole("button", { name: /Key Tone/ }).click();
  await page.getByRole("button", { name: "○ Off", exact: true }).click();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await page.waitForTimeout(300);
  const count = (await snapshot(page)).started;
  await page.getByRole("button", { name: "掌机 Down", exact: true }).click();
  await page.waitForTimeout(180);
  expect((await snapshot(page)).started).toBe(count);
  await selectDevice(page, "DS");
  await expect(page.getByRole("slider", { name: "游戏音量" })).toHaveValue("0");
  await selectDevice(page, "PSP");
  await expect(page.getByRole("slider", { name: "游戏音量" })).toHaveValue(
    "60",
  );
  await page.reload();
  await expect(page.getByRole("slider", { name: "游戏音量" })).toHaveValue(
    "60",
  );
  await page.locator(".power-button").click();
  await expect(page.locator(".psp-xmb")).toBeVisible();
  await page.waitForTimeout(300);
  const reloadedCount = (await snapshot(page)).started;
  await page.getByRole("button", { name: "掌机 Right", exact: true }).click();
  await page.waitForTimeout(180);
  expect((await snapshot(page)).started).toBe(reloadedCount);
});

test("Vita System Music controls a decoded CC0 loop independently of Key Tone", async ({
  page,
}) => {
  await observe(page);
  await page.goto("/#/play/vita");
  await page.locator(".power-button").click();
  await page.getByRole("button", { name: "Unlock PS Vita" }).click();
  await page.getByRole("button", { name: "开启声音", exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).loops).toBe(1);
  await page.getByRole("button", { name: "Home page 2", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("button", { name: "Sound & Display", exact: true })
    .click();
  await page.getByRole("button", { name: /System Music/ }).click();
  await page.getByRole("button", { name: "○ Off", exact: true }).click();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await page.getByRole("button", { name: "掌机 Home", exact: true }).click();
  await page.waitForTimeout(200);
  expect((await snapshot(page)).loops).toBe(0);
});
