import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { selectDevice } from "./helpers";
const devices = [
  ["gb", "Game Boy"],
  ["gba", "GBA"],
  ["sp", "GBA SP"],
  ["ds", "DS"],
  ["3ds", "3DS"],
  ["psp", "PSP"],
  ["vita", "PS Vita"],
] as const;
// Do not repeatedly serialize large embedded bitmaps/fonts/audio into DOM traces.
test.use({ trace: "off" });
test("single-device HTML files and the combined HTML open offline with no external resources", async ({
  page,
  context,
}) => {
  const unexpected: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("file:") && !r.url().startsWith("data:"))
      unexpected.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await context.setOffline(true);
  for (const [id] of devices) {
    await page.goto(
      pathToFileURL(resolve(`public/standalone/${id}.html`)).href,
    );
    await expect(page).toHaveTitle(/Pocket Museum 单文件版/);
    await expect(page.locator(".console-space")).toHaveAttribute(
      "data-device",
      id,
    );
    await expect(page.locator(".device-photo")).toHaveJSProperty(
      "complete",
      true,
    );
    await expect
      .poll(() =>
        page
          .locator(".device-photo")
          .evaluate((el) => (el as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect(
      page.getByRole("navigation", { name: "切换掌机" }),
    ).toHaveCount(0);
    await page.locator(".power-button").click();
    await expect(page.getByTestId("emulator-status")).toHaveText("系统运行");
    await page.getByRole("button", { name: "暂停游戏", exact: true }).click();
    await expect(page.getByTestId("emulator-status")).toHaveText("已暂停");
    if (["sp", "ds", "3ds"].includes(id)) {
      await page.getByRole("button", { name: "完全展开", exact: true }).click();
      await expect(page.locator(".console-space")).toHaveAttribute(
        "data-posture",
        "flat",
      );
      await expect(page.getByTestId("emulator-status")).toHaveText("已暂停");
      await page
        .getByRole("button", { name: "恢复半展开", exact: true })
        .click();
      await expect(page.locator(".console-space")).toHaveAttribute(
        "data-posture",
        "angled",
      );
    }
  }
  await page.goto(
    pathToFileURL(resolve("public/standalone/pocket-museum-all.html")).href,
  );
  await expect(page).toHaveTitle("Pocket Museum · 全掌机单文件版");
  for (const [id, label] of devices) {
    await selectDevice(page, label);
    await expect(page.locator(".console-space")).toHaveAttribute(
      "data-device",
      id,
    );
    if (["sp", "ds", "3ds"].includes(id)) {
      await page.getByRole("button", { name: "完全展开", exact: true }).click();
      await expect(page.locator(".console-space")).toHaveAttribute(
        "data-posture",
        "flat",
      );
      await page
        .getByRole("button", { name: "恢复半展开", exact: true })
        .click();
      await expect(page.locator(".console-space")).toHaveAttribute(
        "data-posture",
        "angled",
      );
    }
  }
  expect(unexpected).toEqual([]);
  expect(errors).toEqual([]);
});
