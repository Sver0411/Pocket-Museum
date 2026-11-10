import { test, expect } from "@playwright/test";
import type { Page, Frame } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import {
  nativeSnapshot,
  nativeRecord,
  fingerprint,
  differences,
} from "./native-save-evidence";
async function boot(page: Page) {
  await page.goto("/#/play/sp");
  await expect(page.locator(".power-button")).toBeEnabled();
  await page.getByRole("button", { name: "选择卡带", exact: true }).click();
  await page.getByRole("button", { name: /2048 Advance/ }).click();
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  await page.waitForTimeout(1000);
  return page.frames().find((f) => f.url().includes("/emulator.html"))!;
}
async function key(page: Page, k: string) {
  await page.keyboard.down(k);
  await page.waitForTimeout(100);
  await page.keyboard.up(k);
  await page.waitForTimeout(240);
}
async function installInputProbe(frame: Frame) {
  await frame.evaluate(() => {
    const w = window as any;
    w.__inputs = [];
    const fn = w.EJS_emulator.gameManager.functions.simulateInput;
    w.EJS_emulator.gameManager.functions.simulateInput = (...args: any[]) => {
      w.__inputs.push(args);
      return fn(...args);
    };
  });
}
test("real mGBA boots entirely from local assets and responds to physical input", async ({
  page,
}) => {
  const external: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5173") &&
      !r.url().startsWith("blob:") &&
      !r.url().startsWith("data:")
    )
      external.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const frame = await boot(page);
  await expect(frame.locator("canvas")).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/desktop-running.png",
    fullPage: true,
  });
  const before = await frame.locator("canvas").screenshot();
  await key(page, "x");
  await page.waitForTimeout(500);
  const after = await frame.locator("canvas").screenshot();
  expect(after.equals(before)).toBe(false);
  await installInputProbe(frame);
  const mapping = [
    ["Up", 4],
    ["Down", 5],
    ["Left", 6],
    ["Right", 7],
    ["A", 8],
    ["B", 0],
    ["L", 10],
    ["R", 11],
    ["Start", 3],
    ["Select", 2],
  ] as const;
  for (const [name, index] of mapping) {
    const button = page.getByRole("button", {
      name: `掌机 ${name}`,
      exact: true,
    });
    await button.click({ delay: 100 });
    await expect
      .poll(() => frame.evaluate(() => (window as any).__inputs))
      .toContainEqual([0, index, 1]);
    await expect
      .poll(() => frame.evaluate(() => (window as any).__inputs))
      .toContainEqual([0, index, 0]);
  }
  await page.keyboard.down("q");
  await page.keyboard.down("e");
  await page.keyboard.down("Shift");
  await expect(page.locator('[data-button="L"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator('[data-button="R"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.keyboard.up("q");
  await page.keyboard.up("e");
  await page.keyboard.up("Shift");
  await page.keyboard.down("x");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.locator('[data-button="A"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.keyboard.up("x");
  await page.getByRole("button", { name: "合上上盖", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行");
  await page.getByRole("button", { name: "打开上盖", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行");
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test("savestate and native SRAM survive power cycles and page reloads", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "EJS_emulator", {
      configurable: true,
      set(engine) {
        Object.defineProperty(window, "EJS_emulator", {
          value: engine,
          writable: true,
          configurable: true,
        });
        engine.on("start", () => {
          const gm = engine.gameManager;
          const path = gm.getSaveFilePath();
          const disk = gm.FS.analyzePath(path).exists
            ? Array.from(gm.FS.readFile(path))
            : [];
          // Deliberately exercise the API at frame zero, before detection finishes.
          const early = Array.from(gm.getSaveFile() || []);
          (window as any).__bootSave = {
            frame: gm.functions.getFrameNum(),
            disk,
            early,
          };
        });
      },
    });
  });
  const frame = await boot(page);
  await key(page, "x");
  for (const direction of ["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"])
    await key(page, direction);
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "即时存档", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "读取存档", exact: true }),
  ).toBeEnabled();
  const state = await frame.evaluate(() =>
    Array.from((window as any).EJS_emulator.gameManager.getState()),
  );
  expect(state.length).toBeGreaterThan(1000);
  await key(page, "Enter");
  await page.waitForTimeout(500);
  const before = await nativeSnapshot(frame);
  const native = before.exported;
  expect(before.memory).toEqual(native);
  expect(before.filesystem).toEqual(native);
  expect(native.length).toBeGreaterThan(0);
  expect(native.some((x) => x !== 0 && x !== 255)).toBe(true);
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("电源关闭");
  const stored = await nativeRecord(page);
  expect(stored.data).toEqual(native);
  expect(stored.core).toBe("mgba");
  expect(stored.version).toBe("4.2.3");
  await page.reload();
  expect((await nativeRecord(page)).data).toEqual(native);
  await expect(
    page.getByRole("button", { name: "读取存档", exact: true }),
  ).toBeDisabled();
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  const next = page.frames().find((f) => f.url().includes("/emulator.html"))!;
  const bootSave = await next.evaluate(
    () =>
      (window as any).__bootSave as {
        frame: number;
        disk: number[];
        early: number[];
      },
  );
  expect(bootSave.disk).toEqual(native);
  const after = await nativeSnapshot(next);
  const restored = after.exported;
  const evidence = JSON.stringify(
    {
      gameId: stored.gameId,
      core: stored.core,
      version: stored.version,
      before: {
        frame: before.frame,
        path: before.path,
        memory: fingerprint(before.memory),
        filesystem: fingerprint(before.filesystem),
        exported: fingerprint(native),
      },
      indexedDB: fingerprint(stored.data),
      startup: {
        frame: bootSave.frame,
        preloaded: fingerprint(bootSave.disk),
        provisionalExport: fingerprint(bootSave.early),
        provisionalDifferences: differences(native, bootSave.early),
      },
      after: {
        frame: after.frame,
        path: after.path,
        memory: fingerprint(after.memory),
        filesystem: fingerprint(after.filesystem),
        exported: fingerprint(restored),
      },
      differences: {
        memory: differences(native, after.memory),
        filesystem: differences(native, after.filesystem),
        indexedDB: differences(native, stored.data),
        exported: differences(native, restored),
      },
    },
    null,
    2,
  );
  const evidencePath = test.info().outputPath("native-save-evidence.json");
  await writeFile(evidencePath, evidence);
  await test
    .info()
    .attach("native-save-evidence.json", {
      contentType: "application/json",
      path: evidencePath,
    });
  expect(after.memory).toEqual(native);
  expect(after.filesystem).toEqual(native);
  expect(restored).toEqual(native);
  await page.getByRole("button", { name: "读取存档", exact: true }).click();
  await expect(page.getByText("即时存档已读取", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "暂停游戏", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText("已暂停");
  await page.screenshot({
    path: "docs/screenshots/desktop-saved.png",
    fullPage: true,
  });
});
test("ROM import stays local, persists, and invalid files show actionable errors", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/#/play/sp");
  await expect(page.locator(".power-button")).toBeEnabled();
  await page.getByRole("button", { name: "选择卡带" }).click();
  await page.getByLabel("导入 GBA 游戏", { exact: true }).setInputFiles({
    name: "broken.gba",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(256),
  });
  await expect(page.getByRole("alert")).toContainText("无效的 GBA 文件头");
  const buffer = await readFile("public/roms/2048.gba");
  buffer[0xac] = 0x41;
  await page.getByLabel("导入 GBA 游戏", { exact: true }).setInputFiles({
    name: "My Homebrew.gba",
    mimeType: "application/octet-stream",
    buffer,
  });
  await expect(
    page.getByRole("heading", { name: "My Homebrew" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "关闭卡带库" }).click();
  await page.reload();
  await page.getByRole("button", { name: "选择卡带" }).click();
  await expect(
    page.getByRole("heading", { name: "My Homebrew" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "关闭卡带库" }).click();
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  expect(posts).toEqual([]);
});
test("mobile layout fits and multi-touch, cancellation, gamepad polling reach the core", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = await boot(page);
  await installInputProbe(frame);
  await key(page, "x");
  const a = await page.locator('[data-button="A"]').boundingBox(),
    up = await page.locator('[data-button="Up"]').boundingBox();
  if (!a || !up) throw new Error("Missing touch controls");
  await page.locator('[data-button="A"]').scrollIntoViewIfNeeded();
  const aa = await page.locator('[data-button="A"]').boundingBox(),
    uu = await page.locator('[data-button="Up"]').boundingBox();
  if (!aa || !uu) throw new Error("Missing touch controls");
  const cdp = await page.context().newCDPSession(page);
  const one = { x: aa.x + aa.width / 2, y: aa.y + aa.height / 2, id: 1 },
    two = { x: uu.x + uu.width / 2, y: uu.y + uu.height / 2, id: 2 };
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [one],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [one, two],
  });
  await expect(page.locator('[data-button="A"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator('[data-button="Up"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await expect(page.locator('[data-button="A"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.locator('[data-button="Up"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [
        {
          index: 0,
          connected: true,
          mapping: "standard",
          axes: [0.8, 0],
          buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 0 })),
        },
      ],
    }),
  );
  await expect(page.locator(".gamepad-status.connected")).toHaveCount(1);
  await expect
    .poll(() => frame.evaluate(() => (window as any).__inputs))
    .toContainEqual([0, 8, 1]);
  await expect
    .poll(() => frame.evaluate(() => (window as any).__inputs))
    .toContainEqual([0, 7, 1]);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [],
    }),
  );
  await expect(page.locator(".gamepad-status.connected")).toHaveCount(0);
  await expect(page.locator('[data-button="A"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
  });
});

test("cream studio UI keeps an empty screen, unified controls and no Nintendo logo", async ({
  page,
}) => {
  await page.goto("/#/play/sp");
  await expect(page.locator(".power-button")).toBeEnabled();
  await expect(page.locator(".screen-idle")).toBeVisible();
  await expect(page.locator(".screen-idle")).toHaveText("");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByText("Nintendo", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: "docs/screenshots/desktop-studio.png",
    fullPage: true,
  });
  const body = await page.locator(".base-face").boundingBox(),
    dock = await page.locator(".studio-dock").boundingBox();
  expect(body!.y + body!.height).toBeLessThan(dock!.y);
  await page.getByRole("button", { name: "合上上盖", exact: true }).click();
  await page.waitForTimeout(850);
  await page.screenshot({
    path: "docs/screenshots/desktop-closed.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "打开上盖", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/mobile-studio.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
