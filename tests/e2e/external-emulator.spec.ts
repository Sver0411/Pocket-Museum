import { test, expect, type Page } from "@playwright/test";
import { openTools, selectDevice } from "./helpers";

async function openConnection(page: Page) {
  await openTools(page);
  const more = page.locator(".more-controls");
  if ((await more.getAttribute("open")) === null)
    await more.locator("summary").click();
  await page.getByRole("button", { name: /^(连接模拟器|模拟器连接)$/ }).click();
}

test("external connection renders shared video, keeps analog separate and releases inputs on exit", async ({
  page,
}) => {
  const commands: any[] = [];
  let stepping = false;
  await page.routeWebSocket("ws://127.0.0.1:27312/debugger", (socket) => {
    socket.onMessage((data) => {
      const r = JSON.parse(String(data));
      commands.push(r);
      if (r.event === "cpu.stepping" || r.event === "cpu.resume") {
        stepping = r.event === "cpu.stepping";
        socket.send(JSON.stringify({ event: r.event }));
      } else if (r.ticket) {
        const fields =
          r.event === "version"
            ? { name: "PPSSPP", version: "test-server" }
            : r.event === "cpu.status"
              ? { stepping, paused: false }
              : r.event === "game.status"
                ? { game: { title: "Protocol fixture" } }
                : {};
        socket.send(JSON.stringify({ ...r, ...fields }));
      }
    });
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", {
      value: async () => {
        const c = document.createElement("canvas");
        c.width = 480;
        c.height = 272;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#35ad84";
        ctx.fillRect(0, 0, 480, 272);
        ctx.fillStyle = "#ffe080";
        ctx.fillRect(80, 60, 180, 140);
        const stream = c.captureStream(30);
        (window as any).__testCapture = { c, stream };
        return stream;
      },
    });
  });
  await page.goto("/#/play/psp");
  await openConnection(page);
  await page.getByRole("button", { name: "连接", exact: true }).click();
  await expect(page.locator(".connection-status")).toHaveText(
    "已连接 PPSSPP test-server",
  );
  await page.getByRole("button", { name: "共享模拟器窗口" }).click();
  await expect(page.getByLabel("裁剪上边")).toBeVisible();
  await page.getByLabel("裁剪上边").fill("5");
  await page.getByRole("button", { name: "关闭连接面板" }).click();
  // Captured video can round RGB through the browser's YUV conversion.
  await expect
    .poll(() =>
      page
        .locator(".external-screen canvas")
        .evaluate((c: HTMLCanvasElement) => {
          const pixel = c.getContext("2d")!.getImageData(120, 100, 1, 1).data;
          return Math.max(
            ...[255, 224, 128, 255].map((v, i) => Math.abs(pixel[i] - v)),
          );
        }),
    )
    .toBeLessThanOrEqual(2);
  await page
    .getByRole("button", { name: "掌机 A", exact: true })
    .click({ delay: 90 });
  expect(commands).toContainEqual(
    expect.objectContaining({
      event: "input.buttons.send",
      buttons: { cross: true },
    }),
  );
  expect(commands).toContainEqual(
    expect.objectContaining({
      event: "input.buttons.send",
      buttons: { cross: false },
    }),
  );
  const stick = page.getByRole("button", { name: "左摇杆", exact: true }),
    r = (await stick.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width * 0.8, r.y + r.height * 0.25, {
    steps: 4,
  });
  await expect(page.locator(".dpad-assembly")).not.toHaveClass(/active/);
  await page.mouse.up();
  expect(
    commands.some(
      (r) => r.event === "input.analog.send" && r.x > 0.5 && r.y > 0.4,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "暂停游戏", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText(
    "PPSSPP · 已暂停",
  );
  await page.getByRole("button", { name: "继续游戏", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText(
    "PPSSPP · 已连接",
  );
  await selectDevice(page, "GBA SP");
  expect(commands).toContainEqual({
    event: "input.analog.send",
    stick: "left",
    x: 0,
    y: 0,
  });
  expect(
    await page.evaluate(
      () => (window as any).__testCapture.stream.getTracks()[0].readyState,
    ),
  ).toBe("ended");
  await expect(page.locator(".external-screen")).toHaveCount(0);
});

test("connection panel exposes address validation errors without leaving the current machine", async ({
  page,
}) => {
  await page.goto("/#/play/psp");
  await openConnection(page);
  await page.getByLabel("模拟器地址").fill("ws://10.attacker.org/debugger");
  await page.getByRole("button", { name: "连接", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "本机或局域网",
  );
  await expect(page.locator(".console-space")).toHaveAttribute(
    "data-device",
    "psp",
  );
});

test("real optional PPSSPP responds to the browser shell controls and pause/resume", async ({
  page,
}) => {
  test.skip(
    !process.env.POCKET_MUSEUM_PPSSPP,
    "Requires a running user-owned native PPSSPP program",
  );
  const received: any[] = [],
    sent: any[] = [];
  page.on("websocket", (ws) => {
    ws.on("framesent", (e) => {
      try {
        sent.push(JSON.parse(String(e.payload)));
      } catch {}
    });
    ws.on("framereceived", (e) => {
      try {
        received.push(JSON.parse(String(e.payload)));
      } catch {}
    });
  });
  await page.goto("/#/play/psp");
  await openConnection(page);
  await page.getByLabel("模拟器地址").fill(process.env.POCKET_MUSEUM_PPSSPP!);
  await page.getByRole("button", { name: "连接", exact: true }).click();
  await expect(page.locator(".connection-status")).toContainText(
    "已连接 PPSSPP",
  );
  await page.getByRole("button", { name: "关闭连接面板" }).click();
  if (
    await page
      .getByRole("button", { name: "继续游戏", exact: true })
      .isVisible()
  )
    await page.getByRole("button", { name: "继续游戏", exact: true }).click();
  await page
    .getByRole("button", { name: "掌机 A", exact: true })
    .click({ delay: 200 });
  await expect
    .poll(() =>
      received.some(
        (r) => r.event === "input.buttons" && r.changed.cross === true,
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      received.some(
        (r) => r.event === "input.buttons" && r.changed.cross === false,
      ),
    )
    .toBe(true);
  const stick = page.getByRole("button", { name: "左摇杆", exact: true }),
    r = (await stick.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width * 0.8, r.y + r.height * 0.25, {
    steps: 6,
  });
  await expect
    .poll(() =>
      received.some(
        (r) => r.event === "input.analog" && r.x > 0.5 && r.y > 0.4,
      ),
    )
    .toBe(true);
  await expect(page.locator(".dpad-assembly")).not.toHaveClass(/active/);
  await page.mouse.up();
  await page.getByRole("button", { name: "暂停游戏", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText(
    "PPSSPP · 已暂停",
  );
  await page.getByRole("button", { name: "继续游戏", exact: true }).click();
  await expect(page.getByTestId("emulator-status")).toHaveText(
    "PPSSPP · 已连接",
  );
  await openConnection(page);
  await page.getByRole("button", { name: "断开连接", exact: true }).click();
  expect(received.find((r) => r.event === "version").name).toBe("PPSSPP");
  expect(sent).toContainEqual({
    event: "input.analog.send",
    stick: "left",
    x: 0,
    y: 0,
  });
});
