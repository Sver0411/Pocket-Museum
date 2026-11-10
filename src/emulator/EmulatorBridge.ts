import type { GameSystem } from "./systems";
import { CHANNEL } from "./protocol";
import type { Button, Command, Response } from "./protocol";
export class EmulatorBridge {
  private sequence = 0;
  private pending = new Map<
    number,
    {
      resolve: (v: Uint8Array | null | undefined) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private disposed = false;
  constructor(
    private frame: HTMLIFrameElement,
    private session: string,
  ) {
    window.addEventListener("message", this.receive);
  }
  private receive = (event: MessageEvent<Response>) => {
    const r = event.data;
    if (
      event.origin !== location.origin ||
      event.source !== this.frame.contentWindow ||
      r?.channel !== CHANNEL ||
      r.session !== this.session
    )
      return;
    const p = this.pending.get(r.id);
    if (!p) return;
    clearTimeout(p.timer);
    this.pending.delete(r.id);
    if (r.ok) p.resolve(r.data);
    else p.reject(new Error(r.error || "模拟器命令失败"));
  };
  request(
    command: Command,
    timeout = 10000,
  ): Promise<Uint8Array | null | undefined> {
    if (this.disposed) return Promise.reject(new Error("模拟器连接已关闭"));
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("模拟器响应超时，请重新开机"));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.frame.contentWindow?.postMessage(
        { channel: CHANNEL, session: this.session, id, command },
        location.origin,
      );
    });
  }
  async start(
    rom: Uint8Array,
    gameId: string,
    nativeSave?: Uint8Array,
    system: GameSystem = "gba",
  ) {
    await this.request({ type: "hello" });
    await this.request(
      { type: "start", rom, gameId, nativeSave, system },
      60000,
    );
  }
  input(button: Button, pressed: boolean) {
    return this.request({ type: "input", button, pressed });
  }
  touch(x: number, y: number, down: boolean) {
    return this.request({ type: "touch", x, y, down });
  }
  pause(paused: boolean) {
    return this.request({ type: "pause", paused });
  }
  volume(volume: number) {
    return this.request({ type: "volume", volume });
  }
  saveState() {
    return this.request({ type: "save-state" });
  }
  loadState(data: Uint8Array) {
    return this.request({ type: "load-state", data });
  }
  saveNative() {
    return this.request({ type: "save-native" });
  }
  loadNative(data: Uint8Array) {
    return this.request({ type: "load-native", data });
  }
  dispose() {
    this.disposed = true;
    window.removeEventListener("message", this.receive);
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error("模拟器连接已关闭"));
    }
    this.pending.clear();
  }
}
