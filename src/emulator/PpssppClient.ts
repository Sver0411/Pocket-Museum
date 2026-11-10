import type { Button } from "./protocol";
export interface PpssppReply {
  event: string;
  ticket?: number;
  message?: string;
  [key: string]: unknown;
}
const BUTTON_MAP: Record<Button, string> = {
  A: "cross",
  B: "circle",
  X: "triangle",
  Y: "square",
  L: "ltrigger",
  R: "rtrigger",
  Up: "up",
  Down: "down",
  Left: "left",
  Right: "right",
  Start: "start",
  Select: "select",
};
export function validatePpssppEndpoint(value: string) {
  const url = new URL(value);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const local =
    host === "localhost" ||
    host === "::1" ||
    /^127\.\d+\.\d+\.\d+$/.test(host) ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host);
  if (
    !["ws:", "wss:"].includes(url.protocol) ||
    !local ||
    url.username ||
    url.password ||
    url.pathname !== "/debugger" ||
    url.hash ||
    url.search
  )
    throw Error("请输入本机或局域网 PPSSPP 的 ws:// 地址");
  return url.href;
}
/** PPSSPP's actual debugger protocol; no evaluation, memory access or remote ROM loading. */
export class PpssppClient {
  private socket?: WebSocket;
  private sequence = 0;
  private pending = new Map<
    number,
    {
      resolve: (r: PpssppReply) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private held = new Set<string>();
  private intentional = false;
  constructor(
    private onState: (paused: boolean) => void,
    private onDisconnect: (reason: string) => void,
  ) {}
  async connect(endpoint: string) {
    const url = validatePpssppEndpoint(endpoint);
    const socket = new WebSocket(url, "debugger.ppsspp.org");
    this.socket = socket;
    socket.onmessage = (e) => {
      if (typeof e.data !== "string" || e.data.length > 16 * 1024 * 1024)
        return;
      let reply: PpssppReply;
      try {
        reply = JSON.parse(e.data);
      } catch {
        return;
      }
      if (!reply || typeof reply.event !== "string") return;
      if (reply.event === "cpu.stepping") this.onState(true);
      else if (reply.event === "cpu.resume") this.onState(false);
      const p =
        typeof reply.ticket === "number"
          ? this.pending.get(reply.ticket)
          : undefined;
      if (!p) return;
      clearTimeout(p.timer);
      this.pending.delete(reply.ticket!);
      if (reply.event === "error")
        p.reject(Error(reply.message || "PPSSPP 命令失败"));
      else p.resolve(reply);
    };
    socket.onclose = () => {
      this.rejectAll("模拟器连接已断开");
      if (!this.intentional) this.onDisconnect("PPSSPP 连接已断开");
    };
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.close();
        reject(Error("连接超时，请检查 PPSSPP 远程调试开关与端口"));
      }, 7000);
      socket.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      socket.onerror = () => {
        clearTimeout(timer);
        reject(Error("无法连接 PPSSPP，请确认模拟器已启动并允许远程调试"));
      };
    });
    return this.request("version", { name: "Pocket Museum", version: "0.2" });
  }
  request(event: string, fields: Record<string, unknown> = {}, timeout = 5000) {
    if (this.socket?.readyState !== WebSocket.OPEN)
      return Promise.reject(Error("模拟器未连接"));
    const ticket = ++this.sequence;
    return new Promise<PpssppReply>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(ticket);
        reject(Error(`PPSSPP 响应超时：${event}`));
      }, timeout);
      this.pending.set(ticket, { resolve, reject, timer });
      this.socket!.send(JSON.stringify({ event, ticket, ...fields }));
    });
  }
  private send(event: string, fields: Record<string, unknown> = {}) {
    if (this.socket?.readyState === WebSocket.OPEN)
      this.socket.send(JSON.stringify({ event, ...fields }));
  }
  input(button: Button, down: boolean) {
    const name = BUTTON_MAP[button];
    if (down) this.held.add(name);
    else this.held.delete(name);
    return this.request("input.buttons.send", { buttons: { [name]: down } });
  }
  analog(x: number, y: number) {
    // Browser Y points down; PPSSPP's PSP analog Y points up.
    return this.request("input.analog.send", {
      stick: "left",
      x: Math.max(-1, Math.min(1, x)),
      y: -Math.max(-1, Math.min(1, y)),
    });
  }
  releaseAll() {
    this.send("input.buttons.send", {
      buttons: Object.fromEntries([...this.held].map((b) => [b, false])),
    });
    this.held.clear();
    this.send("input.analog.send", { stick: "left", x: 0, y: 0 });
  }
  async pause(paused: boolean) {
    if (paused) this.releaseAll();
    const initial = await this.request("cpu.status");
    if (initial.stepping === paused) {
      this.onState(paused);
      return;
    }
    if (initial.paused === true && initial.stepping !== true)
      throw Error("请先在 PPSSPP 中打开程序并退出其暂停菜单");
    this.send(paused ? "cpu.stepping" : "cpu.resume");
    // These commands are deferred in both stable and dev builds. Verify actual CPU state.
    for (let i = 0; i < 35; i++) {
      const status = await this.request("cpu.status");
      if (status.stepping === paused) {
        this.onState(paused);
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    throw Error("PPSSPP 尚未完成暂停/恢复");
  }
  async pausedScreenshot() {
    const status = await this.request("cpu.status");
    if (status.stepping !== true) throw Error("请先暂停模拟器，再抓取画面");
    const r = await this.request("gpu.buffer.screenshot", {
      type: "uri",
    }).catch((e) => {
      if (e instanceof Error && e.message === "Could not download output")
        throw Error(
          "此 PPSSPP 图形后端无法抓取暂停画面，请使用窗口共享查看；模拟器保持暂停",
        );
      throw e;
    });
    if (
      typeof r.uri !== "string" ||
      !r.uri.startsWith("data:image/png;base64,")
    )
      throw Error("PPSSPP 未返回有效画面");
    return r.uri;
  }
  private rejectAll(message: string) {
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(Error(message));
    }
    this.pending.clear();
  }
  dispose() {
    this.intentional = true;
    this.releaseAll();
    this.rejectAll("模拟器连接已关闭");
    this.socket?.close();
  }
}
