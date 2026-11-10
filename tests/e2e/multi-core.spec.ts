import { test, expect } from "@playwright/test";
import type { Page, Frame } from "@playwright/test";
async function boot(page: Page, model: string, title: string) {
  await page.goto(`/#/play/${model}`);
  await page.getByRole("button", { name: "选择卡带", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  const frame = page.frames().find((f) => f.url().includes("/emulator.html"))!;
  return frame;
}
async function pixels(frame: Frame, region?: number[]) {
  return frame.evaluate(async (r) => {
    const source =
      document.querySelector<HTMLCanvasElement>("canvas[data-nds-output]") ??
      document.querySelector<HTMLCanvasElement>("#game canvas")!;
    const c = document.createElement("canvas");
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(source, 0, 0);
    const data = ctx.getImageData(
      ...((r ?? [0, 0, c.width, c.height]) as [number, number, number, number]),
    ).data;
    const digest = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }, region);
}
async function screenshotHash(frame: Frame) {
  const bytes = [...(await frame.locator("#game canvas").screenshot())];
  return frame.evaluate(async (b) => {
    const img = await createImageBitmap(
      new Blob([new Uint8Array(b)], { type: "image/png" }),
    );
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    img.close();
    const d = await crypto.subtle.digest(
      "SHA-256",
      ctx.getImageData(0, 0, c.width, c.height).data,
    );
    return [...new Uint8Array(d)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }, bytes);
}
async function key(page: Page, name: string) {
  await page
    .getByRole("button", { name: `掌机 ${name}`, exact: true })
    .click({ delay: 130 });
  await page.waitForTimeout(200);
}
test("GB Snake runs on real mGBA, physical input and state restore survive reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const frame = await boot(page, "gb", "GB Snake");
  await key(page, "Start");
  expect(
    await frame.evaluate(() => {
      const gm = (window as any).EJS_emulator.gameManager;
      return [gm.getVideoDimensions("width"), gm.getVideoDimensions("height")];
    }),
  ).toEqual([160, 144]);
  await page.getByRole("button", { name: "即时存档", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("即时存档已保存");
  const before = await screenshotHash(frame);
  await key(page, "Start");
  await key(page, "Up");
  await page.waitForTimeout(200);
  expect(await screenshotHash(frame)).not.toBe(before);
  await page.getByRole("button", { name: "读取存档", exact: true }).click();
  await page.waitForTimeout(200);
  expect(await screenshotHash(frame)).toBe(before);
  await page.reload();
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  await expect(
    page.getByRole("button", { name: "读取存档", exact: true }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
});
test("DS uses one DeSmuME instance, two real LCD crops, touch scoring and state rewind", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const frame = await boot(page, "ds", "JamClown");
  expect(
    await frame.locator("#game canvas").evaluate((c) => [c.width, c.height]),
  ).toEqual([256, 384]);
  await expect(page.locator(".ds-game-screen")).toHaveCount(2);
  await key(page, "Start");
  await page.getByRole("button", { name: "即时存档", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("即时存档已保存");
  const before = await pixels(frame, [0, 160, 256, 24]);
  const screen = page.getByLabel("DS 游戏触摸屏", { exact: true });
  const b = (await screen.boundingBox())!;
  await page.mouse.move(b.x + b.width * 0.83, b.y + b.height * 0.5);
  await page.mouse.down();
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(250);
  expect(await pixels(frame, [0, 160, 256, 24])).not.toEqual(before);
  await page.getByRole("button", { name: "读取存档", exact: true }).click();
  await page.waitForTimeout(200);
  expect(await pixels(frame, [0, 160, 256, 24])).toEqual(before);
  const stats = await screen.evaluate((c) => {
    const d = (c as HTMLCanvasElement)
      .getContext("2d")!
      .getImageData(0, 0, 256, 192).data;
    return new Set(d).size;
  });
  expect(stats).toBeGreaterThan(8);
  expect(
    page.frames().filter((f) => f.url().includes("/emulator.html")),
  ).toHaveLength(1);
  await page.screenshot({
    path: "docs/screenshots/current/ds-game.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "合上上盖", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText("已暂停");
  await page.getByRole("button", { name: "打开上盖", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行");
  expect(errors).toEqual([]);
});
