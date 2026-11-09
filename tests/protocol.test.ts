import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isCommand, CHANNEL } from "../src/emulator/protocol";
import { EmulatorBridge } from "../src/emulator/EmulatorBridge";
describe("iframe protocol", () => {
  it("rejects arbitrary buttons, malformed buffers, invalid volume and unknown commands", () => {
    expect(isCommand({ type: "input", button: "Turbo", pressed: true })).toBe(
      false,
    );
    expect(isCommand({ type: "start", rom: "https://evil", gameId: "x" })).toBe(
      false,
    );
    expect(isCommand({ type: "volume", volume: NaN })).toBe(false);
    expect(isCommand({ type: "load-state", data: new Uint8Array() })).toBe(
      false,
    );
    expect(isCommand({ type: "evaluate", code: "alert(1)" })).toBe(false);
    expect(isCommand({ type: "input", button: "A", pressed: true })).toBe(true);
  });
  let target: EventTarget;
  beforeEach(() => {
    target = new EventTarget();
    vi.stubGlobal("window", target);
    vi.stubGlobal("location", { origin: "http://localhost:5173" });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("accepts replies only from the selected frame, origin and session", async () => {
    const frameWindow = { postMessage: vi.fn() },
      bridge = new EmulatorBridge(
        { contentWindow: frameWindow } as unknown as HTMLIFrameElement,
        "session",
      );
    const promise = bridge.saveState();
    const reply = (origin: string, source: unknown, session: string) => {
      const e = new Event("message");
      Object.assign(e, {
        origin,
        source,
        data: {
          channel: CHANNEL,
          session,
          id: 1,
          ok: true,
          data: new Uint8Array([9]),
        },
      });
      target.dispatchEvent(e);
    };
    let completed = false;
    void promise.then(() => (completed = true));
    reply("http://evil", frameWindow, "session");
    reply("http://localhost:5173", {}, "session");
    reply("http://localhost:5173", frameWindow, "old-session");
    await Promise.resolve();
    expect(completed).toBe(false);
    reply("http://localhost:5173", frameWindow, "session");
    expect(await promise).toEqual(new Uint8Array([9]));
    bridge.dispose();
  });
  it("times out missing replies and cancels pending work on disposal", async () => {
    vi.useFakeTimers();
    const b = new EmulatorBridge(
      {
        contentWindow: { postMessage: vi.fn() },
      } as unknown as HTMLIFrameElement,
      "s",
    );
    const p = b.request({ type: "hello" }, 100);
    const assertion = expect(p).rejects.toThrow("响应超时");
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    const q = b.saveState();
    b.dispose();
    await expect(q).rejects.toThrow("连接已关闭");
    vi.useRealTimers();
  });
});
