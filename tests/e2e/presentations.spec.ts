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
test("seven independent compositions retain one physical power control and model-specific keyboard mappings", async ({
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
    await expect(page.locator(".power-button")).toHaveClass(/photo-power/);
    await expect(page.locator(".studio-dock .power-button")).toHaveCount(0);
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
    await page.locator(".power-button").click();
    await page.getByRole("button", { name: "合上上盖", exact: true }).click();
    await expect(page.locator(".console-space")).toHaveAttribute(
      "data-posture",
      "closed",
    );
    await page.waitForTimeout(850);
    await page.locator(".power-button").click();
    await expect(page.getByTestId("emulator-status")).toHaveText("电源关闭");
    await page.getByRole("button", { name: "打开上盖", exact: true }).click();
    await page.getByRole("button", { name: "完全展开", exact: true }).click();
    await expect(page.locator(".console-space")).toHaveAttribute(
      "data-posture",
      "flat",
    );
    await page.locator(".power-button").click();
    await expect(page.getByTestId("emulator-status")).toHaveText("系统运行");
    await page.locator(".power-button").click();
    await expect(page.getByTestId("emulator-status")).toHaveText("电源关闭");
  }
});
