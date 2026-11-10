import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
const port = Number(process.env.POCKET_MUSEUM_PREVIEW_PORT || 4175);
const origin = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));
let browser;
try {
  let online = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw Error(serverLog);
    try {
      online = (await fetch(origin)).ok;
    } catch {}
    if (online) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!online) throw Error("Production preview did not start: " + serverLog);
  browser = await chromium.launch({
    channel:
      process.env.POCKET_MUSEUM_BROWSER === "chrome" ? "chrome" : undefined,
  });
  const p = await browser.newPage({ viewport: { width: 1440, height: 1100 } }),
    errors = [],
    external = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("request", (r) => {
    if (
      ![origin, "blob:", "data:"].some((prefix) => r.url().startsWith(prefix))
    )
      external.push(r.url());
  });
  await p.goto(origin);
  await expect(p.locator(".museum-exhibit")).toHaveCount(7);
  await p.getByRole("button", { name: "体验 GBA SP", exact: true }).click();
  await p.getByRole("button", { name: "完全展开", exact: true }).click();
  await expect(p.locator(".console-space")).toHaveAttribute(
    "data-posture",
    "flat",
  );
  const select = async (name) => {
    await p.getByRole("button", { name: "切换掌机", exact: true }).click();
    await p
      .getByRole("navigation", { name: "切换掌机" })
      .getByRole("button", { name, exact: true })
      .click();
  };
  await select("DS");
  await p.locator(".power-button").click();
  await p.getByRole("button", { name: "Touch Screen to continue" }).click();
  await p.getByRole("button", { name: "完全展开", exact: true }).click();
  await p.getByRole("button", { name: "DS Settings", exact: true }).click();
  await p.getByRole("button", { name: "Clock", exact: true }).click();
  await p.getByRole("button", { name: /^Date/ }).click();
  await p.getByLabel("Date", { exact: true }).fill("2026-11-20");
  await p.getByRole("button", { name: "OK", exact: true }).click();
  await p.getByRole("button", { name: "Quit", exact: true }).click();
  await p.getByRole("button", { name: "OK", exact: true }).click();
  await p.locator(".power-button").click();
  await p.getByRole("button", { name: "Touch Screen to continue" }).click();
  await expect(p.locator(".ds-calendar .today")).toHaveText("20");
  await mkdir("docs/screenshots/current", { recursive: true });
  await p.screenshot({
    path: "docs/screenshots/current/production-ds-flat.png",
    fullPage: true,
  });
  for (const [name, demo, core, width, height] of [
    ["Game Boy", "GB Snake", "mgba", 160, 144],
    ["GBA SP", "2048 Advance", "mgba", 240, 160],
    ["DS", "JamClown", "desmume", 256, 384],
  ]) {
    await select(name);
    await p.getByRole("button", { name: "选择卡带", exact: true }).click();
    await p.getByRole("button", { name: new RegExp(demo) }).click();
    await p.locator(".power-button").click();
    await expect(p.getByTestId("emulator-status")).toHaveText("正在运行", {
      timeout: 65000,
    });
    const f = p.frames().find((f) => f.url().includes("/emulator.html"));
    const actual = await f.evaluate(() => {
      const e = window.EJS_emulator;
      return [
        e.getCore(),
        e.gameManager.getVideoDimensions("width"),
        e.gameManager.getVideoDimensions("height"),
      ];
    });
    if (JSON.stringify(actual) !== JSON.stringify([core, width, height]))
      throw Error(`${name}: unexpected actual core/video ${actual}`);
    await p.getByRole("button", { name: "即时存档", exact: true }).click();
    await expect(p.locator(".toast")).toContainText("即时存档已保存");
  }
  await p.setViewportSize({ width: 390, height: 844 });
  if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw Error("Production mobile overflow");
  if (errors.length || external.length)
    throw Error(JSON.stringify({ errors, external }));
  console.log(
    "Production: museum/flat pose, effective DS date, GB + GBA + NDS real cores/video/savestates, mobile layout; zero page errors/external requests.",
  );
} finally {
  try {
    await browser?.close();
  } finally {
    server.kill("SIGTERM");
  }
}
