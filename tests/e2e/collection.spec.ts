import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const devices = [
  ["gb", "Game Boy"],
  ["gba", "GBA"],
  ["sp", "GBA SP"],
  ["ds", "DS"],
  ["3ds", "3DS"],
  ["psp", "PSP"],
  ["vita", "PS Vita"],
] as const;
test("all seven handhelds switch inside one document and retain a unified UI", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const original = page.url();
  for (const [id, label] of devices) {
    await page
      .getByRole("navigation", { name: "切换掌机" })
      .getByRole("button", { name: label, exact: true })
      .click();
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
    expect(page.url()).toBe(original);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator(".screen-idle")).toHaveCount(
      id === "ds" || id === "3ds" ? 2 : 1,
    );
    await page.screenshot({
      path: `docs/screenshots/${id}-studio.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, label] of devices) {
    await page
      .getByRole("navigation", { name: "切换掌机" })
      .getByRole("button", { name: label, exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
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
    pathToFileURL(resolve("public/standalone/pocketsp-all.html")).href,
  );
  for (const [id, label] of devices) {
    await page
      .getByRole("navigation", { name: "切换掌机" })
      .getByRole("button", { name: label, exact: true })
      .click();
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
test("physical key travel is subtle and joysticks clamp, press and spring back to center", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".power-button")).toBeEnabled();
  const a = page.locator('[data-button="A"]');
  const box = await a.boundingBox();
  if (!box) throw new Error("Missing A");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const visibleBefore = await a.screenshot();
  await page.mouse.down();
  await expect(a).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(90);
  expect(await a.evaluate((el) => getComputedStyle(el).transform)).not.toBe(
    "none",
  );
  const visiblePressed = await a.screenshot();
  expect(visiblePressed.equals(visibleBefore)).toBe(false);
  await page.mouse.up();
  await expect(a).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("navigation", { name: "切换掌机" })
    .getByRole("button", { name: "PS Vita", exact: true })
    .click();
  const stick = page.getByRole("button", { name: "左摇杆", exact: true });
  const r = await stick.boundingBox();
  if (!r) throw new Error("Missing analog stick");
  const cx = r.x + r.width / 2,
    cy = r.y + r.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 250, cy - 100, { steps: 8 });
  await expect(stick).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-button="Right"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  const x = await stick.evaluate((el) =>
    parseFloat((el as HTMLElement).style.getPropertyValue("--stick-x")),
  );
  expect(Math.abs(x)).toBeLessThanOrEqual(17);
  await page.mouse.up();
  await expect(stick).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('[data-button="Right"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect
    .poll(() =>
      stick.evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue("--stick-x"),
      ),
    )
    .toBe("0%");
});
test("a failed runtime load shows a clear error and can be retried", async ({
  page,
}) => {
  await page.route("**/vendor/emulatorjs/4.2.3/data/loader.js", (r) =>
    r.abort(),
  );
  await page.goto("/");
  await expect(page.locator(".power-button")).toBeEnabled();
  await page.getByRole("button", { name: "选择卡带", exact: true }).click();
  await page.getByRole("button", { name: /2048 Advance/ }).click();
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("启动失败");
  await expect(page.getByRole("alert")).toContainText("无法加载 EmulatorJS");
  await page.unroute("**/vendor/emulatorjs/4.2.3/data/loader.js");
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("正在运行", {
    timeout: 65000,
  });
});

test("a one-piece D-pad rocks as a whole while each direction retains its own input", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".power-button")).toBeEnabled();
  for (const name of [
    "GBA SP",
    "Game Boy",
    "GBA",
    "DS",
    "3DS",
    "PSP",
    "PS Vita",
  ]) {
    await page
      .getByRole("navigation", { name: "切换掌机" })
      .getByRole("button", { name, exact: true })
      .click();
    const cap = page.getByTestId("dpad-cap"),
      assembly = page.getByTestId("dpad-assembly");
    await expect(cap).toHaveCount(1);
    await expect(assembly.locator(".dpad-hit")).toHaveCount(4);
    const up = page.locator('[data-button="Up"]'),
      right = page.locator('[data-button="Right"]');
    await up.focus();
    await page.keyboard.down("Enter");
    await expect(up).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() =>
        assembly.evaluate((el) =>
          (el as HTMLElement).style.getPropertyValue("--dpad-rotate-x"),
        ),
      )
      .toBe("7deg");
    const r = await right.boundingBox();
    if (!r) throw new Error("Missing right direction");
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.mouse.down();
    await expect(right).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() =>
        assembly.evaluate((el) =>
          (el as HTMLElement).style.getPropertyValue("--dpad-rotate-y"),
        ),
      )
      .toBe("7deg");
    expect(await up.evaluate((el) => getComputedStyle(el).transform)).toBe(
      "none",
    );
    await page.waitForTimeout(90);
    const currentId = await page
      .locator(".console-space")
      .getAttribute("data-device");
    await assembly.screenshot({
      path: `docs/screenshots/controls/${currentId}-dpad.png`,
    });
    if (name === "GBA SP")
      await page.screenshot({
        path: "docs/screenshots/sp-dpad-diagonal.png",
        fullPage: true,
      });
    await page.mouse.up();
    await page.keyboard.up("Enter");
    await expect(up).toHaveAttribute("aria-pressed", "false");
    await expect(right).toHaveAttribute("aria-pressed", "false");
    await expect
      .poll(() =>
        assembly.evaluate((el) =>
          (el as HTMLElement).style.getPropertyValue("--dpad-rotate-x"),
        ),
      )
      .toBe("0deg");
  }
});

test("control audit: every key releases, sliding/tilting sticks preserve diagonals and switching resets them", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".power-button")).toBeEnabled();
  for (const [id, label] of devices) {
    await page
      .getByRole("navigation", { name: "切换掌机" })
      .getByRole("button", { name: label, exact: true })
      .click();
    for (const button of await page.locator(".hardware-key").all()) {
      const r = await button.boundingBox();
      if (!r) throw new Error("Missing physical control");
      await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
      await page.mouse.down();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await page.mouse.up();
      await expect(button).toHaveAttribute("aria-pressed", "false");
    }
    const analog = page.getByRole("button", { name: "左摇杆", exact: true });
    if (await analog.count()) {
      await analog.focus();
      await page.keyboard.down("ArrowUp");
      await page.keyboard.down("ArrowRight");
      await expect(page.locator('[data-button="Up"]')).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(page.locator('[data-button="Right"]')).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await page.keyboard.up("ArrowUp");
      await expect(page.locator('[data-button="Up"]')).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(page.locator('[data-button="Right"]')).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await page.keyboard.up("ArrowRight");
      await expect(analog).toHaveAttribute("aria-pressed", "false");
      await expect(analog).toHaveClass(
        id === "vita" ? /tilt-stick/ : /slide-stick/,
      );
    }
  }
  await page
    .getByRole("navigation", { name: "切换掌机" })
    .getByRole("button", { name: "PS Vita", exact: true })
    .click();
  const left = page.getByRole("button", { name: "左摇杆", exact: true });
  const r = await left.boundingBox();
  if (!r) throw new Error("Missing analog");
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width, r.y + r.height / 2);
  const destination = page
    .getByRole("navigation", { name: "切换掌机" })
    .getByRole("button", { name: "3DS", exact: true });
  await destination.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".console-space")).toHaveAttribute(
    "data-device",
    "3ds",
  );
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "左摇杆", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect
    .poll(() =>
      page
        .getByRole("button", { name: "左摇杆", exact: true })
        .evaluate((el) =>
          (el as HTMLElement).style.getPropertyValue("--stick-x"),
        ),
    )
    .toBe("0%");
});

test("physical utility keys control volume, lighting and native Home screens", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".power-button")).toBeEnabled();
  await page
    .getByRole("navigation", { name: "切换掌机" })
    .getByRole("button", { name: "PSP", exact: true })
    .click();
  await page.getByRole("button", { name: "掌机 音量加", exact: true }).click();
  await expect(page.getByRole("slider", { name: "游戏音量" })).toHaveValue("5");
  await page.getByRole("button", { name: "掌机 音量减", exact: true }).click();
  await expect(page.getByRole("slider", { name: "游戏音量" })).toHaveValue("0");
  const lighting = page.getByRole("button", { name: "屏幕亮度", exact: true });
  const before = await lighting.getAttribute("aria-pressed");
  await page.getByRole("button", { name: "掌机 亮度", exact: true }).click();
  await expect(lighting).toHaveAttribute(
    "aria-pressed",
    before === "true" ? "false" : "true",
  );
  for (const name of ["PSP", "3DS", "PS Vita"]) {
    await page
      .getByRole("navigation", { name: "切换掌机" })
      .getByRole("button", { name, exact: true })
      .click();
    await page.locator(".power-button").click();
    await page.waitForTimeout(850);
    await page.getByRole("button", { name: "掌机 Home", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "PocketSP 使用指南" }),
    ).toHaveCount(0);
    await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
      "data-system-phase",
      "home",
    );
  }
});
