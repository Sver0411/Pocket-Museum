import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const devices = [
  ["gb", "Game Boy"],
  ["gba", "GBA"],
  ["sp", "GBA SP"],
  ["ds", "DS"],
  ["3ds", "3DS"],
  ["psp", "PSP"],
  ["vita", "PS Vita"],
] as const;
async function select(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "切换掌机" })
    .getByRole("button", { name, exact: true })
    .click();
}
async function boot(page: Page, name: string) {
  await select(page, name);
  await page.locator(".power-button").click();
  await expect(page.getByTestId("emulator-status")).toHaveText("系统运行");
  if (name === "DS") {
    await page
      .getByRole("button", { name: "Touch Screen to continue" })
      .click();
  } else if (name === "PS Vita") {
    await page.getByRole("button", { name: "Unlock PS Vita" }).click();
  } else if (!["Game Boy", "GBA", "GBA SP"].includes(name)) {
    await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
      "data-system-phase",
      "home",
    );
  }
}
async function physical(page: Page, b: string) {
  await page
    .getByRole("button", { name: `掌机 ${b}`, exact: true })
    .click({ delay: 70 });
}
test("all seven machines show their own cartridge-free startup and main screens", async ({
  page,
}) => {
  const external: string[] = [],
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5173") &&
      !r.url().startsWith("data:")
    )
      external.push(r.url());
  });
  await page.goto("/");
  for (const [id, name] of devices) {
    await boot(page, name);
    await expect(page.locator("iframe")).toHaveCount(0);
    if (["gb", "gba", "sp"].includes(id)) {
      await expect(page.locator(".gb-boot,.gba-boot")).toBeVisible();
      await physical(page, "A");
      await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
        "data-system-phase",
        "boot",
      );
    }
    await page.screenshot({
      path: `docs/screenshots/systems/${id}-home.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test("DS touch menu, local PictoChat, settings persistence and real Quit power-off flow", async ({
  page,
}) => {
  await page.goto("/");
  await boot(page, "DS");
  await page.getByRole("button", { name: "PICTOCHAT", exact: false }).click();
  await page.getByRole("button", { name: "CHAT ROOM A", exact: false }).click();
  await page.getByLabel("PictoChat message").fill("Hello DS");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".picto-top")).toContainText("Hello DS");
  await page.getByRole("button", { name: "Exit", exact: true }).click();
  await page.getByRole("button", { name: "Exit", exact: true }).click();
  await page.getByRole("button", { name: "DS Settings", exact: true }).click();
  await page.getByRole("button", { name: "User", exact: true }).click();
  await page.getByRole("button", { name: /User Name/ }).click();
  await page.getByLabel("User Name", { exact: true }).fill("Alex");
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await page.getByRole("button", { name: "Quit", exact: true }).click();
  await expect(page.locator(".native-dialog")).toContainText("shut down");
  await physical(page, "A");
  await expect(page.getByTestId("emulator-status")).toHaveText("电源关闭");
  await page.reload();
  await boot(page, "DS");
  await expect(page.locator(".ds-status")).toContainText("Alex");
});
test("3DS HOME selection, settings, suspension and icon layout follow the native flow", async ({
  page,
}) => {
  await page.goto("/");
  await boot(page, "3DS");
  await physical(page, "Right");
  await expect(page.locator(".three-title")).toHaveText(
    "Health and Safety Information",
  );
  await page.getByRole("button", { name: "Increase icon rows" }).click();
  await expect(page.locator(".three-grid-viewport")).toHaveClass(/rows-2/);
  await page
    .getByRole("button", { name: "System Settings", exact: true })
    .click();
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.locator(".three-settings-top")).toBeVisible();
  await page
    .getByRole("button", { name: "Other Settings", exact: true })
    .click();
  await page.getByRole("button", { name: /Screen Brightness/ }).click();
  await page.getByRole("button", { name: "○ 4", exact: true }).click();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await physical(page, "Home");
  await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
    "data-system-phase",
    "app",
  );
  await physical(page, "B");
  await physical(page, "B");
  await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
    "data-system-phase",
    "home",
  );
  await page
    .getByRole("button", { name: "Health and Safety Information", exact: true })
    .click();
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await physical(page, "Home");
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
    "data-system-phase",
    "app",
  );
});
test("PSP physical D-pad navigates XMB settings and editing, Back returns to the same XMB item", async ({
  page,
}) => {
  await page.goto("/");
  await boot(page, "PSP");
  for (let i = 0; i < 5; i++) await physical(page, "Down");
  await expect(page.locator(".xmb-items>.selected")).toContainText(
    "Theme Settings",
  );
  await physical(page, "A");
  await expect(page.locator(".psp-settings")).toBeVisible();
  await physical(page, "Down");
  await physical(page, "A");
  await expect(page.locator(".native-editor")).toContainText("Colour");
  await physical(page, "Right");
  await physical(page, "A");
  await expect(page.locator(".psp-xmb")).toHaveClass(/psp-colour-purple/);
  await physical(page, "B");
  await expect(page.locator(".xmb-items>.selected")).toContainText(
    "Theme Settings",
  );
  await physical(page, "Right");
  await expect(page.locator(".xmb-categories>.selected")).toContainText(
    "Photo",
  );
});
test("Vita unlock, bubbles, LiveArea, native PS transitions, page swipe and app close", async ({
  page,
}) => {
  await page.goto("/");
  await boot(page, "PS Vita");
  await page.getByRole("button", { name: "Browser", exact: true }).click();
  await expect(page.locator(".vita-live")).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
    "data-system-phase",
    "app",
  );
  await physical(page, "Home");
  await expect(page.getByTestId("native-screen-0")).toHaveAttribute(
    "data-system-phase",
    "live",
  );
  await physical(page, "Home");
  await expect(page.locator(".vita-index")).toBeVisible();
  await physical(page, "Home");
  await expect(page.locator(".vita-home")).toBeVisible();
  await page.getByRole("button", { name: "Home page 2" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Language", exact: true }).click();
  await page.getByRole("button", { name: /System Language/ }).click();
  await page.getByRole("button", { name: "○ 简体中文", exact: true }).click();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await physical(page, "Home");
  await page
    .getByRole("button", { name: "Close LiveArea", exact: true })
    .click();
  await expect(page.locator(".vita-home")).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/systems/vita-page2.png",
    fullPage: true,
  });
});
test("each D-pad depresses its loaded edge, with distinct opposite transforms on all seven shells", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".power-button")).toBeEnabled();
  for (const [id, name] of devices) {
    await select(page, name);
    const cap = page.getByTestId("dpad-cap");
    const signatures: string[] = [];
    for (const dir of ["Up", "Down", "Left", "Right"]) {
      const key = page.locator(`[data-button="${dir}"]`),
        r = await key.boundingBox();
      if (!r) throw Error(dir);
      await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
      await page.mouse.down();
      await expect(key).toHaveAttribute("aria-pressed", "true");
      await expect
        .poll(() =>
          cap.evaluate((el, dir) => {
            const m = new DOMMatrix(getComputedStyle(el).transform),
              w = (el as HTMLElement).offsetWidth,
              h = (el as HTMLElement).offsetHeight;
            const x = dir === "Left" ? -w / 2 : dir === "Right" ? w / 2 : 0,
              y = dir === "Up" ? -h / 2 : dir === "Down" ? h / 2 : 0;
            return (
              m.transformPoint({ x, y, z: 0 }).z -
              m.transformPoint({ x: -x, y: -y, z: 0 }).z
            );
          }, dir),
        )
        .toBeLessThan(-1);
      await page.waitForTimeout(100);
      signatures.push(
        await cap.evaluate((el) => getComputedStyle(el).transform),
      );
      await page.getByTestId("dpad-assembly").screenshot({
        path: `docs/screenshots/controls/${id}-${dir.toLowerCase()}.png`,
      });
      await page.mouse.up();
      await expect(key).toHaveAttribute("aria-pressed", "false");
    }
    expect(new Set(signatures).size).toBe(4);
  }
});
