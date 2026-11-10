import { test, expect } from "@playwright/test";
import { openTools } from "./helpers";
const models = [
  ["gb", "pixel-frame", ".gb-keyboard-frame", 4],
  ["gba", "wide-glass", ".gba-glass-toolbar", 5],
  ["sp", "silver-gallery", ".sp-silver-plinth", 5],
  ["ds", "dual-screen", ".ds-dual-guides", 6],
  ["3ds", "home-tiles", ".three-tools-tiles", 6],
  ["psp", "xmb-axis", ".psp-xmb-tools", 6],
  ["vita", "livearea-bubbles", ".vita-livearea-tools", 6],
] as const;
test("seven independent compositions retain a visible power control and model-specific keyboard mappings", async ({
  page,
}) => {
  const layouts = new Set();
  for (const [id, layout, structure, keyRows] of models) {
    await page.goto(`/#/play/${id}`);
    await expect(page.locator(".studio-main")).toHaveAttribute(
      "data-layout",
      layout,
    );
    layouts.add(await page.locator(".studio-main").getAttribute("data-layout"));
    await expect(page.locator(structure)).toHaveCount(1);
    await expect(page.locator(".control-legend > div")).toHaveCount(keyRows);
    await expect(page.locator(".power-button")).toHaveCount(1);
    await expect(page.locator(".power-button")).toBeVisible();
    await expect(page.locator(".photo-power")).toHaveCount(1);
    await expect(page.locator(".studio-dock .power-button")).toHaveCount(1);
    await expect(
      page
        .locator(".settings-rail .setting-row")
        .filter({ hasText: "即时存档" }),
    ).toHaveCount(0);
    await page.locator(".power-button").click();
    await expect(page.getByTestId("emulator-status")).toHaveText("系统运行");
    await page.locator(".power-button").click();
    await expect(page.getByTestId("emulator-status")).toHaveText("电源关闭");
  }
  expect(layouts.size).toBe(7);
});
test("museum previews decode for every model and compact controls fit at 320px", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".exhibit-art.ready")).toHaveCount(7);
  await expect(page.locator(".exhibit-screen-preview")).toHaveCount(9);
  for (const [id] of models) {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(`/#/play/${id}`);
    await expect(page.locator(".control-rail")).toBeHidden();
    await expect(page.locator(".settings-rail")).toBeHidden();
    await expect(page.locator(".console-space")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await openTools(page);
    const rect = await page.locator(".settings-rail").boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(320);
    await page.getByRole("button", { name: "关闭操作菜单" }).click();
  }
});
test("the body power switch remains usable after closing a clamshell", async ({
  page,
}) => {
  for (const id of ["sp", "ds", "3ds"]) {
    await page.goto(`/#/play/${id}`);
    await page.locator(".photo-power").click();
    await page.getByRole("button", { name: "合上上盖", exact: true }).click();
    await expect(page.locator(".console-space")).toHaveAttribute(
      "data-posture",
      "closed",
    );
    await page.waitForTimeout(850);
    await page.locator(".photo-power").click();
    await expect(page.getByTestId("emulator-status")).toHaveText("电源关闭");
    await page.getByRole("button", { name: "打开上盖", exact: true }).click();
    await page.getByRole("button", { name: "完全展开", exact: true }).click();
    await expect(page.locator(".console-space")).toHaveAttribute(
      "data-posture",
      "flat",
    );
    await page.locator(".photo-power").click();
    await expect(page.getByTestId("emulator-status")).toHaveText("系统运行");
    await page.locator(".photo-power").click();
    await expect(page.getByTestId("emulator-status")).toHaveText("电源关闭");
  }
});

test("power and cartridge actions stay in flow, uncovered, across seven models and six widths", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [id] of models) {
      await page.goto(`/#/play/${id}`);
      const dock = page.locator(".studio-dock");
      await dock.scrollIntoViewIfNeeded();
      const box = await dock.boundingBox();
      const body = await page.locator(".console-space").boundingBox();
      expect(box!.y).toBeGreaterThanOrEqual(body!.y + body!.height);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const selector of [
        ".dock-power",
        ...(["gb", "gba", "sp", "ds"].includes(id) ? [".dock-cartridge"] : []),
      ]) {
        const action = page.locator(selector);
        await expect(action).toBeVisible();
        expect(
          await action.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return [0.2, 0.5, 0.8].every((y) =>
              [0.2, 0.5, 0.8].every((x) => {
                const hit = document.elementFromPoint(
                  r.x + r.width * x,
                  r.y + r.height * y,
                );
                return hit === el || (!!hit && el.contains(hit));
              }),
            );
          }),
        ).toBe(true);
      }
      if (width > 820)
        await expect(page.locator(".mobile-tools-button")).toBeHidden();
      else
        await expect(page.locator(".mobile-tools-button")).toHaveText("设置");
    }
  }
  await page.goto("/#/play/gb");
  await page.locator(".dock-cartridge").click();
  await expect(page.getByRole("button", { name: "关闭卡带库" })).toBeVisible();
});

test("all machines fit one viewport without scrolling, including flat play", async ({
  page,
}) => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".exhibit-art.ready")).toHaveCount(7);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollHeight <= innerHeight &&
          document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const exhibit of await page.locator(".museum-exhibit").all()) {
      const r = await exhibit.boundingBox();
      expect(r!.y + r!.height).toBeLessThanOrEqual(height);
    }
    for (const [id] of models) {
      await page.goto(`/#/play/${id}`);
      const fits = async () => {
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollHeight <= innerHeight &&
              document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const consoleBox = await page.locator(".console-space").boundingBox();
        const dockBox = await page.locator(".studio-dock").boundingBox();
        expect(consoleBox!.y).toBeGreaterThanOrEqual(0);
        expect(consoleBox!.y + consoleBox!.height).toBeLessThanOrEqual(
          dockBox!.y,
        );
        expect(dockBox!.y + dockBox!.height).toBeLessThanOrEqual(height);
      };
      await fits();
      if (["sp", "ds", "3ds"].includes(id) && width > 820 && height > 600) {
        await page
          .getByRole("button", { name: "完全展开", exact: true })
          .click();
        await fits();
      }
    }
  }
});
test("GBA keeps the same shell size and position when a real game starts and pauses", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/play/gba");
  await expect(page.locator(".power-button")).toBeEnabled();
  await page.getByRole("button", { name: "选择卡带", exact: true }).click();
  await page.getByRole("button", { name: /2048 Advance/ }).click();
  const before = await page.locator(".console-space").boundingBox();
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  const compare = async () => {
    const after = await page.locator(".console-space").boundingBox();
    for (const key of ["x", "y", "width", "height"] as const)
      expect(Math.abs(after![key] - before![key])).toBeLessThan(1);
  };
  await compare();
  await page.getByRole("button", { name: "暂停游戏", exact: true }).click();
  await compare();
});
