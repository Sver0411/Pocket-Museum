import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
export async function selectDevice(page: Page, name: string) {
  if (await page.locator(".museum-gallery").isVisible()) {
    await page
      .getByRole("button", { name: `体验 ${name}`, exact: true })
      .click();
    return;
  }
  const nav = page.getByRole("navigation", { name: "切换掌机" });
  if (!(await nav.isVisible()))
    await page.getByRole("button", { name: "切换掌机", exact: true }).click();
  await nav.getByRole("button", { name, exact: true }).click();
}
export async function openTools(page: Page) {
  if (!(await page.locator(".settings-rail").isVisible()))
    await page.getByRole("button", { name: "操作与设置", exact: true }).click();
  await expect(page.locator(".settings-rail")).toBeVisible();
}
