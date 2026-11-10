import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
test("user-owned system artwork loads locally, survives reload, and rejects remote paths", async ({
  page,
}, info) => {
  const folder = resolve(info.outputPath("theme"));
  await mkdir(folder, { recursive: true });
  await page.goto("/#/play/3ds");
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 72;
    c.height = 72;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#36a59c";
    ctx.fillRect(0, 0, 72, 72);
    return c.toDataURL("image/png").split(",")[1];
  });
  await writeFile(resolve(folder, "camera.png"), Buffer.from(png, "base64"));
  const manifest = {
    format: 1,
    device: "3ds",
    icons: { camera: "camera.png" },
  };
  await writeFile(
    resolve(folder, "pocket-museum-theme.json"),
    JSON.stringify(manifest),
  );
  await page.locator(".more-controls summary").click();
  await page.getByLabel("导入系统资源", { exact: true }).setInputFiles(folder);
  await expect(page.locator(".toast")).toContainText("系统资源已加载");
  await page.locator(".power-button").click();
  const camera = page.locator('.three-tile[data-app-id="camera"] img');
  await expect(camera).toHaveAttribute("src", /^data:image\/png;base64,/);
  const original = await camera.getAttribute("src");
  await page.reload();
  await page.locator(".power-button").click();
  await expect(camera).toHaveAttribute("src", original!);
  await page.locator(".more-controls summary").click();
  await writeFile(
    resolve(folder, "pocket-museum-theme.json"),
    JSON.stringify({
      ...manifest,
      icons: { camera: "https://example.org/icon.png" },
    }),
  );
  await page.getByLabel("导入系统资源", { exact: true }).setInputFiles(folder);
  await expect(page.getByRole("alert")).toContainText("相对路径");
  await expect(camera).toHaveAttribute("src", original!);
  await page.getByRole("button", { name: "恢复内置素材", exact: true }).click();
  await expect(camera).toHaveCount(0);
  await page.reload();
  await page.locator(".power-button").click();
  await expect(camera).toHaveCount(0);
});
