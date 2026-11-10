import { test, expect } from "@playwright/test";
import { openTools } from "./helpers";
import { mkdir } from "node:fs/promises";
const out = "docs/screenshots/stage9/after";
test.beforeAll(async () => {
  await mkdir(out, { recursive: true });
});
for (const mobile of [false, true])
  test(`seven handheld user journeys, ${mobile ? "mobile" : "desktop"}`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    );
    for (const [id, label] of [
      ["gb", "Game Boy"],
      ["gba", "GBA"],
      ["sp", "GBA SP"],
      ["ds", "DS"],
      ["3ds", "3DS"],
      ["psp", "PSP"],
      ["vita", "PS Vita"],
    ]) {
      await page.goto("/");
      await page
        .getByRole("button", { name: `体验 ${label}`, exact: true })
        .click();
      await expect(page.locator(".power-button")).toBeEnabled();
      await page.locator(".power-button").click();
      await expect(page.getByTestId("emulator-status")).toHaveText("系统运行");
      if (id === "ds")
        await page
          .getByRole("button", { name: "Touch Screen to continue" })
          .click();
      if (id === "vita")
        await page.getByRole("button", { name: "Unlock PS Vita" }).click();
      if (!["gb", "gba", "sp"].includes(id))
        await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
          "data-system-phase",
          "home",
        );
      await page
        .getByRole("button", { name: "掌机 Right", exact: true })
        .click({ delay: 70 });
      await expect(
        page.locator('.hardware-key[data-button="Right"]'),
      ).toHaveAttribute("aria-pressed", "false");
      if (id === "ds") {
        await page
          .getByRole("button", { name: "DS Settings", exact: true })
          .click();
        await expect(page.locator(".ds-settings-summary")).toBeVisible();
        await page.getByRole("button", { name: "Clock", exact: true }).click();
        await expect(
          page.getByRole("button", { name: /Alarm Time/ }),
        ).toBeVisible();
        await page.getByRole("button", { name: "掌机 B", exact: true }).click();
      }
      if (id === "3ds") {
        await expect(page.locator(".three-tile.selected")).toHaveAttribute(
          "data-app-id",
          "camera",
        );
      }
      if (id === "psp")
        await expect(
          page.locator(".xmb-categories button.selected"),
        ).toContainText("Photo");
      if (id === "vita") {
        await page
          .getByRole("button", { name: "Home page 2", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Settings", exact: true })
          .click();
        await page.getByRole("button", { name: "Start", exact: true }).click();
        await page
          .getByRole("button", { name: "掌机 Home", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "Continue", exact: true }),
        ).toBeVisible();
      }
      await page.screenshot({
        path: `${out}/${id}-${mobile ? "mobile" : "desktop"}.png`,
      });
      if (["gb", "sp"].includes(id)) {
        await page
          .getByRole("button", { name: "专注游玩", exact: true })
          .click();
        await expect(page.locator(".focus-console")).toBeVisible();
        await page.screenshot({
          path: `${out}/${id}-focus-${mobile ? "mobile" : "desktop"}.png`,
        });
        await page
          .getByRole("button", { name: "退出专注模式", exact: true })
          .click();
      } else
        await expect(
          page.getByRole("button", { name: "专注游玩", exact: true }),
        ).toHaveCount(0);
      await openTools(page);
      await page.getByRole("button", { name: "暂停游戏", exact: true }).click();
      await expect(page.getByTestId("emulator-status")).toHaveText("已暂停");
      await page.getByRole("button", { name: "继续游戏", exact: true }).click();
      if (mobile)
        await page
          .getByRole("button", { name: "关闭操作菜单", exact: true })
          .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight + 1,
        ),
      ).toBe(true);
      await page.locator(".power-button").click();
      await expect(page.getByTestId("emulator-status")).toHaveText("电源关闭");
      await page
        .getByRole("button", { name: "返回博物馆", exact: true })
        .click();
      await expect(page.locator(".museum-exhibit")).toHaveCount(7);
    }
    expect(errors).toEqual([]);
  });
