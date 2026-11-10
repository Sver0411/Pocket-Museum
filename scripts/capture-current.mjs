import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.env.POCKET_MUSEUM_CAPTURE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({
  channel:
    process.env.POCKET_MUSEUM_BROWSER === "chrome" ? "chrome" : undefined,
});
const errors = [],
  paths = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const p = await context.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  const dir = "docs/screenshots/current";
  await mkdir(dir, { recursive: true });
  const capture = async (name) => {
    const path = `${dir}/${name}.png`;
    await p.screenshot({ path, fullPage: true });
    paths.push(path);
  };
  await p.goto(origin);
  await expect(p.locator(".museum-exhibit")).toHaveCount(7);
  await expect(p.locator(".exhibit-art.ready")).toHaveCount(7);
  await capture("museum-desktop");
  await p.setViewportSize({ width: 390, height: 844 });
  await capture("museum-mobile");
  await p.setViewportSize({ width: 1440, height: 1000 });
  const devices = [
    ["gb", "Game Boy"],
    ["gba", "GBA"],
    ["sp", "GBA SP"],
    ["ds", "DS"],
    ["3ds", "3DS"],
    ["psp", "PSP"],
    ["vita", "PS Vita"],
  ];
  for (const [id] of devices) {
    await p.goto(`${origin}/#/play/${id}`);
    await expect(p.locator(".power-button")).toBeEnabled();
    await p.locator(".power-button").click();
    await expect(p.getByTestId("emulator-status")).toHaveText("系统运行");
    if (id === "ds")
      await p.getByRole("button", { name: "Touch Screen to continue" }).click();
    else if (id === "vita")
      await p.getByRole("button", { name: "Unlock PS Vita" }).click();
    else if (!["gb", "gba", "sp"].includes(id))
      await expect(p.getByTestId("native-screen-0")).toHaveAttribute(
        "data-system-phase",
        "home",
      );
    await p.waitForTimeout(250);
    await capture(id);
  }
  for (const [id, demo] of [
    ["gb", "GB Snake"],
    ["gba", "2048 Advance"],
    ["sp", "2048 Advance"],
    ["ds", "JamClown"],
  ]) {
    await p.goto(`${origin}/#/play/${id}`);
    await p.getByRole("button", { name: "选择卡带", exact: true }).click();
    await p.getByRole("button", { name: new RegExp(demo) }).click();
    await p.locator(".power-button").click();
    await expect(p.getByTestId("emulator-status")).toHaveText("正在运行", {
      timeout: 65000,
    });
    const key = async (k) =>
      p
        .getByRole("button", { name: `掌机 ${k}`, exact: true })
        .click({ delay: 120 });
    if (id === "gb") {
      await key("Start");
      await p.waitForTimeout(200);
    } else if (id !== "ds") {
      await key("A");
      await key("Up");
      await key("Left");
    }
    if (id === "sp")
      await p.getByRole("button", { name: "完全展开", exact: true }).click();
    await p.waitForTimeout(900);
    await capture(`${id}-game`);
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await capture("ds-mobile");
  if (errors.length) throw Error(errors.join("\n"));
  await writeFile(
    `${dir}/index.json`,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        source: origin,
        viewport: { width: 1440, height: 1000 },
        mobile: { width: 390, height: 844 },
        files: paths,
        pageErrors: errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Captured ${paths.length} current running screenshots, zero page errors.`,
  );
} finally {
  await browser.close();
}
