import { selectDevice } from "./helpers";
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
test.use({
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
});

const select = async (p: Page, name: string) => selectDevice(p, name);
async function boot(p: Page, name: string) {
  await select(p, name);
  await p.locator(".power-button").click();
  await expect(p.getByTestId("emulator-status")).toHaveText("系统运行");
  if (name === "DS")
    await p.getByRole("button", { name: "Touch Screen to continue" }).click();
  else if (name === "PS Vita")
    await p.getByRole("button", { name: "Unlock PS Vita" }).click();
  else
    await expect(p.getByTestId("native-screen-0")).toHaveAttribute(
      "data-system-phase",
      "home",
    );
}
async function app(p: Page, name: string, vita = false) {
  await p.getByRole("button", { name, exact: true }).click();
  if (vita) await p.getByRole("button", { name: "Start", exact: true }).click();
  else await p.getByRole("button", { name: "Open", exact: true }).click();
}
async function physical(p: Page, b: string) {
  await p
    .getByRole("button", { name: `掌机 ${b}`, exact: true })
    .click({ delay: 75 });
}
test("clamshells close to the calibrated plane, open by dragging, retain manual pause, and offer flat play", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/play/sp");
  for (const [id, name] of [
    ["sp", "GBA SP"],
    ["ds", "DS"],
    ["3ds", "3DS"],
  ]) {
    await select(page, name);
    const before = await page.locator(".lid").boundingBox();
    await page.getByRole("button", { name: "合上上盖", exact: true }).click();
    await expect(page.locator(".console-space")).toHaveAttribute(
      "data-posture",
      "closed",
    );
    await expect
      .poll(() =>
        page
          .locator(".console-space")
          .evaluate((el) =>
            getComputedStyle(el).getPropertyValue("--fold").trim(),
          ),
      )
      .toBe("1");
    await expect(page.locator(".hardware-key").first()).not.toBeVisible();
    await page
      .locator(".console-space")
      .screenshot({ path: `docs/screenshots/fold/${id}-closed.png` });
    const aligned = await page.locator(".handheld").evaluate((el, id) => {
      const base = el.querySelector(".base-plane")!.getBoundingClientRect(),
        cover = el.querySelector(".lid-back")!.getBoundingClientRect(),
        definitions: Record<
          string,
          { w: number; h: number; x: number; y: number; cw: number; ch: number }
        > = {
          sp: { w: 1199, h: 1312, x: 176, y: 757, cw: 844, ch: 426 },
          ds: { w: 1299, h: 1211, x: 28, y: 665, cw: 1242, ch: 440 },
          "3ds": { w: 1312, h: 1199, x: 12, y: 670, cw: 1284, ch: 424 },
        },
        d = definitions[id];
      return {
        left: Math.abs(cover.x - (base.x + (base.width * d.x) / d.w)),
        top: Math.abs(cover.y - (base.y + (base.height * d.y) / d.h)),
        width: Math.abs(cover.width - (base.width * d.cw) / d.w),
        height: Math.abs(cover.height - (base.height * d.ch) / d.h),
      };
    }, id);
    for (const value of Object.values(aligned)) expect(value).toBeLessThan(3);
    const handle = page.getByRole("button", {
        name: "拖动或打开上盖",
        exact: true,
      }),
      r = await handle.boundingBox();
    if (!r) throw Error("Missing handle");
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.mouse.down();
    await page.mouse.move(r.x + r.width / 2, r.y - r.height * 0.9, {
      steps: 10,
    });
    await page.mouse.up();
    await expect(page.locator(".console-space")).toHaveAttribute(
      "data-posture",
      "angled",
    );
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: "完全展开", exact: true }).click();
    await expect(page.locator(".console-space")).toHaveAttribute(
      "data-posture",
      "flat",
    );
    await page.waitForTimeout(800);
    const plane = await page
      .locator(".base-plane")
      .evaluate((el) => getComputedStyle(el).transform);
    expect(plane).toBe("none");
    await expect(page.locator(".console-space")).toHaveAttribute(
      "data-art-view",
      "flat",
    );
    await expect(page.locator(".device-photo")).toHaveAttribute(
      "src",
      `/assets/${id}-flat-v1.png`,
    );
    const aBounds = await page
      .getByRole("button", { name: "掌机 A", exact: true })
      .boundingBox();
    expect(aBounds!.width / aBounds!.height).toBeCloseTo(1, 2);
    if (id === "3ds") {
      const stickBounds = await page
        .getByRole("button", { name: "左摇杆", exact: true })
        .boundingBox();
      expect(stickBounds!.width / stickBounds!.height).toBeCloseTo(1, 2);
    }
    await page
      .locator(".console-space")
      .screenshot({ path: `docs/screenshots/fold/${id}-flat.png` });
    await physical(page, "A");
    if (id === "3ds") {
      const stick = page.getByRole("button", { name: "左摇杆", exact: true });
      // Dispatch without focusing: switching pose must reset the cap itself,
      // independently of blur cleanup or the logical InputController release.
      await stick.dispatchEvent("keydown", {
        code: "ArrowRight",
        key: "ArrowRight",
      });
      await expect(stick).toHaveAttribute("aria-pressed", "true");
    }
    await page.getByRole("button", { name: "恢复半展开", exact: true }).click();
    await page.waitForTimeout(800);
    if (id === "3ds")
      await expect(
        page.getByRole("button", { name: "左摇杆", exact: true }),
      ).toHaveAttribute("aria-pressed", "false");
    const after = await page.locator(".lid").boundingBox();
    expect(after!.width).toBeCloseTo(before!.width, 0);
  }
  await boot(page, "DS");
  await page.getByRole("button", { name: "暂停游戏", exact: true }).click();
  await page.getByRole("button", { name: "合上上盖", exact: true }).click();
  await page.getByRole("button", { name: "打开上盖", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText("已暂停");
  expect(errors).toEqual([]);
});
test("3DS Mii editor saves real features and notes survive HOME and a power cycle", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/play/sp");
  await boot(page, "3DS");
  await page.getByRole("button", { name: "完全展开", exact: true }).click();
  await page.waitForTimeout(800);
  await app(page, "Mii Maker");
  await page
    .getByRole("button", { name: "Create New Mii", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start from Scratch", exact: true })
    .click();
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByLabel("Mii Nickname").fill("Alex");
  await page
    .getByRole("button", { name: "Favourite colour #263d88", exact: true })
    .click();
  await page.getByRole("button", { name: "Hair", exact: true }).click();
  await page.getByRole("button", { name: "3", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".mii-catalog")).toContainText("Alex");
  await physical(page, "Home");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Game Notes", exact: true }).click();
  await page.getByRole("button", { name: "Note 1", exact: true }).click();
  await page.getByRole("button", { name: "Typed note", exact: true }).click();
  await page.getByLabel("Game Notes text").fill("Remember this note");
  await physical(page, "Home");
  await page.locator(".power-button").click();
  await page.reload();
  await boot(page, "3DS");
  await app(page, "Mii Maker");
  await expect(page.locator(".mii-catalog")).toContainText("Alex");
  await physical(page, "Home");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Game Notes", exact: true }).click();
  await page.getByRole("button", { name: "Note 1", exact: true }).click();
  await page.getByRole("button", { name: "Typed note", exact: true }).click();
  await expect(page.getByLabel("Game Notes text")).toHaveValue(
    "Remember this note",
  );
  await page.screenshot({
    path: "docs/screenshots/systems/3ds-notes.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("local photo import is persistent and deleted only after confirmation", async ({
  page,
}) => {
  await page.goto("/#/play/sp");
  await boot(page, "PS Vita");
  await page.getByLabel("导入本地媒体").setInputFiles({
    name: "local-picture.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP2kAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Home page 2" }).click();
  await app(page, "Photos", true);
  await expect(page.locator(".media-library")).toContainText(
    "local-picture.png",
  );
  await page.getByRole("button", { name: /local-picture/ }).click();
  await expect(page.locator(".media-photo")).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator(".native-dialog")).toContainText(
    "Delete this item",
  );
  await physical(page, "B");
  await expect(page.locator(".media-photo")).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(page.locator(".media-library")).toContainText(
    "There are no images.",
  );
  await page.reload();
  await boot(page, "PS Vita");
  await page.getByRole("button", { name: "Home page 2" }).click();
  await app(page, "Photos", true);
  await expect(page.locator(".media-library")).toContainText(
    "There are no images.",
  );
});
test("DS PictoChat exchanges text and actual drawings between two same-origin pages", async ({
  page,
  context,
}) => {
  const second = await context.newPage();
  await page.goto("/#/play/sp");
  await second.goto("/#/play/sp");
  for (const p of [page, second]) {
    await boot(p, "DS");
    await p.getByRole("button", { name: "PICTOCHAT", exact: false }).click();
    await p.getByRole("button", { name: "CHAT ROOM A", exact: false }).click();
  }
  await expect(page.locator(".picto-bottom>header")).toContainText("2/16");
  await page.getByLabel("PictoChat message").fill("Wireless hello");
  const pad = page.getByRole("img", { name: "手写绘图区域" }),
    r = await pad.boundingBox();
  if (!r) throw Error("Missing pad");
  await page.mouse.move(r.x + 10, r.y + 10);
  await page.mouse.down();
  await page.mouse.move(r.x + 60, r.y + 30, { steps: 6 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(second.locator(".picto-message")).toContainText(
    "Wireless hello",
  );
  await expect(second.locator(".picto-message svg path")).toHaveCount(1);
  await second.close();
});
test("GBA cartridge uses the real mGBA core and remains playable after changing shell", async ({
  page,
}) => {
  await page.goto("/#/play/sp");
  await select(page, "GBA");
  await page.getByRole("button", { name: "选择卡带", exact: true }).click();
  await page.getByRole("button", { name: /2048 Advance/ }).click();
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  const frame = page.frames().find((f) => f.url().includes("emulator.html"))!;
  await expect(frame.locator("canvas")).toBeVisible();
  // EJS onGameStart means the CPU is running; the homebrew still has its own short intro.
  await page.waitForTimeout(1200);
  await frame.evaluate(() => {
    const w = window as any;
    w.__gbaInputs = [];
    const original = w.EJS_emulator.gameManager.functions.simulateInput;
    w.EJS_emulator.gameManager.functions.simulateInput = (...args: any[]) => {
      w.__gbaInputs.push(args);
      return original(...args);
    };
  });
  const before = await frame.locator("canvas").screenshot();
  await physical(page, "A");
  await expect
    .poll(() => frame.evaluate(() => (window as any).__gbaInputs))
    .toContainEqual([0, 8, 1]);
  await expect
    .poll(() => frame.evaluate(() => (window as any).__gbaInputs))
    .toContainEqual([0, 8, 0]);
  await expect
    .poll(
      async () => before.equals(await frame.locator("canvas").screenshot()),
      { timeout: 5000 },
    )
    .toBe(false);
  await select(page, "GBA SP");
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
  await page.getByRole("button", { name: "完全展开", exact: true }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "合上上盖", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行");
  await page.getByRole("button", { name: "打开上盖", exact: true }).click();
  await page.waitForTimeout(900);
  await expect(page.locator(".console-space")).toHaveAttribute(
    "data-posture",
    "flat",
  );
  await physical(page, "A");
});
test("Vita Welcome Park runs Digit Chase and stores completion", async ({
  page,
}) => {
  await page.goto("/#/play/sp");
  await boot(page, "PS Vita");
  await app(page, "Welcome Park", true);
  await page.getByRole("button", { name: "Digit Chase", exact: true }).click();
  for (let n = 1; n <= 16; n++)
    await page
      .locator(".digit-chase")
      .getByRole("button", { name: String(n), exact: true })
      .click();
  await expect(page.locator(".park-score")).toContainText("Complete");
  await page.locator(".park-heading").getByRole("button").click();
  await expect(
    page.getByRole("button", { name: "Digit Chase", exact: false }),
  ).toContainText("✓");
});
test.describe("browser camera and microphone integration", () => {
  test("camera captures a real JPEG in IndexedDB and stops tracks after HOME", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["camera", "microphone"]);
    await page.goto("/#/play/sp");
    await boot(page, "3DS");
    await app(page, "3DS Camera");
    await page
      .getByRole("button", { name: "Start Camera", exact: true })
      .click();
    await expect(page.locator(".camera-view video")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".camera-view video")
          .evaluate((el) => (el as HTMLVideoElement).videoWidth),
      )
      .toBeGreaterThan(0);
    await page
      .locator(".camera-view video")
      .evaluate(
        (el) =>
          ((window as any).__testCameraStream = (
            el as HTMLVideoElement
          ).srcObject),
      );
    await page.getByRole("button", { name: "Take photo", exact: true }).click();
    await expect(page.locator(".camera-info")).toContainText(/Photos\s+1/);
    await physical(page, "Home");
    await expect
      .poll(() =>
        page.evaluate(() =>
          ((window as any).__testCameraStream as MediaStream)
            .getTracks()
            .every((t) => t.readyState === "ended"),
        ),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.evaluate(async () => {
      const open = indexedDB.open("pocketsp", 2);
      await new Promise<void>((resolve, reject) => {
        open.onsuccess = () => resolve();
        open.onerror = () => reject(open.error);
      });
      const db = open.result;
      const req = db.transaction("media").objectStore("media").getAll();
      await new Promise<void>((resolve) => (req.onsuccess = () => resolve()));
      (window as any).__savedPhoto = {
        type: req.result[0].blob.type,
        size: req.result[0].blob.size,
      };
      db.close();
    });
    expect(await page.evaluate(() => (window as any).__savedPhoto)).toEqual({
      type: "image/jpeg",
      size: expect.any(Number),
    });
  });
  test("3DS Sound records microphone data and plays the saved recording", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["microphone"]);
    await page.goto("/#/play/sp");
    await boot(page, "3DS");
    await app(page, "3DS Sound");
    await page
      .getByRole("button", { name: "Record sound", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Stop recording", exact: true }),
    ).toBeVisible();
    await page.waitForTimeout(600);
    await page
      .getByRole("button", { name: "Stop recording", exact: true })
      .click();
    await expect(page.locator(".media-library")).toContainText("Recording");
    await page.locator(".media-library>button").first().click();
    await page.getByRole("button", { name: "Play media", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Pause media", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".media-detail audio")
          .evaluate((el) => (el as HTMLAudioElement).currentTime),
      )
      .toBeGreaterThan(0);
  });
});
test("3DS and Vita icons can be held, swapped and restored after reload", async ({
  page,
}) => {
  await page.goto("/#/play/sp");
  for (const name of ["3DS", "PS Vita"]) {
    await boot(page, name);
    if (name === "3DS") {
      await page.getByRole("button", { name: "Increase icon rows" }).click();
    }
    const tiles = page.locator(
      name === "3DS"
        ? ".three-icon-grid [data-app-id]"
        : ".vita-bubbles [data-app-id]",
    );
    const before = await tiles.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.appId),
    );
    const first = await tiles.nth(0).boundingBox(),
      second = await tiles.nth(1).boundingBox();
    if (!first || !second) throw Error("Missing icons");
    await page.mouse.move(
      first.x + first.width / 2,
      first.y + first.height / 2,
    );
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.move(
      second.x + second.width / 2,
      second.y + second.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();
    await expect
      .poll(() => tiles.nth(0).getAttribute("data-app-id"))
      .toBe(before[1]);
    await expect
      .poll(() => tiles.nth(1).getAttribute("data-app-id"))
      .toBe(before[0]);
    await page.reload();
    await boot(page, name);
    await expect(tiles.nth(0)).toHaveAttribute("data-app-id", before[1]);
    if (name === "3DS") {
      await page.locator(".power-button").click();
    }
  }
});
