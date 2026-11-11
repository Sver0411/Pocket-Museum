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

test("host dialogs restore keyboard focus and Escape also closes mobile settings", async ({ page }) => {
  await page.goto("/#/play/psp");
  const more = page.locator(".more-controls summary");
  await more.click();
  await page.getByRole("button", { name: "连接模拟器", exact: true }).click();
  const connection = page.getByRole("dialog", { name: "连接模拟器" });
  await expect(connection.getByRole("button", { name: "关闭连接面板" })).toBeFocused();
  await connection.getByRole("textbox", { name: "模拟器地址" }).focus();
  await page.keyboard.press("Escape");
  await expect(connection).toHaveCount(0);
  await expect(more).toBeFocused();

  const guide = page.getByRole("button", { name: "使用指南", exact: true });
  await guide.click();
  const help = page.getByRole("dialog", { name: "Pocket Museum 使用指南" });
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    expect(await help.evaluate((dialog) =>
      document.activeElement === document.body || dialog.contains(document.activeElement),
    )).toBe(true);
  }
  await help.getByRole("button", { name: "关闭使用指南" }).focus();
  await page.keyboard.press("Escape");
  await expect(help).toHaveCount(0);
  await expect(guide).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await openTools(page);
  await page.keyboard.press("Escape");
  await expect(page.locator(".settings-rail")).toBeHidden();
});

test("3DS slider feedback stays compact throughout its entrance animation", async ({ page }) => {
  await page.goto("/#/play/3ds");
  const slider = page.getByRole("slider", { name: "3D 深度" });
  const height = await slider.evaluate((el: HTMLInputElement) => new Promise<number>((resolve) => {
    const update = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    const start = performance.now();
    let maxHeight = 0;
    const measure = () => {
      const toast = document.querySelector(".toast");
      maxHeight = Math.max(maxHeight, toast?.getBoundingClientRect().height ?? 0);
      if (performance.now() - start < 350) requestAnimationFrame(measure);
      else resolve(maxHeight);
    };
    update.call(el, "65");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    requestAnimationFrame(measure);
  }));
  expect(height).toBeGreaterThan(0);
  expect(height).toBeLessThan(90);
});
