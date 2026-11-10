import { test, expect } from "@playwright/test";
import { selectDevice } from "./helpers";
test("physical contrast, volume, Vita power and PSP SOUND short/long presses have distinct effects", async ({
  page,
}) => {
  await page.goto("/#/play/gb");
  const contrast = page.getByRole("slider", { name: "LCD 对比度" });
  await contrast.focus();
  await page.keyboard.press("Home");
  await expect(contrast).toHaveValue("0");
  await expect
    .poll(() =>
      page.locator(".lcd").evaluate((e) => getComputedStyle(e).filter),
    )
    .toContain("contrast(0.35)");
  await selectDevice(page, "DS");
  const volume = page.getByRole("slider", { name: "掌机音量" });
  await volume.focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("slider", { name: "游戏音量" })).toHaveValue(
    "100",
  );
  await selectDevice(page, "PS Vita");
  await page.locator(".photo-power").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("系统运行");
  await page.getByRole("button", { name: "开启声音", exact: true }).click();
  await page.getByRole("button", { name: "掌机 音量减", exact: true }).click();
  await expect(page.getByRole("slider", { name: "游戏音量" })).toHaveValue(
    "55",
  );
  await selectDevice(page, "PSP");
  await page.getByRole("button", { name: "开启声音", exact: true }).click();
  const sound = page.getByRole("button", { name: "掌机 SOUND", exact: true }),
    old = await page.getByRole("slider", { name: "游戏音量" }).inputValue();
  await sound.click();
  await expect(page.getByRole("slider", { name: "游戏音量" })).toHaveValue(old);
  await sound.click({ delay: 1150 });
  await expect(page.getByRole("slider", { name: "游戏音量" })).toHaveValue("0");
});
