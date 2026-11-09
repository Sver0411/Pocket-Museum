import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpFromLine,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FolderOpen,
  Gamepad2,
  Layers,
  Maximize2,
  Pause,
  Play,
  Plus,
  Power,
  RotateCcw,
  Save,
  ShieldCheck,
  Sun,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { DEVICES, deviceById } from "./devices";
import type { DeviceId } from "./devices";
import { useNativeSystem } from "./systems/useNativeSystem";
import { NativeScreen } from "./systems/NativeScreen";
import { MediaImport } from "./components/MediaImport";
import { Console } from "./components/Console";
import type { Status } from "./components/Console";
import { EmulatorBridge } from "./emulator/EmulatorBridge";
import type { Button } from "./emulator/protocol";
import {
  InputController,
  KEY_MAP,
  readGamepads,
} from "./input/InputController";
import { identify, importRom, storage } from "./storage/database";
import type { Game } from "./storage/database";
declare global {
  interface Window {
    __POCKETSP_STANDALONE__?: boolean;
    __POCKETSP_DEVICE__?: DeviceId;
    __POCKETSP_COLLECTION__?: boolean;
  }
}
const STANDALONE = window.__POCKETSP_STANDALONE__ === true;
const COLLECTION = window.__POCKETSP_COLLECTION__ === true;
const STATUS: Record<Status, string> = {
  off: "电源关闭",
  loading: "正在加载",
  running: "正在运行",
  paused: "已暂停",
  error: "启动失败",
};
function download(data: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(data)]));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function App() {
  const [deviceId, setDeviceId] = useState<DeviceId>(
    window.__POCKETSP_DEVICE__ || "sp",
  );
  const device = deviceById(deviceId),
    deviceRef = useRef<DeviceId>(deviceId);
  deviceRef.current = deviceId;
  const [games, setGames] = useState<Game[]>([]),
    [game, setGame] = useState<Game>(),
    [status, setStatus] = useState<Status>("off");
  const [pressed, setPressed] = useState(new Set<Button>()),
    [closed, setClosed] = useState(false),
    [flat, setFlat] = useState(false),
    [light, setLight] = useState(true),
    [muted, setMuted] = useState(true),
    [volume, setVolume] = useState(60);
  const [session, setSession] = useState(() => crypto.randomUUID()),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [help, setHelp] = useState(false),
    [pads, setPads] = useState(0),
    [hasState, setHasState] = useState(false),
    [busy, setBusy] = useState(false),
    [libraryOpen, setLibraryOpen] = useState(false),
    [hydrated, setHydrated] = useState(false);
  const bridge = useRef<EmulatorBridge | null>(null),
    statusRef = useRef(status),
    gameRef = useRef(game),
    mounted = useRef(true),
    operation = useRef(false),
    toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined),
    booting = useRef<string | undefined>(undefined),
    closedRef = useRef(closed),
    foldResume = useRef<Status | null>(null),
    soundRef = useRef({ muted, volume }),
    helpRef = useRef(help),
    focused = useRef(true);
  statusRef.current = status;
  gameRef.current = game;
  closedRef.current = closed;
  soundRef.current = { muted, volume };
  helpRef.current = help;
  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  }, []);
  const report = useCallback((e: unknown) => {
    if (mounted.current) setError(e instanceof Error ? e.message : String(e));
  }, []);
  const native = useNativeSystem(
    deviceId,
    ["running", "paused"].includes(status) &&
      (!["sp", "gba"].includes(deviceId) || !game || STANDALONE),
    status !== "running" || closed || help || libraryOpen,
  );
  const nativeRef = useRef(native);
  nativeRef.current = native;
  const input = useRef(
    new InputController(
      (button, down) => {
        if (
          statusRef.current === "running" &&
          ["sp", "gba"].includes(deviceRef.current)
        )
          void bridge.current?.input(button, down).catch(report);
        if (!bridge.current) nativeRef.current.button(button, down);
      },
      (_pressed, visual) => setPressed(visual),
    ),
  ).current;
  const persistNative = useCallback(async () => {
    const b = bridge.current,
      g = gameRef.current;
    if (!b || !g || !["running", "paused"].includes(statusRef.current)) return;
    const data = await b.saveNative();
    if (data?.length) {
      await storage.putSave(g.id, "native", data);
    }
    return data;
  }, []);
  useEffect(() => {
    mounted.current = true;
    void (async () => {
      try {
        if (STANDALONE) {
          setHydrated(true);
          return;
        }
        const response = await fetch("/roms/2048.gba");
        if (!response.ok) throw new Error("演示游戏加载失败");
        const bytes = new Uint8Array(await response.arrayBuffer());
        const demo: Game = {
          id: await identify(bytes),
          name: "2048 Advance",
          bytes,
          demo: true,
          importedAt: 0,
        };
        const [imported, selected, config] = await Promise.all([
          storage.games(),
          storage.getSetting<string>("selectedGame"),
          storage.getSetting<{
            light: boolean;
            muted: boolean;
            volume: number;
          }>("display"),
        ]);
        if (!mounted.current) return;
        const list = [demo, ...imported.filter((g) => g.id !== demo.id)];
        setGames(list);
        setGame(list.find((g) => g.id === selected));
        if (config) {
          setLight(config.light);
          setMuted(config.muted);
          setVolume(config.volume);
        }
        setHydrated(true);
      } catch (e) {
        report(e);
      }
    })();
    return () => {
      mounted.current = false;
      input.setEnabled(false);
      bridge.current?.dispose();
      clearTimeout(toastTimer.current);
    };
  }, [input, report]);
  useEffect(() => {
    if (!game) return;
    void Promise.all([storage.getSave(game.id, "state")])
      .then(([state]) => {
        if (gameRef.current?.id === game.id) {
          setHasState(!!state);
        }
      })
      .catch(report);
  }, [game, report]);
  useEffect(() => {
    input.releaseAll();
    input.setEnabled(status !== "loading" && !closed && !help && !libraryOpen);
  }, [status, closed, help, libraryOpen, input, deviceId]);
  useEffect(() => {
    if (!hydrated || STANDALONE) return;
    void storage.putSetting("display", { light, muted, volume }).catch(report);
    if (bridge.current && ["running", "paused"].includes(status))
      void bridge.current.volume(muted ? 0 : volume / 100).catch(report);
  }, [light, muted, volume, status, hydrated, report]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        statusRef.current !== "running" ||
        closedRef.current ||
        helpRef.current
      )
        return;
      if (
        e.target instanceof HTMLElement &&
        (e.target.closest(
          "input,textarea,select,[role=dialog],.analog-stick",
        ) ||
          e.target.isContentEditable)
      )
        return;
      if (
        e.target instanceof HTMLElement &&
        e.target.closest(
          ".hardware-key,.hardware-utility,.native-screen button",
        ) &&
        ["Enter", "Space"].includes(e.code)
      )
        return;
      const button = KEY_MAP[e.code];
      if (button) {
        e.preventDefault();
        if (!e.repeat) input.set(`key:${e.code}`, button, e.type === "keydown");
      }
    };
    const blur = () => {
      focused.current = false;
      input.releaseAll();
    };
    const focus = () => {
      focused.current = true;
    };
    const hidden = () => {
      if (document.hidden) {
        blur();
        void persistNative().catch(report);
      }
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", hidden);
    let raf = 0,
      lastPads = -1;
    const poll = () => {
      const count = readGamepads(
        focused.current && !document.hidden
          ? navigator.getGamepads?.() || []
          : [],
        input,
      ).length;
      if (count !== lastPads) {
        lastPads = count;
        setPads(count);
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", hidden);
      cancelAnimationFrame(raf);
    };
  }, [input, persistNative, report]);
  useEffect(() => {
    if (!["running", "paused"].includes(status)) return;
    const timer = setInterval(() => void persistNative().catch(report), 5000);
    return () => clearInterval(timer);
  }, [status, persistNative, report]);
  const stop = async () => {
    input.setEnabled(false);
    try {
      await persistNative();
    } catch (e) {
      input.setEnabled(statusRef.current === "running");
      throw e;
    }
    bridge.current?.dispose();
    bridge.current = null;
    booting.current = undefined;
    setStatus("off");
    statusRef.current = "off";
    foldResume.current = null;
  };
  const guarded = async (action: () => Promise<void>) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      report(e);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };
  useEffect(() => {
    if (native.state.shutdown) void guarded(stop);
  }, [native.state.shutdown]);
  const power = () =>
    void guarded(async () => {
      if (statusRef.current !== "off" && statusRef.current !== "error") {
        await stop();
        notify(
          bridge.current &&
            ["sp", "gba"].includes(deviceRef.current) &&
            !STANDALONE
            ? "已保存原生存档 · 电源关闭"
            : "电源关闭",
        );
        return;
      }
      if (
        !["sp", "gba"].includes(deviceRef.current) ||
        STANDALONE ||
        !gameRef.current
      ) {
        setClosed(false);
        setStatus("running");
        statusRef.current = "running";
        return;
      }
      bridge.current?.dispose();
      bridge.current = null;
      booting.current = undefined;
      setClosed(false);
      setSession(crypto.randomUUID());
      setStatus("loading");
      statusRef.current = "loading";
    });
  const onFrame = async (frame: HTMLIFrameElement) => {
    if (statusRef.current !== "loading" || booting.current === session) return;
    booting.current = session;
    const b = new EmulatorBridge(frame, session);
    bridge.current = b;
    const selected = gameRef.current;
    if (!selected) return;
    try {
      const native = await storage.getSave(selected.id, "native");
      await b.start(selected.bytes, selected.id, native?.data);
      if (bridge.current !== b) return;
      const s = soundRef.current;
      await b.volume(s.muted ? 0 : s.volume / 100);
      if (closedRef.current) await b.pause(true);
      setStatus(closedRef.current ? "paused" : "running");
      notify(native ? "原生存档已恢复" : "游戏已就绪 · 按 A / Start 开始");
    } catch (e) {
      if (bridge.current === b) {
        setStatus("error");
        report(e);
        b.dispose();
        bridge.current = null;
      }
    }
  };
  const selectGame = (next: Game) =>
    void guarded(async () => {
      if (next.id === game?.id) return;
      await stop();
      setGame(next);
      setHasState(false);
      await storage.putSetting("selectedGame", next.id);
      notify(`已插入 ${next.name}`);
    });
  const importFile = (file?: File) => {
    if (file)
      void guarded(async () => {
        const imported = await importRom(file);
        await storage.putGame(imported);
        await stop();
        setGames((list) => [
          ...list.filter((g) => g.id !== imported.id),
          imported,
        ]);
        setGame(imported);
        await storage.putSetting("selectedGame", imported.id);
        notify("游戏已导入 · 文件仅保存在本机");
      });
  };
  const pause = () =>
    void guarded(async () => {
      const next = status === "running";
      if (
        !["sp", "gba"].includes(deviceRef.current) ||
        STANDALONE ||
        !gameRef.current
      ) {
        input.releaseAll();
        setStatus(next ? "paused" : "running");
        return;
      }
      if (!bridge.current) return;
      input.setEnabled(false);
      await bridge.current.pause(next);
      setStatus(next ? "paused" : "running");
    });
  const fold = () =>
    void guarded(async () => {
      const next = !closedRef.current;
      input.releaseAll();
      if (device.sleepOnClose) {
        if (next) {
          foldResume.current = statusRef.current;
          if (statusRef.current === "running") {
            await bridge.current?.pause(true);
            setStatus("paused");
          }
        } else {
          if (
            foldResume.current === "running" &&
            statusRef.current === "paused"
          ) {
            await bridge.current?.pause(false);
            setStatus("running");
          }
          foldResume.current = null;
        }
      }
      setClosed(next);
    });
  const quickSave = () =>
    void guarded(async () => {
      const b = bridge.current,
        g = game;
      if (!b || !g) return;
      const data = await b.saveState();
      if (!data?.length) throw new Error("模拟器未返回即时存档");
      await storage.putSave(g.id, "state", data);
      setHasState(true);
      notify("即时存档已保存 · 槽位 01");
    });
  const quickLoad = () =>
    void guarded(async () => {
      if (!game || !bridge.current) return;
      const save = await storage.getSave(game.id, "state");
      if (!save) throw new Error("这个游戏还没有即时存档");
      input.releaseAll();
      await bridge.current.loadState(save.data);
      notify("即时存档已读取");
    });
  const switchDevice = (id: DeviceId) =>
    void guarded(async () => {
      if (id === deviceId) return;
      await stop();
      setClosed(false);
      setFlat(false);
      setDeviceId(id);
      setError("");
    });
  const ready = ["running", "paused"].includes(status),
    powered = status !== "off" && status !== "error";
  return (
    <div className={`app studio-app`}>
      <header className="studio-header">
        <a
          href={STANDALONE ? undefined : "/"}
          className="studio-brand"
          aria-label="Pocket Museum 首页"
        >
          <svg
            width="35"
            height="43"
            viewBox="0 0 35 43"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="2"
              width="27"
              height="39"
              rx="5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="8"
              y="6"
              width="19"
              height="14"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M4 24h27M10 30h7m-3.5-3.5v7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="24" cy="29" r="1.5" fill="currentColor" />
            <circle cx="20" cy="33" r="1.5" fill="currentColor" />
          </svg>
          <span>
            <b>
              {STANDALONE && !COLLECTION ? (
                device.label
              ) : (
                <>
                  Pocket <span>Museum</span>
                </>
              )}
            </b>
          </span>
        </a>
        {(!STANDALONE || COLLECTION) && (
          <nav className="handheld-switcher" aria-label="切换掌机">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                aria-pressed={deviceId === d.id}
                onClick={() => switchDevice(d.id)}
                disabled={busy || status === "loading"}
              >
                {d.label}
              </button>
            ))}
          </nav>
        )}
        <button
          className="help-button"
          onClick={() => setHelp(true)}
          aria-label="使用指南"
        >
          <CircleHelp size={19} />
        </button>
      </header>
      <main className="studio-main">
        <aside className="control-rail">
          <div className="rail-heading">
            <Gamepad2 size={22} />
            <h1>操作方法</h1>
          </div>
          <div className="control-legend">
            <div className="direction-legend">
              <span className="arrow-keys">
                <kbd>↑</kbd>
                <kbd>↓</kbd>
                <kbd>←</kbd>
                <kbd>→</kbd>
              </span>
              <span>移动</span>
            </div>
            <div>
              <span>
                <kbd>X</kbd>
              </span>
              <span>{device.faceLabels?.A || "A"} 键</span>
            </div>
            <div>
              <span>
                <kbd>Z</kbd>
              </span>
              <span>{device.faceLabels?.B || "B"} 键</span>
            </div>
            <div>
              <span>
                <kbd>Q</kbd>
                <kbd>E</kbd>
              </span>
              <span>L / R 肩键</span>
            </div>
            <div>
              <kbd className="wide">Enter</kbd>
              <span>START</span>
            </div>
            <div>
              <kbd className="wide">Shift</kbd>
              <span>SELECT</span>
            </div>
          </div>
          {device.keys.some((k) => k.button === "X") && (
            <div className="extra-key-legend">
              <span>
                <kbd>C</kbd> / <kbd>V</kbd>
              </span>
              <span>
                {device.faceLabels?.X || "X"} / {device.faceLabels?.Y || "Y"}
              </span>
            </div>
          )}
          <div className={`gamepad-status ${pads ? "connected" : ""}`}>
            <i />
            <span>
              {pads ? `已连接 ${pads} 个手柄` : "支持键盘、触摸与手柄"}
            </span>
          </div>
        </aside>
        <section className="play-space" aria-label="掌机游玩区">
          <div className="studio-halo" />
          <div className="studio-floor" />
          <Console
            key={deviceId}
            cancelToken={`${help}:${libraryOpen}:${flat}`}
            device={device}
            emulate={!STANDALONE && !!game}
            nativeScreen={(index) => (
              <NativeScreen
                state={native.state}
                chat={native.chat}
                volume={muted ? 0 : volume / 100}
                dispatch={native.dispatch}
                screen={index}
                onPowerOff={() => void guarded(stop)}
              />
            )}
            status={status}
            pressed={pressed}
            input={input}
            closed={closed}
            flat={flat}
            light={light}
            onLight={() => setLight(!light)}
            onPower={power}
            onFold={fold}
            foldDisabled={busy}
            onLidMotion={() => input.releaseAll()}
            onMenu={() => {
              if (statusRef.current === "running")
                native.dispatch({ type: "home" });
            }}
            onVolume={(delta) => {
              const next = Math.min(
                100,
                Math.max(0, (muted ? 0 : volume) + delta),
              );
              setVolume(next);
              setMuted(next === 0);
            }}
            onMute={() => setMuted(!muted)}
            session={session}
            onFrame={(frame) => void onFrame(frame)}
          />
        </section>
        <aside className="settings-rail">
          <div className="rail-heading">
            <Sun size={21} />
            <h2>掌机设置</h2>
          </div>
          <div className="sound-control">
            <button
              className="sound-toggle"
              onClick={() => setMuted(!muted)}
              aria-label={muted ? "开启声音" : "静音"}
            >
              {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>
            <div>
              <span>音量</span>
              <input
                className="volume-slider"
                type="range"
                aria-label="游戏音量"
                min="0"
                max="100"
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(+e.target.value);
                  setMuted(+e.target.value === 0);
                }}
              />
            </div>
            <small>{muted ? "0" : volume}</small>
          </div>
          <button
            className="setting-row"
            onClick={() => setLight(!light)}
            aria-pressed={light}
          >
            <span>
              <Sun size={20} />
              {deviceId === "sp" ? "屏幕前光" : "屏幕亮度"}
            </span>
            <span className={`toggle ${light ? "active" : ""}`}>
              <i />
            </span>
          </button>
          {device.lid && (
            <button
              className="setting-row"
              onClick={fold}
              disabled={busy}
              aria-label={closed ? "打开上盖" : "合上上盖"}
            >
              <span>
                <Layers size={20} />
                {closed ? "打开上盖" : "合上上盖"}
              </span>
              <ChevronRight
                className={closed ? "rotate-arrow" : ""}
                size={15}
              />
            </button>
          )}
          {device.lid && (
            <button
              className="setting-row"
              aria-label={flat ? "恢复半展开" : "完全展开"}
              aria-pressed={flat}
              disabled={busy || closed}
              onClick={() => {
                input.releaseAll();
                setFlat((v) => !v);
              }}
            >
              <span>
                <Maximize2 size={20} />
                {flat ? "恢复半展开" : "完全展开"}
              </span>
              <ChevronRight size={15} />
            </button>
          )}
          <button
            className="setting-row"
            onClick={() => {
              if (document.fullscreenElement) {
                void document.exitFullscreen().catch(report);
              } else
                void document.documentElement.requestFullscreen().catch(report);
            }}
            aria-label="全屏"
          >
            <span>
              <Maximize2 size={20} />
              全屏
            </span>
            <ChevronRight size={15} />
          </button>
          {["3ds", "psp", "vita"].includes(deviceId) && (
            <MediaImport device={deviceId} onDone={notify} onError={report} />
          )}
          <div className="rail-separator" />
          <button
            className="setting-row"
            onClick={pause}
            disabled={!ready || busy || closed}
            aria-label={status === "paused" ? "继续游戏" : "暂停游戏"}
          >
            <span>
              {status === "paused" ? <Play size={20} /> : <Pause size={20} />}
              {status === "paused" ? "继续游戏" : "暂停游戏"}
            </span>
          </button>
          <button
            className="setting-row"
            onClick={quickSave}
            disabled={
              !ready || busy || !["sp", "gba"].includes(deviceId) || STANDALONE
            }
          >
            <span>
              <Save size={20} />
              即时存档
            </span>
          </button>
          <button
            className="setting-row"
            onClick={quickLoad}
            disabled={
              !ready ||
              !hasState ||
              busy ||
              !["sp", "gba"].includes(deviceId) ||
              STANDALONE
            }
          >
            <span>
              <RotateCcw size={19} />
              读取存档
            </span>
            {hasState && <i className="state-dot" />}
          </button>
        </aside>
      </main>
      <div className="studio-dock">
        <button
          className={`power-button ${powered ? "powered" : ""}`}
          onClick={power}
          disabled={busy || !hydrated || status === "loading"}
          aria-label={powered ? "关闭电源" : "开启电源"}
        >
          <Power size={17} />
          <span>{powered ? "关闭电源" : "开启电源"}</span>
        </button>
        <span className="dock-divider" />
        <button
          className="cartridge-button"
          aria-label="选择卡带"
          disabled={!["sp", "gba"].includes(deviceId) || STANDALONE}
          onClick={() => setLibraryOpen(true)}
        >
          <FolderOpen size={17} />
          <span>{game ? "更换卡带" : "选择卡带"}</span>
          <ChevronDown size={12} />
        </button>
        {["sp", "gba"].includes(deviceId) && game && !STANDALONE && (
          <button
            className="eject-button"
            onClick={() =>
              void guarded(async () => {
                await stop();
                setGame(undefined);
                await storage.putSetting("selectedGame", "");
              })
            }
          >
            拔出卡带
          </button>
        )}
        <span className="dock-divider" />
        <span
          className={`status-chip ${status}`}
          role="status"
          data-testid="emulator-status"
        >
          <i />
          {(!["sp", "gba"].includes(deviceId) || STANDALONE || !game) &&
          status === "running"
            ? "系统运行"
            : STATUS[status]}
        </span>
      </div>
      {!STANDALONE && (
        <a
          className="standalone-link"
          href={`/standalone/${deviceId}.html`}
          download
        >
          单文件版 <ArrowUpFromLine size={13} />
        </a>
      )}
      {error && (
        <div className="error-banner" role="alert">
          <CircleHelp size={17} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="关闭错误提示">
            <X size={15} />
          </button>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {libraryOpen && (
        <div className="modal-backdrop" onClick={() => setLibraryOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="选择卡带"
            className="library-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.code === "Escape") setLibraryOpen(false);
            }}
          >
            <button
              className="modal-close"
              onClick={() => setLibraryOpen(false)}
              aria-label="关闭卡带库"
              autoFocus
            >
              <X size={20} />
            </button>
            <h2>选择一张卡带</h2>
            <p>导入本地 .gba 文件，或使用开源演示卡带。</p>
            <div className="game-list">
              {games.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    selectGame(g);
                    setLibraryOpen(false);
                  }}
                  disabled={busy || status === "loading"}
                  className={`game-card ${game?.id === g.id ? "selected" : ""}`}
                  aria-pressed={game?.id === g.id}
                >
                  <span className="cartridge-art">
                    <Gamepad2 size={28} />
                  </span>
                  <span>
                    <h3>{g.name}</h3>
                    <small>
                      {g.demo ? "开源演示 · CC0" : "本地卡带 · GBA"}
                    </small>
                  </span>
                  {game?.id === g.id ? (
                    <Check size={17} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              ))}
            </div>
            <label
              className={`import-button ${busy || status === "loading" ? "disabled" : ""}`}
            >
              <Plus size={18} />
              导入 .gba 文件
              <input
                aria-label="导入 GBA 游戏"
                type="file"
                accept=".gba"
                disabled={busy || status === "loading"}
                onChange={(e) => {
                  importFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="library-native">
              <button
                disabled={
                  !ready ||
                  busy ||
                  !["sp", "gba"].includes(deviceId) ||
                  STANDALONE
                }
                onClick={() =>
                  void guarded(async () => {
                    const data = await persistNative();
                    if (!data?.length)
                      throw new Error("尚无原生存档，请先在游戏内保存");
                    download(data, `${game?.name}.sav`);
                    notify("原生存档已导出");
                  })
                }
              >
                <ArrowUpFromLine size={14} />
                导出 .sav
              </button>
              <label className={!ready || busy ? "disabled" : ""}>
                <FolderOpen size={14} />
                导入 .sav
                <input
                  aria-label="导入原生存档"
                  type="file"
                  accept=".sav,.srm"
                  disabled={
                    !ready ||
                    busy ||
                    !["sp", "gba"].includes(deviceId) ||
                    STANDALONE
                  }
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      void guarded(async () => {
                        if (file.size === 0 || file.size > 1024 * 1024)
                          throw new Error("存档大小无效");
                        const data = new Uint8Array(await file.arrayBuffer());
                        await bridge.current?.loadNative(data);
                        await storage.putSave(game!.id, "native", data);
                        notify("原生存档已导入，重新开机后读取");
                      });
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="library-note">
              <ShieldCheck size={14} />
              最大 32 MB · 卡带与存档仅保存在当前浏览器
            </p>
            <a href="/licenses/NOTICE.md" target="_blank" rel="noreferrer">
              游戏来源与开源许可 ↗
            </a>
          </section>
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Pocket Museum 使用指南"
            className="help-modal"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.code === "Escape") setHelp(false);
            }}
          >
            <button
              className="modal-close"
              onClick={() => setHelp(false)}
              autoFocus
              aria-label="关闭使用指南"
            >
              <X size={20} />
            </button>
            <h2>打开，按下，开始。</h2>
            <p>
              {STANDALONE || !["sp", "gba"].includes(deviceId)
                ? "开机后进入当前机型的无卡启动页或系统界面。DS / 3DS 的下屏和 Vita 屏幕支持触摸，HOME / PS 键按各自系统流程返回。"
                : "选择卡带或导入你有权使用的 .gba 游戏，然后按下电源。屏幕在关机时保持空白。"}
            </p>
            <ol>
              <li>
                <b>掌机操作</b>
                <p>
                  方向键或 WASD 移动，X / Z 对应 A / B，Q / E 对应 L / R，Enter
                  是 Start，Shift 是 Select。鼠标或触摸可以直接按机身按钮。
                </p>
              </li>
              {!STANDALONE && ["sp", "gba"].includes(deviceId) && (
                <li>
                  <b>游戏存档</b>
                  <p>
                    即时存档保存完整运行状态。原生存档需要先在游戏内保存，每 5
                    秒同步到当前浏览器；正常关机也会同步。卡带菜单中可以导入、导出
                    .sav 文件。
                  </p>
                </li>
              )}
              <li>
                <b>连接手柄</b>
                <p>
                  连接标准手柄并按任意键激活。左摇杆 / 十字键移动，底部面键为
                  A，右侧面键为 B，肩键为 L / R。
                </p>
              </li>
            </ol>
            <p className="help-note">
              声音默认静音。合盖会暂停运行。清除浏览器数据会移除卡带和存档，请导出备份。
            </p>
            {!STANDALONE && (
              <a href="/licenses/NOTICE.md" target="_blank" rel="noreferrer">
                开源许可与来源 ↗
              </a>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
