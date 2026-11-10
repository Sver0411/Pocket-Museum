import { test, expect } from "@playwright/test";
import { selectDevice, openTools } from "./helpers";
const names = ["Game Boy", "GBA", "GBA SP", "DS", "3DS", "PSP", "PS Vita"];
test("museum entry and play layouts fit all six widths without stacked mobile rails", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("main", { name: "掌机博物馆" })).toBeVisible();
    await expect(page.locator(".museum-exhibit")).toHaveCount(7);
    await expect(page.locator(".exhibit-art.ready")).toHaveCount(7);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const name of names) {
      await selectDevice(page, name);
      await expect(page.locator(".console-space")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width <= 768) {
        await expect(page.locator(".control-rail")).toBeHidden();
        await expect(page.locator(".settings-rail")).toBeHidden();
        await openTools(page);
        await page.getByRole("button", { name: "关闭操作菜单" }).click();
      }
      await page.getByRole("button", { name: "返回博物馆" }).click();
    }
  }
  expect(errors).toEqual([]);
});
test("history navigation and direct device links preserve the museum flow", async ({
  page,
}) => {
  await page.goto("/");
  await selectDevice(page, "DS");
  await expect(page).toHaveURL(/#\/play\/ds$/);
  await page.goBack();
  await expect(page.locator(".museum-gallery")).toBeVisible();
  await page.goForward();
  await expect(page.locator(".console-space")).toHaveAttribute(
    "data-device",
    "ds",
  );
  await page.reload();
  await expect(page.locator(".console-space")).toHaveAttribute(
    "data-device",
    "ds",
  );
});
