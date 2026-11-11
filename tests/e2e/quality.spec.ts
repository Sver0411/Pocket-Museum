import { expect, test } from "@playwright/test";

test("held GBA directions and the 3DS slider keep their expected outlines", async ({ page }, info) => {
  await page.goto("/#/play/gba");
  const cross = page.getByTestId("dpad-assembly");
  const right = page.getByRole("button", { name: "掌机 Right", exact: true });
  const bounds = (await right.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await expect(right).toHaveAttribute("aria-pressed", "true");
  await expect(cross.locator(".dpad-bearing")).toBeHidden();
  await cross.screenshot({ path: info.outputPath("gba-right-held.png") });
  await page.mouse.up();
  await expect(right).toHaveAttribute("aria-pressed", "false");

  await page.goto("/#/play/3ds");
  const slider = page.getByRole("slider", { name: "掌机音量" });
  const sliderBounds = (await slider.boundingBox())!;
  await page.mouse.move(sliderBounds.x + sliderBounds.width / 2, sliderBounds.y + sliderBounds.height * .8);
  await page.mouse.down();
  await page.mouse.move(sliderBounds.x + sliderBounds.width / 2, sliderBounds.y + sliderBounds.height * .2);
  const shell = page.locator(".hardware-slider.recessed");
  await expect(shell).toHaveCSS("outline-style", "none");
  await expect(shell.locator(".slider-track")).toHaveCSS("outline-style", "none");
  await shell.screenshot({ path: info.outputPath("3ds-volume-dragging.png") });
  await page.mouse.up();
  await expect(shell).toHaveCSS("outline-style", "none");
  await page.keyboard.press("End");
  await expect(shell.locator(".slider-track")).toHaveCSS("outline-style", "solid");
});

test("3DS keeps the screens dark during lid motion", async ({ page }, info) => {
  await page.goto("/#/play/3ds");
  await page.locator(".power-button").click();
  await expect(page.getByTestId("native-screen-0")).toHaveAttribute("data-system-phase", "home");
  const frames = await page.evaluate(() => {
    const stage = document.querySelector(".console-space")!;
    const button = document.querySelector<HTMLButtonElement>('button[aria-label="合上上盖"]')!;
    const frames: { progress: number; lit: boolean; overlay: boolean }[] = [];
    const start = performance.now();
    button.click();
    return new Promise<typeof frames>((resolve) => {
      const sample = () => {
        const progress = Number(getComputedStyle(stage).getPropertyValue("--fold"));
        if (progress > 0 && progress < 1) frames.push({
          progress,
          lit: [...stage.querySelectorAll(".native-screen")].some((screen) =>
            getComputedStyle(screen).visibility === "visible"),
          overlay: !!stage.querySelector(".screen-overlay.paused"),
        });
        if (performance.now() - start < 950) requestAnimationFrame(sample);
        else resolve(frames);
      };
      requestAnimationFrame(sample);
    });
  });
  expect(frames.length).toBeGreaterThan(2);
  expect(frames.every(({ lit, overlay }) => !lit && !overlay)).toBe(true);
  await page.locator(".console-space").screenshot({ path: info.outputPath("3ds-closed.png") });
});

test("3DS offers a retry and draft export after a failed note write", async ({ page }) => {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (key === "system:3ds" && (value as { notes?: string }).notes &&
          !sessionStorage.getItem("allow-note-write")) {
        throw new DOMException("Simulated quota", "QuotaExceededError");
      }
      return put.call(this, value, key);
    };
  });
  const button = (name: string) => page.getByRole("button", { name, exact: true });
  await page.goto("/#/play/3ds");
  await page.locator(".power-button").click();
  await button("Game Notes").click();
  await button("Note 1").click();
  await button("Typed note").click();
  const note = page.getByRole("textbox", { name: "Game Notes text" });
  await note.fill("Keep this draft");
  await expect(page.getByRole("alert")).toContainText("Note not saved");
  await expect(note).toHaveValue("Keep this draft");
  const download = page.waitForEvent("download");
  await button("Download draft").click();
  expect((await download).suggestedFilename()).toBe("game-note-1.json");
  await page.evaluate(() => sessionStorage.setItem("allow-note-write", "1"));
  await button("Retry").click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.reload();
  await page.locator(".power-button").click();
  await button("Game Notes").click();
  await button("Note 1").click();
  await button("Typed note").click();
  await expect(note).toHaveValue("Keep this draft");
});

test("gallery quick play and backup restore an instant save in a clean profile", async ({ page, browser }, info) => {
  await page.goto("/");
  const button = (name: string) => page.getByRole("button", { name, exact: true });
  await button("试玩 2048").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", { timeout: 30000 });
  await button("即时存档").click();
  await expect(button("读取存档")).toBeEnabled();
  await button("返回博物馆").click();
  await expect(button("继续上次")).toBeVisible();
  await button("存档备份").click();
  const pending = page.waitForEvent("download");
  await button("导出备份").click();
  const file = info.outputPath("museum-backup.json");
  await (await pending).saveAs(file);
  const clean = await browser.newContext();
  try {
    const restored = await clean.newPage();
    await restored.goto(new URL("/", page.url()).href);
    await restored.getByRole("button", { name: "存档备份", exact: true }).click();
    await restored.getByLabel("选择备份文件").setInputFiles(file);
    await restored.getByRole("button", { name: "导入备份", exact: true }).click();
    await restored.getByRole("button", { name: "重新载入", exact: true }).click();
    await restored.getByRole("button", { name: "继续上次", exact: true }).click();
    await expect(restored.getByTestId("emulator-status")).toHaveText("正在运行", { timeout: 30000 });
    await expect(restored.locator(".toast")).toHaveText("即时存档已恢复");
  } finally {
    await clean.close();
  }
});
