import { RETROPAD } from "./protocol";
import type { Button } from "./protocol";
interface GameManager {
  simulateInput: (player: number, index: number, value: number) => void;
  getState: () => Uint8Array;
  loadState: (data: Uint8Array) => void;
  getSaveFile: () => Uint8Array | null;
  getSaveFilePath: () => string;
  loadSaveFiles: () => void;
  FS: {
    analyzePath: (p: string) => { exists: boolean };
    mkdir: (p: string) => void;
    writeFile: (p: string, b: Uint8Array) => void;
  };
}
interface Engine {
  gameManager: GameManager;
  pause: () => void;
  play: () => void;
  setVolume: (n: number) => void;
  Module?: unknown;
}
declare global {
  interface Window {
    EJS_emulator?: Engine;
    [key: `EJS_${string}`]: unknown;
  }
}
/** The only module that knows EmulatorJS internals. Pinned to upstream 4.2.3. */
export class EmulatorAdapter {
  private running = false;
  private booted = false;
  private pressed = new Set<Button>();
  async start(rom: Uint8Array, gameId: string, nativeSave?: Uint8Array) {
    if (this.booted) throw new Error("每个 iframe 只能启动一个游戏");
    this.booted = true;
    const url = URL.createObjectURL(
      new Blob([new Uint8Array(rom)], { type: "application/octet-stream" }),
    );
    // The parent owns all physical input; prevent EmulatorJS from polling it again.
    Object.defineProperty(navigator, "getGamepads", { value: () => [] });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => fail("mGBA 启动超时，请重新开机"),
        55000,
      );
      const fail = (message: string) => {
        clearTimeout(timeout);
        observer.disconnect();
        URL.revokeObjectURL(url);
        reject(new Error(message));
      };
      const observer = new MutationObserver(() => {
        const message =
          document.querySelector(".ejs_loading_text")?.textContent;
        if (message && /error|failed|unsupported/i.test(message)) fail(message);
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      Object.assign(window, {
        EJS_player: "#game",
        EJS_core: "mgba",
        EJS_gameUrl: url,
        EJS_gameName: gameId,
        EJS_pathtodata: "/vendor/emulatorjs/4.2.3/data/",
        EJS_startOnLoaded: true,
        EJS_language: "en-US",
        EJS_disableAutoLang: false,
        EJS_noAutoFocus: true,
        EJS_disableLocalStorage: true,
        EJS_disableDatabases: true,
        EJS_threads: false,
        EJS_volume: 0,
        EJS_backgroundColor: "#1b2522",
        EJS_VirtualGamepadSettings: [],
        EJS_defaultOptions: {
          shader: "disabled",
          "save-save-files-interval": 0,
          "virtual-gamepad": "disabled",
        },
        EJS_Buttons: {
          playPause: false,
          restart: false,
          mute: false,
          settings: false,
          fullscreen: false,
          saveState: false,
          loadState: false,
          screenRecord: false,
          gamepad: false,
          cheat: false,
          volume: false,
          saveSavFiles: false,
          loadSavFiles: false,
          quickSave: false,
          quickLoad: false,
          screenshot: false,
          cacheManager: false,
          exitEmulation: false,
        },
        EJS_onGameStart: () => {
          try {
            this.running = true;
            if (nativeSave?.length) this.loadNative(nativeSave);
            clearTimeout(timeout);
            observer.disconnect();
            URL.revokeObjectURL(url);
            resolve();
          } catch (e) {
            fail(e instanceof Error ? e.message : String(e));
          }
        },
      });
      const script = document.createElement("script");
      script.src = "/vendor/emulatorjs/4.2.3/data/loader.js";
      script.onerror = () => fail("无法加载 EmulatorJS 资源");
      document.body.append(script);
    });
  }
  private get engine() {
    if (!this.running || !window.EJS_emulator) throw new Error("游戏尚未启动");
    return window.EJS_emulator;
  }
  input(button: Button, pressed: boolean) {
    this.engine.gameManager.simulateInput(0, RETROPAD[button], pressed ? 1 : 0);
    if (pressed) this.pressed.add(button);
    else this.pressed.delete(button);
  }
  pause(paused: boolean) {
    if (paused) {
      for (const b of this.pressed)
        this.engine.gameManager.simulateInput(0, RETROPAD[b], 0);
      this.pressed.clear();
      this.engine.pause();
    } else this.engine.play();
  }
  volume(volume: number) {
    this.engine.setVolume(volume);
  }
  saveState() {
    return this.engine.gameManager.getState();
  }
  loadState(data: Uint8Array) {
    this.engine.gameManager.loadState(data);
  }
  saveNative() {
    return this.engine.gameManager.getSaveFile();
  }
  loadNative(data: Uint8Array) {
    const gm = this.engine.gameManager,
      path = gm.getSaveFilePath();
    const dirs = path.split("/").slice(0, -1);
    let current = "";
    for (const dir of dirs) {
      if (!dir) continue;
      current += "/" + dir;
      if (!gm.FS.analyzePath(current).exists) gm.FS.mkdir(current);
    }
    gm.FS.writeFile(path, data);
    gm.loadSaveFiles();
  }
}
