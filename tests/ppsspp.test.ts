import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PpssppClient,
  validatePpssppEndpoint,
} from "../src/emulator/PpssppClient";

class DebuggerSocket {
  static OPEN = 1;
  static latest: DebuggerSocket;
  readyState = 1;
  onopen?: () => void;
  onerror?: () => void;
  onclose?: () => void;
  onmessage?: (e: { data: string }) => void;
  sent: Record<string, any>[] = [];
  stepping = false;
  constructor(
    public url: string,
    public protocol: string,
  ) {
    DebuggerSocket.latest = this;
    queueMicrotask(() => this.onopen?.());
  }
  send(data: string) {
    const r = JSON.parse(data);
    this.sent.push(r);
    if (r.event === "cpu.stepping" || r.event === "cpu.resume") {
      this.stepping = r.event === "cpu.stepping";
      // Real PPSSPP broadcasts without the request ticket.
      queueMicrotask(() => this.reply({ event: r.event }));
      return;
    }
    if (!r.ticket || r.event === "no.reply") return;
    const fields =
      r.event === "version"
        ? { name: "PPSSPP", version: "v1.20.4" }
        : r.event === "cpu.status"
          ? { stepping: this.stepping }
          : r.event === "bad.command"
            ? { event: "error", message: "Unsupported event" }
            : r.event === "gpu.buffer.screenshot"
              ? { uri: "data:image/png;base64,AAAA" }
              : {};
    queueMicrotask(() => this.reply({ ...r, ...fields }));
  }
  reply(r: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify(r) });
  }
  close() {
    this.readyState = 3;
    queueMicrotask(() => this.onclose?.());
  }
}
afterEach(() => vi.unstubAllGlobals());
async function connect() {
  vi.stubGlobal("WebSocket", DebuggerSocket);
  const state = vi.fn(),
    lost = vi.fn(),
    client = new PpssppClient(state, lost);
  const version = await client.connect("ws://127.0.0.1:27312/debugger");
  return { client, state, lost, version, socket: DebuggerSocket.latest };
}
describe("optional local PPSSPP connection", () => {
  it("requires an actual local debugger endpoint, rejecting lookalike public hosts", () => {
    for (const host of [
      "127.0.0.1",
      "localhost",
      "[::1]",
      "192.168.1.2",
      "172.31.9.1",
      "10.0.0.8",
    ])
      expect(validatePpssppEndpoint(`ws://${host}:27312/debugger`)).toContain(
        "/debugger",
      );
    for (const endpoint of [
      "https://localhost/debugger",
      "ws://10.evil.org/debugger",
      "ws://127.attacker.org/debugger",
      "ws://172.32.0.1/debugger",
      "ws://localhost/other",
      "ws://user:pass@localhost/debugger",
      "ws://localhost/debugger?cmd=1",
    ])
      expect(() => validatePpssppEndpoint(endpoint)).toThrow();
  });
  it("negotiates the official subprotocol and releases held buttons and analog before disconnect", async () => {
    const { client, socket, version, lost } = await connect();
    expect(socket.protocol).toBe("debugger.ppsspp.org");
    expect(version.name).toBe("PPSSPP");
    await client.input("A", true);
    await client.input("L", true);
    await client.analog(0.5, -0.8);
    expect(socket.sent).toContainEqual(
      expect.objectContaining({
        event: "input.analog.send",
        x: 0.5,
        y: 0.8,
        stick: "left",
      }),
    );
    client.dispose();
    expect(socket.sent.slice(-2)).toEqual([
      {
        event: "input.buttons.send",
        buttons: { cross: false, ltrigger: false },
      },
      { event: "input.analog.send", stick: "left", x: 0, y: 0 },
    ]);
    await Promise.resolve();
    expect(lost).not.toHaveBeenCalled();
  });
  it("waits for CPU state rather than a nonexistent deferred-command ticket reply", async () => {
    const { client, state, socket } = await connect();
    await expect(client.pausedScreenshot()).rejects.toThrow("先暂停");
    await client.pause(true);
    expect(state).toHaveBeenLastCalledWith(true);
    expect(await client.pausedScreenshot()).toMatch(/^data:image\/png/);
    await client.pause(false);
    expect(state).toHaveBeenLastCalledWith(false);
    expect(socket.sent.filter((r) => r.event === "cpu.resume")).toHaveLength(1);
    client.dispose();
  });
  it("surfaces server errors, timeouts and unexpected socket loss", async () => {
    const { client, socket, lost } = await connect();
    await expect(client.request("bad.command")).rejects.toThrow(
      "Unsupported event",
    );
    await expect(client.request("no.reply", {}, 10)).rejects.toThrow(
      "响应超时",
    );
    const pending = client.request("no.reply");
    socket.close();
    await expect(pending).rejects.toThrow("连接已断开");
    expect(lost).toHaveBeenCalledOnce();
    client.dispose();
  });
});