test("catalogue is immediate, quick play retains the same real core through focus and releases held input", async ({
  page,
}) => {
  const roms: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/roms/")) roms.push(r.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/play/sp");
  await expect(page.locator(".power-button")).toBeEnabled();
  expect(roms).toEqual([]);
  await page.getByRole("button", { name: "选择卡带", exact: true }).click();
  await page
    .locator(".game-card-row")
    .filter({ hasText: "2048 Advance" })
    .getByRole("button", { name: "立即游玩", exact: true })
    .click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  const f = page.frames().find((f) => f.url().includes("/emulator.html"))!;
  await f.evaluate(() => {
    const w = window as any;
    w.__identity = crypto.randomUUID();
    w.__inputs = [];
    const gm = w.EJS_emulator.gameManager,
      fn = gm.functions.simulateInput;
    gm.functions.simulateInput = (...args: any[]) => {
      w.__inputs.push(args);
      return fn(...args);
    };
  });
  const token = await f.evaluate(() => (window as any).__identity);
  await page.getByRole("button", { name: "专注游玩", exact: true }).click();
  expect(await f.evaluate(() => (window as any).__identity)).toBe(token);
  const a = page.locator('.focus-controls [data-button="A"]');
  await a.click({ delay: 100 });
  await page.keyboard.down("ArrowLeft");
  await page.keyboard.down("x");
  await expect(a).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "快捷暂停", exact: true }).click();
  await expect(a).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.up("x");
  await expect
    .poll(() => f.evaluate(() => (window as any).__inputs))
    .toContainEqual([0, 8, 0]);
  await page.getByRole("button", { name: "快捷继续", exact: true }).click();
  await openTools(page);
  await page.getByRole("button", { name: "即时存档", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "读取存档", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "读取存档", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "即时存档已读取" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "关闭操作菜单", exact: true }).click();
  await expect(page.locator(".toast")).toHaveCount(0);
  await page.screenshot({ path: `${out}/sp-focus-game-mobile.png` });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({ path: `${out}/sp-focus-game-landscape.png` });
  await page.getByRole("button", { name: "退出专注模式", exact: true }).click();
  expect(await f.evaluate(() => (window as any).__identity)).toBe(token);
  expect(roms.length).toBe(1);
  await page.getByRole("button", { name: "选择卡带", exact: true }).click();
  await page
    .locator(".game-card-row")
    .filter({ hasText: "2048 Advance" })
    .getByRole("button", { name: "立即游玩", exact: true })
    .click();
  expect(await f.evaluate(() => (window as any).__identity)).toBe(token);
  await page.getByRole("button", { name: "返回博物馆", exact: true }).click();
  await expect(page.locator(".museum-exhibit")).toHaveCount(7);
  expect(page.frames().some((f) => f.url().includes("/emulator.html"))).toBe(
    false,
  );
});
test("Tobu Tobu Girl Deluxe boots locally on the GB core and supports savestates", async ({
  page,
}) => {
  await page.goto("/#/play/gb");
  await page.getByRole("button", { name: "选择卡带", exact: true }).click();
  await page
    .locator(".game-card-row")
    .filter({ hasText: "Tobu Tobu Girl Deluxe" })
    .getByRole("button", { name: "立即游玩", exact: true })
    .click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  const f = page.frames().find((f) => f.url().includes("/emulator.html"))!;
  expect(
    await f.evaluate(() => (window as any).EJS_defaultOptions.mgba_gb_model),
  ).toBe("Game Boy");
  // The author's intro is unskippable; wait until its title screen before playing.
  await page.waitForTimeout(11000);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Enter", { delay: 150 });
    await page.waitForTimeout(1800);
  }
  await page.keyboard.press("x", { delay: 150 });
  await page.keyboard.press("ArrowRight", { delay: 500 });
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "即时存档", exact: true }).click();
  await page.getByRole("button", { name: "读取存档", exact: true }).click();
  await expect(page.locator(".toast")).toHaveCount(0);
  await page.screenshot({ path: `${out}/gb-tobudx-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "专注游玩", exact: true }).click();
  await page.screenshot({ path: `${out}/gb-tobudx-focus-mobile.png` });
});

test("a local ROM and imported native save keep their exact identity across cold boot", async ({
  page,
}) => {
  const { nativeSnapshot, nativeRecord } = await import(
    "./native-save-evidence"
  );
  await page.goto("/#/play/sp");
  await page.getByRole("button", { name: "选择卡带", exact: true }).click();
  await page
    .getByLabel("导入 GBA 游戏", { exact: true })
    .setInputFiles("public/roms/2048.gba");
  await expect(page.locator(".toast")).toContainText("已导入");
  await page.locator(".modal-close").click();
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  const f = page.frames().find((f) => f.url().includes("/emulator.html"))!;
  await page.keyboard.press("x", { delay: 100 });
  await page.keyboard.press("ArrowLeft", { delay: 100 });
  await page.keyboard.press("Enter", { delay: 100 });
  await page.waitForTimeout(500);
  const before = await nativeSnapshot(f);
  expect(before.exported.length).toBeGreaterThan(0);
  await page.locator(".power-button").click();
  await page.getByRole("button", { name: "选择卡带", exact: true }).click();
  await page.getByLabel("导入原生存档", { exact: true }).setInputFiles({
    name: "progress.sav",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(before.exported),
  });
  await expect(page.locator(".toast")).toContainText("原生存档已导入");
  expect((await nativeRecord(page)).data).toEqual(before.exported);
  await page.locator(".modal-close").click();
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  const next = page.frames().find((f) => f.url().includes("/emulator.html"))!;
  expect((await nativeSnapshot(next)).exported).toEqual(before.exported);
});

test("phone touch can hold two focus buttons and release both on cancel", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5173/#/play/sp");
    await page.getByRole("button", { name: "选择卡带", exact: true }).tap();
    await page
      .locator(".game-card-row")
      .filter({ hasText: "2048 Advance" })
      .getByRole("button", { name: "立即游玩", exact: true })
      .tap();
    await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
      timeout: 65000,
    });
    await page.getByRole("button", { name: "专注游玩", exact: true }).tap();
    const f = page.frames().find((f) => f.url().includes("/emulator.html"))!;
    await f.evaluate(() => {
      const w = window as any,
        gm = w.EJS_emulator.gameManager,
        fn = gm.functions.simulateInput;
      w.__inputs = [];
      gm.functions.simulateInput = (...a: any[]) => {
        w.__inputs.push(a);
        return fn(...a);
      };
    });
    const a = page.locator('.focus-controls [data-button="A"]'),
      up = page.locator('.focus-controls [data-button="Up"]');
    const ar = (await a.boundingBox())!,
      ur = (await up.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: ar.x + ar.width / 2, y: ar.y + ar.height / 2, id: 1 },
        { x: ur.x + ur.width / 2, y: ur.y + ur.height / 2, id: 2 },
      ],
    });
    await expect(a).toHaveAttribute("aria-pressed", "true");
    await expect(up).toHaveAttribute("aria-pressed", "true");
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    await expect(a).toHaveAttribute("aria-pressed", "false");
    await expect(up).toHaveAttribute("aria-pressed", "false");
    for (const code of [8, 4])
      for (const value of [1, 0])
        await expect
          .poll(() => f.evaluate(() => (window as any).__inputs))
          .toContainEqual([0, code, value]);
  } finally {
    await context.close();
  }
});

test("3DS scrolling a selected app does not accidentally launch it", async ({
  page,
}) => {
  await page.goto("/#/play/3ds");
  await page.locator(".power-button").click();
  await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
    "data-system-phase",
    "home",
  );
  const camera = page.getByRole("button", { name: "3DS Camera", exact: true });
  await camera.click();
  await expect(camera).toHaveClass(/selected/);
  const r = (await camera.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width / 2 - 35, r.y + r.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
    "data-system-phase",
    "home",
  );
  await expect(camera).toHaveClass(/selected/);
});
