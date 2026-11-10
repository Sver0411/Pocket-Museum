import { FocusControls } from "./components/FocusControls";
import { PpssppClient } from "./emulator/PpssppClient";
import {
  DevicePresentation,
  KeyboardLegend,
} from "./presentations/DevicePresentation";
import { ThemeBackdrop } from "./components/ThemeBackdrop";
import { ExternalScreen } from "./components/ExternalScreen";
import type { CaptureCrop } from "./components/ExternalScreen";
import {
  clearSystemResources,
  importSystemResources,
  restoreSystemResources,
  useSystemResources,
} from "./systems/resources";
import {
  DEVICE_ADAPTERS,
  acceptsGame,
  coreFor,
  DEMOS,
  gameSystem,
} from "./emulator/systems";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpFromLine,
  ArrowLeft,
  SlidersHorizontal,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FolderOpen,
  Gamepad2,
  Layers,
  Maximize2,
  Minimize2,
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
import { audioManager, SOUND_PRESETS } from "./audio/AudioManager";
import { MuseumHome } from "./components/MuseumHome";
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
interface DisplayProfile {
  light: boolean;
  muted: boolean;
  volume: number;
  hardware: Record<string, number>;
  headphones: boolean;
}
function defaultDisplay(): DisplayProfile {
  return {
    light: true,
    muted: true,
    volume: 60,
    hardware: { contrast: 65, depth: 0 },
    headphones: false,
  };
}
function routeDevice(): DeviceId | undefined {
  const id = location.hash.match(/^#\/play\/([a-z0-9]+)$/)?.[1];
  return DEVICES.find((d) => d.id === id)?.id;
}
export default function App() {
  const [inMuseum, setInMuseum] = useState(
    !(STANDALONE && !COLLECTION) && !routeDevice(),
  );
  const [toolsOpen, setToolsOpen] = useState(false);
  const [focusPlay, setFocusPlay] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false),
    [externalVersion, setExternalVersion] = useState(""),
    [externalEndpoint, setExternalEndpoint] = useState(
      "ws://127.0.0.1:27312/debugger",
    );
  const [externalStream, setExternalStream] = useState<MediaStream>(),
    [externalStill, setExternalStill] = useState<string>(),
    [captureCrop, setCaptureCrop] = useState<CaptureCrop>({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    });
  const external = useRef<PpssppClient | null>(null),
    externalMedia = useRef<MediaStream | undefined>(undefined);
  const stopCapture = () => {
    externalMedia.current?.getTracks().forEach((t) => t.stop());
    externalMedia.current = undefined;
    setExternalStream(undefined);
  };
  const disconnectExternal = () => {
    input.setEnabled(false);
    input.setAnalogHandler(undefined);
    external.current?.dispose();
    external.current = null;
    stopCapture();
    setExternalStill(undefined);
    setExternalVersion("");
  };
  useEffect(() => {
    if (!STANDALONE)
      void storage
        .getSetting<string>("ppssppEndpoint")
        .then((value) => {
          if (value) setExternalEndpoint(value);
        })
        .catch(() => {});
  }, []);
  const [headphones, setHeadphones] = useState(false);
  const displayProfiles = useRef<Partial<Record<DeviceId, DisplayProfile>>>({});
  const applyDisplay = (id: DeviceId) => {
    const c = displayProfiles.current[id] ?? defaultDisplay();
    setLight(c.light);
    setMuted(c.muted);
    setVolume(c.volume);
    setHardwareValues(c.hardware ?? { contrast: 65, depth: 0 });
    setHeadphones(c.headphones ?? false);
  };
  const [hardwareValues, setHardwareValues] = useState<Record<string, number>>({
    contrast: 65,
    depth: 0,
  });
  const museumRef = useRef(inMuseum);
  museumRef.current = inMuseum;
  const [deviceId, setDeviceId] = useState<DeviceId>(
    routeDevice() || window.__POCKETSP_DEVICE__ || "sp",
  );
  const systemResources = useSystemResources(deviceId);
  const device = deviceById(deviceId),
    deviceRef = useRef<DeviceId>(deviceId);
  deviceRef.current = deviceId;
  const selectedGames = useRef<Record<string, string>>({});
  const selectionKey = (id: DeviceId) =>
    id === "gb" ? "gb" : id === "ds" ? "nds" : "gba";
  const settingKey = (id: DeviceId) =>
    selectionKey(id) === "gba"
      ? "selectedGame"
      : `selectedGame:${selectionKey(id)}`;
  const applyGame = (id: DeviceId) => {
    const selected = selectedGames.current[selectionKey(id)];
    setGame(games.find((g) => g.id === selected && acceptsGame(id, g)));
  };
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
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);
  const report = useCallback((e: unknown) => {
    if (mounted.current) setError(e instanceof Error ? e.message : String(e));
  }, []);
  const native = useNativeSystem(
    deviceId,
    !inMuseum &&
      !externalVersion &&
      ["running", "paused"].includes(status) &&
      (!DEVICE_ADAPTERS[deviceId] || !game || STANDALONE),
    status !== "running" || closed || help || libraryOpen,
  );
  const nativeRef = useRef(native);
  nativeRef.current = native;
  const input = useRef(
    new InputController(
      (button, down) => {
        if (external.current) {
          if (statusRef.current === "running" || !down) {
            const client = external.current;
            void client.input(button, down).catch((e) => {
              if (external.current === client) report(e);
            });
          }
          return;
        }
        if (statusRef.current === "running" && bridge.current)
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
      await storage.putSave(g.id, "native", data, coreFor(gameSystem(g)));
    }
    return data;
  }, []);
  useEffect(() => {
    mounted.current = true;
    void restoreSystemResources();
    void (async () => {
      try {
        if (STANDALONE) {
          try {
            displayProfiles.current = JSON.parse(
              localStorage.getItem("pocketsp:deviceDisplay:v1") || "{}",
            );
            applyDisplay(deviceRef.current);
          } catch {}
          setHydrated(true);
          return;
        }
        const demos: Game[] = DEMOS.map((d) => ({
          id: d.id,
          name: d.name,
          system: d.system,
          license: d.license,
          bytes: new Uint8Array(),
          demo: true,
          importedAt: 0,
        }));
        const [imported, selected, config, profiles, gbSelected, ndsSelected] =
          await Promise.all([
            storage.games(),
            storage.getSetting<string>("selectedGame"),
            storage.getSetting<{
              light: boolean;
              muted: boolean;
              volume: number;
            }>("display"),
            storage.getSetting<Partial<Record<DeviceId, DisplayProfile>>>(
              "deviceDisplay:v1",
            ),
            storage.getSetting<string>("selectedGame:gb"),
            storage.getSetting<string>("selectedGame:nds"),
          ]);
        if (!mounted.current) return;
        const list = [
          ...demos,
          ...imported.filter((g) => !demos.some((d) => d.id === g.id)),
        ];
        selectedGames.current = {
          gba: selected ?? "",
          gb: gbSelected ?? "",
          nds: ndsSelected ?? "",
        };
        setGames(list);
        setGame(
          list.find(
            (g) =>
              g.id === selectedGames.current[selectionKey(deviceRef.current)] &&
              acceptsGame(deviceRef.current, g),
          ),
        );
        displayProfiles.current =
          profiles ??
          Object.fromEntries(
            DEVICES.map((d) => [d.id, { ...defaultDisplay(), ...config }]),
          );
        applyDisplay(deviceRef.current);
        setHydrated(true);
      } catch (e) {
        report(e);
      }
    })();
    return () => {
      mounted.current = false;
      input.setEnabled(false);
      bridge.current?.dispose();
      external.current?.dispose();
      externalMedia.current?.getTracks().forEach((t) => t.stop());
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
    input.setEnabled(
      !inMuseum &&
        status !== "loading" &&
        !closed &&
        !help &&
        !libraryOpen &&
        !connectionOpen,
    );
  }, [
    status,
    closed,
    help,
    libraryOpen,
    input,
    deviceId,
    inMuseum,
    connectionOpen,
  ]);
  useEffect(() => {
    if (!hydrated) return;
    displayProfiles.current[deviceId] = {
      light,
      muted,
      volume,
      hardware: hardwareValues,
      headphones,
    };
    if (STANDALONE) {
      try {
        localStorage.setItem(
          "pocketsp:deviceDisplay:v1",
          JSON.stringify(displayProfiles.current),
        );
      } catch {}
    } else
      void storage
        .putSetting("deviceDisplay:v1", displayProfiles.current)
        .catch(report);
    if (bridge.current && ["running", "paused"].includes(status))
      void bridge.current.volume(muted ? 0 : volume / 100).catch(report);
  }, [
    deviceId,
    light,
    muted,
    volume,
    hardwareValues,
    headphones,
    status,
    hydrated,
    report,
  ]);
  useEffect(() => {
    audioManager.configure(
      deviceId,
      volume / 100,
      muted,
      native.state.prefs.keytone !== "Off",
    );
  }, [deviceId, volume, muted, native.state.prefs.keytone]);
  useEffect(() => {
    audioManager.setAmbience(
      !inMuseum &&
        deviceId === "vita" &&
        status === "running" &&
        !closed &&
        native.state.phase !== "app" &&
        native.state.phase !== "boot" &&
        native.state.phase !== "lock" &&
        native.state.prefs.music !== "Off",
    );
  }, [
    inMuseum,
    deviceId,
    status,
    closed,
    native.state.phase,
    native.state.prefs.music,
  ]);
  useEffect(() => {
    const unlock = () => {
      void audioManager.unlock().catch(() => {});
    };
    const hidden = () => {
      audioManager.setVisible(!document.hidden);
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      document.removeEventListener("visibilitychange", hidden);
      audioManager.stop();
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        museumRef.current ||
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
      if (deviceRef.current === "ds" && bridge.current)
        void bridge.current.touch(0, 0, false).catch(report);
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
    const timer = setInterval(() => {
      if (!operation.current) void persistNative().catch(report);
    }, 5000);
    return () => clearInterval(timer);
  }, [status, persistNative, report]);
  const stop = async () => {
    if (statusRef.current === "running" && !bridge.current && !external.current)
      void audioManager.play("shutdown");
    input.setEnabled(false);
    if (external.current) disconnectExternal();
    const wasRunning = statusRef.current === "running";
    try {
      if (bridge.current) await bridge.current.pause(true);
      await persistNative();
    } catch (e) {
      if (wasRunning) await bridge.current?.pause(false).catch(report);
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
  const startPower = () => {
    if (!DEVICE_ADAPTERS[deviceRef.current] || STANDALONE || !gameRef.current) {
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
  };
  const power = () =>
    void guarded(async () => {
      if (statusRef.current !== "off" && statusRef.current !== "error") {
        await stop();
        notify("电源关闭");
        return;
      }
      startPower();
    });
  const demoBytes = useRef(new Map<string, Uint8Array>());
  const onFrame = async (frame: HTMLIFrameElement) => {
    if (statusRef.current !== "loading" || booting.current === session) return;
    booting.current = session;
    const b = new EmulatorBridge(frame, session);
    bridge.current = b;
    const selected = gameRef.current;
    if (!selected) return;
    try {
      const native = await storage.getSave(selected.id, "native");
      let bytes = selected.bytes;
      if (selected.demo && !bytes.length) {
        const cached = demoBytes.current.get(selected.id);
        if (cached) bytes = cached;
        else {
          const demo = DEMOS.find((d) => d.id === selected.id);
          if (!demo) throw new Error("找不到卡带资源");
          const response = await fetch(demo.url);
          if (!response.ok) throw new Error("卡带读取失败，请重试");
          bytes = new Uint8Array(await response.arrayBuffer());
          if ((await identify(bytes)) !== selected.id)
            throw new Error("卡带校验失败");
          demoBytes.current.set(selected.id, bytes);
        }
      }
      if (bridge.current !== b) return;
      await b.start(bytes, selected.id, native?.data, gameSystem(selected));
      if (bridge.current !== b) return;
      const s = soundRef.current;
      await b.volume(s.muted ? 0 : s.volume / 100);
      if (closedRef.current) await b.pause(true);
      setStatus(closedRef.current ? "paused" : "running");
      notify(native ? "原生存档已恢复" : "游戏已启动");
    } catch (e) {
      if (bridge.current === b) {
        setStatus("error");
        report(e);
        b.dispose();
        bridge.current = null;
      }
    }
  };
  const selectGame = (next: Game, play = false) =>
    void guarded(async () => {
      if (next.id === gameRef.current?.id && bridge.current && ready) {
        if (play && statusRef.current === "paused") {
          await bridge.current.pause(false);
          setStatus("running");
        }
        setLibraryOpen(false);
        return;
      }
      if (next.id !== gameRef.current?.id || play) {
        await stop();
        gameRef.current = next;
        setGame(next);
        setHasState(false);
        selectedGames.current[selectionKey(deviceId)] = next.id;
        await storage.putSetting(settingKey(deviceId), next.id);
      }
      setLibraryOpen(false);
      if (play) startPower();
      else notify(`已插入 ${next.name}`);
    });
  const importFile = (file?: File) => {
    if (file)
      void guarded(async () => {
        const imported = await importRom(
          file,
          DEVICE_ADAPTERS[deviceId]?.systems ?? [],
        );
        await storage.putGame(imported);
        await stop();
        setGames((list) => [
          ...list.filter((g) => g.id !== imported.id),
          imported,
        ]);
        setGame(imported);
        selectedGames.current[selectionKey(deviceId)] = imported.id;
        await storage.putSetting(settingKey(deviceId), imported.id);
        notify(`已导入 ${imported.name} · 点游玩开始`);
      });
  };
  const pause = () =>
    void guarded(async () => {
      const next = status === "running";
      if (external.current) {
        input.releaseAll();
        await external.current.pause(next);
        setStatus(next ? "paused" : "running");
        return;
      }
      if (
        !DEVICE_ADAPTERS[deviceRef.current] ||
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
      setFocusPlay(false);
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
      await storage.putSave(g.id, "state", data, coreFor(gameSystem(g)));
      setHasState(true);
      notify("即时存档已保存 · 槽位 01");
    });
  const quickLoad = () =>
    void guarded(async () => {
      if (!game || !bridge.current) return;
      const save = await storage.getSave(game.id, "state");
      if (!save) throw new Error("这个游戏还没有即时存档");
      if (save.core !== coreFor(gameSystem(game)) || save.version !== "4.2.3")
        throw new Error("存档核心或版本与当前游戏不一致");
      input.releaseAll();
      await bridge.current.loadState(save.data);
      notify("即时存档已读取");
    });
  const switchDevice = (id: DeviceId) =>
    void guarded(async () => {
      document.getElementById("device-picker")?.hidePopover();
      if (id === deviceId && !inMuseum) return;
      await stop();
      setClosed(false);
      setFlat(false);
      applyDisplay(id);
      applyGame(id);
      setDeviceId(id);
      setInMuseum(false);
      setToolsOpen(false);
      setFocusPlay(false);
      if (!(STANDALONE && !COLLECTION))
        history[inMuseum ? "pushState" : "replaceState"](
          {},
          "",
          `#/play/${id}`,
        );
      setError("");
    });
  const returnMuseum = () =>
    void guarded(async () => {
      await stop();
      setInMuseum(true);
      setToolsOpen(false);
      setFocusPlay(false);
      history.pushState({}, "", location.pathname + location.search);
    });
  const routeRef = useRef(() => {});
  routeRef.current = () =>
    void guarded(async () => {
      const id = routeDevice();
      await stop();
      setClosed(false);
      setFlat(false);
      setToolsOpen(false);
      setFocusPlay(false);
      setInMuseum(!id);
      if (id) {
        applyDisplay(id);
        applyGame(id);
        setDeviceId(id);
      }
    });
  useEffect(() => {
    const changed = () => routeRef.current();
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  const onTouch = useCallback(
    (x: number, y: number, down: boolean) => {
      if (bridge.current && statusRef.current === "running")
        void bridge.current.touch(x, y, down).catch(report);
    },
    [report],
  );
  const connectExternal = () =>
    void guarded(async () => {
      if (location.protocol === "file:")
        throw Error("连接模拟器请从 localhost 项目页面打开");
      await stop();
      const client = new PpssppClient(
        (paused) => {
          if (external.current === client)
            setStatus(paused ? "paused" : "running");
        },
        (message) => {
          if (external.current === client) {
            disconnectExternal();
            setStatus("off");
            report(Error(message));
          }
        },
      );
      external.current = client;
      try {
        const version = await client.connect(externalEndpoint);
        if (version.name !== "PPSSPP") throw Error("连接的服务不是 PPSSPP");
        const [game, cpu] = await Promise.all([
          client.request("game.status"),
          client.request("cpu.status"),
        ]);
        setExternalVersion(String(version.version ?? "PPSSPP"));
        setStatus(cpu.stepping === true ? "paused" : "running");
        input.setAnalogHandler(
          (x, y) =>
            void client.analog(x, y).catch((e) => {
              if (external.current === client) report(e);
            }),
        );
        await storage.putSetting("ppssppEndpoint", externalEndpoint);
        notify(
          game.game ? "PPSSPP 已连接" : "已连接 PPSSPP；请在模拟器中打开程序",
        );
      } catch (e) {
        disconnectExternal();
        setStatus("off");
        throw e;
      }
    });
  const shareExternalWindow = async () => {
    try {
      if (!external.current) throw Error("请先连接 PPSSPP");
      const owner = external.current;
      if (!navigator.mediaDevices?.getDisplayMedia)
        throw Error("此浏览器不支持窗口共享，请使用桌面版 Chrome 或 Edge");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "window", frameRate: { ideal: 30, max: 60 } },
        audio: false,
      });
      if (!mounted.current || external.current !== owner) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      stopCapture();
      externalMedia.current = stream;
      setExternalStream(stream);
      setExternalStill(undefined);
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (externalMedia.current === stream) {
          externalMedia.current = undefined;
          setExternalStream(undefined);
        }
      });
    } catch (e) {
      report(e);
    }
  };
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if (
        inMuseum ||
        help ||
        libraryOpen ||
        connectionOpen ||
        e.repeat ||
        (e.target instanceof HTMLElement &&
          e.target.closest("input,textarea,select,[contenteditable=true]"))
      )
        return;
      if (e.code === "Escape" && focusPlay) {
        e.preventDefault();
        input.releaseAll();
        setFocusPlay(false);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [inMuseum, help, libraryOpen, connectionOpen, focusPlay, input]);
  const adapter = DEVICE_ADAPTERS[deviceId];
  if (inMuseum) return <MuseumHome onSelect={switchDevice} />;
  const ready = ["running", "paused"].includes(status),
    powered = status !== "off" && status !== "error";
  return (
    <div
      className={`app studio-app play-view ${toolsOpen ? "tools-open" : ""} ${ready && !!bridge.current ? "game-active" : ""} ${focusPlay ? "focus-play" : ""}`}
      data-theme={deviceId}
    >
      <ThemeBackdrop device={deviceId} />
      <header className="studio-header">
        {(!STANDALONE || COLLECTION) && (
          <button
            className="museum-back"
            aria-label="返回博物馆"
            onClick={returnMuseum}
          >
            <ArrowLeft size={17} />
            博物馆
          </button>
        )}
        <a
          href={STANDALONE ? undefined : "/"}
          className="studio-brand"
          aria-label="Pocket Museum 首页"
          onClick={(e) => {
            e.preventDefault();
            if (!STANDALONE || COLLECTION) returnMuseum();
          }}
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
          <div className="device-selector">
            <button
              popoverTarget="device-picker"
              className="device-choice"
              aria-label="切换掌机"
            >
              <img src={device.asset} alt="" />
              {device.label}
              <ChevronDown size={14} />
            </button>
            <nav
              id="device-picker"
              popover="auto"
              className="handheld-switcher"
              aria-label="切换掌机"
            >
              {DEVICES.map((d) => (
                <button
                  key={d.id}
                  aria-pressed={deviceId === d.id}
                  onClick={() => switchDevice(d.id)}
                  disabled={busy || status === "loading"}
                >
                  <img src={d.asset} alt="" />
                  {d.label}
                </button>
              ))}
            </nav>
          </div>
        )}
        <button
          className="help-button"
          onClick={() => setHelp(true)}
          aria-label="使用指南"
        >
          <CircleHelp size={19} />
        </button>
      </header>
      <DevicePresentation
        device={deviceId}
        keyboard={<KeyboardLegend device={device} pads={pads} />}
        handheld={
          <>
            <div className="console-stage">
              <Console
                key={deviceId}
                cancelToken={`${help}:${libraryOpen}:${flat}`}
                device={device}
                focus={focusPlay}
                emulate={!STANDALONE && !!game && acceptsGame(deviceId, game)}
                onTouch={onTouch}
                nativeScreen={(index) =>
                  externalVersion ? (
                    <ExternalScreen
                      stream={externalStream}
                      still={externalStill}
                      crop={captureCrop}
                      onError={report}
                    />
                  ) : (
                    <NativeScreen
                      state={native.state}
                      chat={native.chat}
                      volume={muted ? 0 : volume / 100}
                      headphones={headphones}
                      dispatch={native.dispatch}
                      screen={index}
                      onPowerOff={() => void guarded(stop)}
                    />
                  )
                }
                status={status}
                pressed={pressed}
                input={input}
                closed={closed}
                flat={flat}
                light={light}
                onLight={() => setLight(!light)}
                onPower={power}
                powerDisabled={busy || !hydrated || status === "loading"}
                onFold={fold}
                foldDisabled={busy}
                onLidMotion={() => input.releaseAll()}
                onMenu={() => {
                  if (external.current) {
                    notify("外部模拟器的 HOME/暂停菜单请在模拟器窗口操作");
                    return;
                  }
                  if (statusRef.current === "running")
                    native.dispatch({ type: "home" });
                }}
                onVolume={(delta) => {
                  if (external.current) {
                    notify("连接模式音量由 PPSSPP 控制");
                    return;
                  }
                  const next = Math.min(
                    100,
                    Math.max(0, (muted ? 0 : volume) + delta),
                  );
                  setVolume(next);
                  setMuted(next === 0);
                }}
                hardwareValues={{
                  ...hardwareValues,
                  volume: muted ? 0 : volume,
                }}
                onHardwareValue={(id, value) => {
                  if (id === "volume") {
                    setVolume(value);
                    setMuted(value === 0);
                  } else {
                    setHardwareValues((v) => ({ ...v, [id]: value }));
                    if (id === "depth")
                      notify("浏览器采用平面显示，当前不提供裸眼立体效果");
                  }
                }}
                onSound={(long) => {
                  if (external.current) {
                    notify("连接模式 SOUND 由 PPSSPP 控制");
                    return;
                  }
                  if (long) setMuted((v) => !v);
                  else if (
                    headphones &&
                    native.state.phase === "app" &&
                    native.state.category === 2 &&
                    native.state.app.includes("Memory Stick")
                  ) {
                    const current = native.state.prefs["sound-preset"] ?? "OFF",
                      next =
                        SOUND_PRESETS[
                          (SOUND_PRESETS.indexOf(
                            current as (typeof SOUND_PRESETS)[number],
                          ) +
                            1) %
                            SOUND_PRESETS.length
                        ];
                    native.dispatch({
                      type: "set",
                      key: "sound-preset",
                      value: next,
                    });
                    notify(`音色 ${next}`);
                  } else notify("音色切换仅适用于耳机模式下的音乐播放");
                }}
                session={session}
                onFrame={(frame) => void onFrame(frame)}
              />
            </div>
            {focusPlay && (
              <FocusControls
                device={device}
                input={input}
                pressed={pressed}
                enabled={status === "running" && !closed}
                onHome={() => native.dispatch({ type: "home" })}
              />
            )}
          </>
        }
        controls={
          <>
            <div className="rail-heading">
              <Sun size={21} />
              <h2>控制</h2>
              <button
                className="close-tools"
                aria-label="关闭操作菜单"
                onClick={() => setToolsOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            {externalVersion ? (
              <p className="external-audio-note">音量在 PPSSPP 中调整</p>
            ) : (
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
                    style={{
                      background: `linear-gradient(to right, var(--accent) ${muted ? 0 : volume}%, #e8e1d7 ${muted ? 0 : volume}%)`,
                    }}
                    onChange={(e) => {
                      setVolume(+e.target.value);
                      setMuted(+e.target.value === 0);
                    }}
                  />
                </div>
                <small>{muted ? "0" : volume}</small>
              </div>
            )}

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
                  setFocusPlay(false);
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
            {!STANDALONE && !!DEVICE_ADAPTERS[deviceId] && !!game && (
              <>
                <button
                  className="setting-row"
                  onClick={quickSave}
                  disabled={
                    !ready ||
                    !bridge.current ||
                    busy ||
                    !DEVICE_ADAPTERS[deviceId] ||
                    STANDALONE
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
                    !bridge.current ||
                    busy ||
                    !DEVICE_ADAPTERS[deviceId] ||
                    STANDALONE
                  }
                >
                  <span>
                    <RotateCcw size={19} />
                    读取存档
                  </span>
                  {hasState && <i className="state-dot" />}
                </button>
              </>
            )}
            <details
              className="more-controls"
              onClick={(e) => {
                if (e.target instanceof Element && e.target.closest("button,a"))
                  e.currentTarget.open = false;
              }}
            >
              <summary>更多</summary>
              <div>
                <button
                  className="setting-row"
                  onClick={() => {
                    if (document.fullscreenElement) {
                      void document.exitFullscreen().catch(report);
                    } else
                      void document.documentElement
                        .requestFullscreen()
                        .catch(report);
                  }}
                  aria-label="全屏"
                >
                  <span>
                    <Maximize2 size={20} />
                    全屏
                  </span>
                  <ChevronRight size={15} />
                </button>

                {!!DEVICE_ADAPTERS[deviceId] && game && !STANDALONE && (
                  <button
                    className="setting-row eject-button"
                    onClick={() =>
                      void guarded(async () => {
                        await stop();
                        setGame(undefined);
                        selectedGames.current[selectionKey(deviceId)] = "";
                        await storage.putSetting(settingKey(deviceId), "");
                      })
                    }
                  >
                    拔出卡带
                  </button>
                )}

                {!STANDALONE && deviceId === "psp" && (
                  <button
                    className="setting-row"
                    onClick={() => setConnectionOpen(true)}
                  >
                    {externalVersion ? "模拟器连接" : "连接模拟器"}
                  </button>
                )}
                {["3ds", "psp", "vita"].includes(deviceId) && (
                  <>
                    <label className="setting-row system-resources-import">
                      导入系统资源文件夹
                      <input
                        type="file"
                        multiple
                        {...{ webkitdirectory: "" }}
                        aria-label="导入系统资源"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          e.target.value = "";
                          if (files.length)
                            void importSystemResources(files, deviceId)
                              .then(() =>
                                notify("系统资源已加载，仅保存在本机"),
                              )
                              .catch(report);
                        }}
                      />
                    </label>
                    {systemResources && (
                      <button
                        className="setting-row"
                        onClick={() =>
                          void clearSystemResources(deviceId)
                            .then(() => notify("已恢复内置重建素材"))
                            .catch(report)
                        }
                      >
                        恢复内置素材
                      </button>
                    )}
                  </>
                )}
                {deviceId === "psp" && (
                  <label className="headphone-option">
                    <input
                      type="checkbox"
                      checked={headphones}
                      onChange={(e) => setHeadphones(e.target.checked)}
                    />
                    耳机模式（手动）
                  </label>
                )}
                {["3ds", "psp", "vita"].includes(deviceId) && (
                  <MediaImport
                    device={deviceId}
                    onDone={notify}
                    onError={report}
                  />
                )}
                <button className="setting-row" onClick={() => setHelp(true)}>
                  键位与使用指南
                </button>
                {!STANDALONE && (
                  <a
                    className="setting-row"
                    href={`/standalone/${deviceId}.html`}
                    download
                  >
                    下载单文件版
                  </a>
                )}
                {(STANDALONE ||
                  (!DEVICE_ADAPTERS[deviceId] && !externalVersion)) && (
                  <p className="support-note">
                    {STANDALONE
                      ? "离线版包含机身与系统界面，不含游戏核心。"
                      : "本机型目前提供系统界面，游戏核心尚未接入。"}
                  </p>
                )}
              </div>
            </details>
          </>
        }
      />
      <div className="studio-dock" aria-label="电源与卡带">
        <button
          className={`power-button dock-power ${powered ? "powered" : ""}`}
          onClick={power}
          disabled={busy || !hydrated || status === "loading"}
          aria-label={powered ? "关闭电源" : "开启电源"}
        >
          <Power size={18} />
          <span>{powered ? "关机" : "开机"}</span>
        </button>
        {!STANDALONE && !!DEVICE_ADAPTERS[deviceId] && (
          <button
            className="cartridge-button dock-cartridge"
            aria-label="选择卡带"
            onClick={() => setLibraryOpen(true)}
            title={game ? `更换 ${game.name}` : "选择卡带"}
          >
            <FolderOpen size={18} />
            <span>{game ? "更换卡带" : "选择卡带"}</span>
          </button>
        )}
        {["gb", "sp"].includes(deviceId) && (
          <button
            className="dock-focus"
            aria-label={focusPlay ? "退出专注模式" : "专注游玩"}
            aria-pressed={focusPlay}
            disabled={busy || closed}
            onClick={() => {
              input.releaseAll();
              setFocusPlay((v) => !v);
              setToolsOpen(false);
            }}
          >
            {focusPlay ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span>{focusPlay ? "外观" : "专注"}</span>
          </button>
        )}
        {ready && (
          <button
            className="dock-pause"
            aria-label={status === "paused" ? "快捷继续" : "快捷暂停"}
            disabled={busy || closed}
            onClick={pause}
          >
            {status === "paused" ? <Play size={18} /> : <Pause size={18} />}
            <span>{status === "paused" ? "继续" : "暂停"}</span>
          </button>
        )}
        <button
          className="mobile-tools-button"
          aria-label="操作与设置"
          aria-expanded={toolsOpen}
          onClick={() => setToolsOpen((v) => !v)}
        >
          <SlidersHorizontal size={18} />
          <span>设置</span>
        </button>
        <span
          className={`status-chip ${status}`}
          role="status"
          data-testid="emulator-status"
        >
          <i />
          {externalVersion
            ? `PPSSPP · ${status === "paused" ? "已暂停" : "已连接"}`
            : (!DEVICE_ADAPTERS[deviceId] || STANDALONE || !game) &&
                status === "running"
              ? "系统运行"
              : STATUS[status]}
        </span>
      </div>
      {connectionOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setConnectionOpen(false)}
        >
          <section
            className="connection-modal"
            role="dialog"
            aria-modal="true"
            aria-label="连接模拟器"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="关闭连接面板"
              onClick={() => setConnectionOpen(false)}
            >
              <X size={20} />
            </button>
            <h2>连接 PPSSPP</h2>
            {error && (
              <p role="alert" className="connection-error">
                {error}
              </p>
            )}
            <p>
              在 PPSSPP 的 Tools → Developer Tools 开启 Allow remote
              debugger，填写其本地服务端口。
            </p>
            <label>
              WebSocket 地址
              <input
                aria-label="模拟器地址"
                type="url"
                value={externalEndpoint}
                disabled={!!externalVersion || busy}
                onChange={(e) => setExternalEndpoint(e.target.value)}
              />
            </label>
            {!externalVersion ? (
              <button
                className="connection-primary"
                onClick={connectExternal}
                disabled={busy}
              >
                连接
              </button>
            ) : (
              <>
                <p className="connection-status">
                  已连接 PPSSPP {externalVersion}
                </p>
                <button
                  className="connection-primary"
                  onClick={() => void shareExternalWindow()}
                >
                  共享模拟器窗口
                </button>
                <p>
                  选择模拟器窗口后，实时画面显示在掌机屏幕中；声音由 PPSSPP
                  播放。机身按键、键盘和手柄可以控制模拟器。
                </p>
                {externalStream && (
                  <fieldset className="capture-crop">
                    <legend>裁去窗口边框（百分比）</legend>
                    {(["left", "top", "right", "bottom"] as const).map(
                      (key, i) => (
                        <label key={key}>
                          {["左", "上", "右", "下"][i]}
                          <input
                            type="number"
                            min="0"
                            max="40"
                            aria-label={`裁剪${["左", "上", "右", "下"][i]}边`}
                            value={captureCrop[key]}
                            onChange={(e) =>
                              setCaptureCrop((v) => ({
                                ...v,
                                [key]: Math.max(
                                  0,
                                  Math.min(40, Number(e.target.value) || 0),
                                ),
                              }))
                            }
                          />
                        </label>
                      ),
                    )}
                  </fieldset>
                )}
                <button
                  onClick={() =>
                    void guarded(async () => {
                      if (!external.current) return;
                      await external.current.pause(true);
                      setExternalStill(
                        await external.current.pausedScreenshot(),
                      );
                      notify("已暂停并抓取画面");
                    })
                  }
                  disabled={busy}
                >
                  抓取暂停画面
                </button>
                <button
                  onClick={() => {
                    disconnectExternal();
                    setStatus("off");
                  }}
                >
                  断开连接
                </button>
              </>
            )}
            <p className="support-note">
              此入口连接本地 PSP
              模拟器，不下载固件、ROM，也不代替浏览器内置核心。3DS / Vita
              尚无已适配的外部连接接口。
            </p>
          </section>
        </div>
      )}
      {error && !connectionOpen && (
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
            <p>
              导入本地 {adapter?.extensions.replaceAll(",", " / ")}{" "}
              文件，或使用开源演示卡带。
            </p>

            <div className="game-list">
              {games
                .filter((g) => acceptsGame(deviceId, g))
                .map((g) => (
                  <div
                    key={g.id}
                    className={`game-card-row ${game?.id === g.id ? "selected" : ""}`}
                  >
                    <button
                      onClick={() => selectGame(g)}
                      disabled={busy || status === "loading"}
                      className={`game-card ${game?.id === g.id ? "selected" : ""}`}
                      aria-pressed={game?.id === g.id}
                      aria-label={g.name}
                    >
                      <span className="cartridge-art">
                        <Gamepad2 size={28} />
                      </span>
                      <span>
                        <h3 id={`game-${g.id}`}>{g.name}</h3>
                        <small>
                          {DEMOS.find((d) => d.id === g.id)?.description ||
                            `本地卡带 · ${gameSystem(g).toUpperCase()}`}
                        </small>
                      </span>
                      {game?.id === g.id && <Check size={17} />}
                    </button>
                    <button
                      className="game-quick-play"
                      aria-label="立即游玩"
                      aria-describedby={`game-${g.id}`}
                      disabled={busy || status === "loading"}
                      onClick={() => selectGame(g, true)}
                    >
                      <Play size={17} />
                      <span>游玩</span>
                    </button>
                  </div>
                ))}
            </div>
            <label
              className={`import-button ${busy || status === "loading" ? "disabled" : ""}`}
            >
              <Plus size={18} />
              导入 {adapter?.extensions.replaceAll(",", " / ")} 文件
              <input
                aria-label={`导入 ${adapter?.label} 游戏`}
                type="file"
                accept={adapter?.extensions}
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
                  !bridge.current ||
                  busy ||
                  !DEVICE_ADAPTERS[deviceId] ||
                  STANDALONE
                }
                onClick={() =>
                  void guarded(async () => {
                    const data = await persistNative();
                    if (!data?.length)
                      throw new Error("尚无原生存档，请先在游戏内保存");
                    download(
                      data,
                      `${game?.name}.${adapter?.core === "desmume" ? "dsv" : "sav"}`,
                    );
                    notify("原生存档已导出");
                  })
                }
              >
                <ArrowUpFromLine size={14} />
                导出 .{adapter?.core === "desmume" ? "dsv" : "sav"}
              </button>
              <label
                className={
                  !game || busy || status === "loading" ? "disabled" : ""
                }
              >
                <FolderOpen size={14} />
                导入 .{adapter?.core === "desmume" ? "dsv" : "sav"}
                <input
                  aria-label="导入原生存档"
                  type="file"
                  accept={adapter?.core === "desmume" ? ".dsv" : ".sav,.srm"}
                  disabled={
                    !game ||
                    status === "loading" ||
                    busy ||
                    !DEVICE_ADAPTERS[deviceId] ||
                    STANDALONE
                  }
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      void guarded(async () => {
                        if (file.size === 0 || file.size > 16 * 1024 * 1024)
                          throw new Error("存档大小无效");
                        const data = new Uint8Array(await file.arrayBuffer());
                        const wasRunning = ready;
                        // Finish the old core before replacing its persistent image.
                        // A later SRAM flush must never overwrite the imported save.
                        await stop();
                        await storage.putSave(
                          game!.id,
                          "native",
                          data,
                          coreFor(gameSystem(game!)),
                        );
                        if (wasRunning) startPower();
                        notify(
                          wasRunning
                            ? "原生存档已导入 · 正在重新启动"
                            : "原生存档已导入 · 开机后读取",
                        );
                      });
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="library-note">
              <ShieldCheck size={14} />
              最大 {adapter?.maxMiB} MB · 卡带与存档仅保存在当前浏览器
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
            <h2>使用指南</h2>
            <p>
              {STANDALONE || !DEVICE_ADAPTERS[deviceId]
                ? "开机后进入当前机型的无卡启动页或系统界面。DS / 3DS 的下屏和 Vita 屏幕支持触摸，HOME / PS 键按各自系统流程返回。"
                : "选择卡带或导入你有权使用的游戏，然后按下电源。屏幕在关机时保持空白。"}
            </p>
            <ol>
              <li>
                <b>掌机操作</b>
                <p>
                  方向键或 WASD 移动，X / Z 对应 A / B，Q / E 对应 L / R，Enter
                  是 Start，Shift 是 Select。鼠标或触摸可以直接按机身按钮。
                </p>
              </li>
              {!STANDALONE && !!DEVICE_ADAPTERS[deviceId] && (
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
              声音默认静音。DS / 3DS 合盖睡眠，SP
              合盖继续运行。清除浏览器数据会移除卡带和存档，请导出备份。
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
