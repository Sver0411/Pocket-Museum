import { chromium } from "@playwright/test";
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto("http://127.0.0.1:4173");
await p.getByRole("button", { name: "完全展开", exact: true }).click();
await p.waitForTimeout(800);
await p.locator(".power-button").click();
await p.waitForTimeout(800);
if ((await p.locator(".console-space").getAttribute("data-posture")) !== "flat")
  throw Error("No flat posture");
await p
  .getByRole("navigation", { name: "切换掌机" })
  .getByRole("button", { name: "DS", exact: true })
  .click();
await p.locator(".power-button").click();
await p.getByRole("button", { name: "Touch Screen to continue" }).click();
await p.getByRole("button", { name: "完全展开", exact: true }).click();
await p.waitForTimeout(800);
await p.getByRole("button", { name: "DS Settings", exact: true }).click();
await p.getByRole("button", { name: "Clock", exact: true }).click();
await p.getByRole("button", { name: /^Date/ }).click();
await p.getByLabel("Date", { exact: true }).fill("2026-11-20");
await p.getByRole("button", { name: "OK", exact: true }).click();
await p.getByRole("button", { name: "Quit", exact: true }).click();
await p.getByRole("button", { name: "OK", exact: true }).click();
await p.locator(".power-button").click();
await p.getByRole("button", { name: "Touch Screen to continue" }).click();
const today = await p.locator(".ds-calendar .today").innerText();
if (today !== "20") throw Error(`Clock setting ineffective: ${today}`);
await p.screenshot({
  path: "docs/screenshots/systems/ds-production-flat.png",
  fullPage: true,
});
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "Production build: SP flat pose, DS touch/flat/settings, effective calendar date and shutdown/reboot verified; zero page errors.",
);
await b.close();
