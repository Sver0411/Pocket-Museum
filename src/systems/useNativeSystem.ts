import { audioManager } from "../audio/AudioManager";
import { useEffect, useReducer, useRef } from "react";
import type { DeviceId } from "../devices";
import type { Button } from "../emulator/protocol";
import { storage } from "../storage/database";
import { useLocalChat } from "./wireless";
import { notifyMedia } from "./media";
import { stopCamera } from "./camera";
import { initialSystem, systemReducer } from "./model";
export function useNativeSystem(
  device: DeviceId,
  powered: boolean,
  suspended: boolean,
) {
  const [state, rawDispatch] = useReducer(systemReducer, device, initialSystem);
  const dispatch: typeof rawDispatch = (action) => {
    if (powered && !suspended) {
      const cue = ["select", "category", "page"].includes(action.type)
        ? "move"
        : ["open", "start", "commit", "section"].includes(action.type)
          ? "confirm"
          : ["back", "cancel-edit", "home", "close"].includes(action.type)
            ? "back"
            : action.type === "dialog"
              ? "warning"
              : null;
      if (cue) void audioManager.play(cue);
    }
    rawDispatch(action);
  };
  const held = useRef(new Map<Button, ReturnType<typeof setTimeout>>());
  const ready = useRef(false);
  const unsaved = useRef(new Map<DeviceId, Record<string, string>>());
  const current = useRef(state);
  current.current = state;
  const chat = useLocalChat(
    powered && !suspended && state.app === "pictochat" ? state.room : "",
    state.prefs.nickname || "Player",
    (message) => dispatch({ type: "receive-chat", message }),
  );
  useEffect(() => {
    if (suspended || !powered) {
      window.dispatchEvent(
        new CustomEvent("pocketsp:system-suspend", { detail: device }),
      );
      document
        .querySelectorAll<HTMLMediaElement>(
          ".native-screen audio,.native-screen video",
        )
        .forEach((el) => el.pause());
    } else
      window.dispatchEvent(
        new CustomEvent("pocketsp:system-resume", { detail: device }),
      );
  }, [device, powered, suspended]);
  useEffect(() => {
    if (
      !powered ||
      suspended ||
      !["camera", "photos", "ar", "face", "welcome", "mii"].includes(state.app)
    )
      stopCamera();
  }, [powered, suspended, state.app]);
  useEffect(() => {
    const id = state.prefs.deleteMedia;
    if (!id || state.device !== device) return;
    void storage
      .deleteMedia(id)
      .then(() => {
        notifyMedia();
        dispatch({ type: "set", key: "deleteMedia", value: "" });
      })
      .catch((e) => {
        dispatch({ type: "set", key: "deleteMedia", value: "" });
        dispatch({ type: "dialog", text: String(e) });
      });
  }, [state.prefs.deleteMedia, state.device, device]);
  useEffect(() => {
    if (!state.prefs.eraseMedia || state.device !== device) return;
    void storage
      .clearMedia(device)
      .then(() => {
        notifyMedia();
        dispatch({ type: "set", key: "eraseMedia", value: "" });
      })
      .catch((e) => {
        dispatch({ type: "set", key: "eraseMedia", value: "" });
        dispatch({ type: "dialog", text: String(e) });
      });
  }, [state.prefs.eraseMedia, state.device, device]);
  useEffect(() => {
    if (!powered || suspended || state.phase !== "app") return;
    let previous = Date.now();
    const timer = setInterval(() => {
      if (document.hidden) {
        previous = Date.now();
        return;
      }
      const now = Date.now(),
        delta = Math.round((now - previous) / 1000);
      previous = now;
      let activity: Record<string, number> = {};
      try {
        activity = JSON.parse(current.current.prefs.activity || "{}");
      } catch {}
      const day = new Date(now).toLocaleDateString("en-CA");
      dispatch({
        type: "set",
        key: "activity",
        value: JSON.stringify({
          ...activity,
          [day]: (activity[day] || 0) + delta,
        }),
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [powered, suspended, state.phase]);

  const standalone = window.__POCKETSP_STANDALONE__ === true;
  useEffect(() => {
    ready.current = false;
    dispatch({ type: "power", device, on: false });
    let cancelled = false;
    const read = async () => {
      try {
        const prefs = standalone
          ? JSON.parse(
              localStorage.getItem(`pocketsp:system:${device}`) || "{}",
            )
          : (await storage.getSetting<Record<string, string>>(
              `system:${device}`,
            )) || {};
        if (!cancelled) {
          dispatch({ type: "hydrate", prefs: unsaved.current.get(device) ?? prefs });
          rawDispatch({ type: "save-status", failed: unsaved.current.has(device) });
        }
      } catch {
      } finally {
        if (!cancelled) ready.current = true;
      }
    };
    void read();
    return () => {
      cancelled = true;
    };
  }, [device, standalone]);
  useEffect(() => {
    dispatch({ type: "power", device, on: powered });
    if (!powered) return;
    void audioManager.play("boot");
    const t = setTimeout(
      () => dispatch({ type: "ready" }),
      device === "gb" ? 1000 : device === "gba" || device === "sp" ? 1800 : 700,
    );
    return () => clearTimeout(t);
  }, [device, powered]);
  useEffect(() => {
    if (!ready.current || state.device !== device) return;
    let active = true;
    const save = async () => {
      try {
        if (standalone) {
          localStorage.setItem(
            `pocketsp:system:${device}`,
            JSON.stringify(state.prefs),
          );
        } else {
          await storage.putSetting(`system:${device}`, state.prefs);
        }
        if (active) {
          unsaved.current.delete(device);
          rawDispatch({ type: "save-status", failed: false });
        }
      } catch {
        if (active) {
          unsaved.current.set(device, state.prefs);
          rawDispatch({ type: "save-status", failed: true });
        }
      }
    };
    void save();
    return () => { active = false; };
  }, [device, state.prefs, state.device, standalone]);
  useEffect(() => {
    if (!powered || suspended) {
      for (const timer of held.current.values()) clearTimeout(timer);
      held.current.clear();
    }
    return () => {
      for (const timer of held.current.values()) clearTimeout(timer);
      held.current.clear();
    };
  }, [device, powered, suspended]);
  const button = (b: Button, down: boolean) => {
    const timer = held.current.get(b);
    if (timer) clearTimeout(timer);
    held.current.delete(b);
    if (!powered || suspended || !down) return;
    const press = () => {
      void audioManager.play(
        ["Up", "Down", "Left", "Right"].includes(b)
          ? "move"
          : b === "B"
            ? "back"
            : b === "A"
              ? "confirm"
              : "press",
      );
      const event = new CustomEvent("pocketsp:app-button", {
        detail: { device, button: b },
        cancelable: true,
      });
      if (
        current.current.phase === "app" &&
        current.current.app !== "settings" &&
        !current.current.dialog
      )
        window.dispatchEvent(event);
      if (!event.defaultPrevented) dispatch({ type: "button", button: b });
    };
    press();
    if (["Up", "Down", "Left", "Right"].includes(b)) {
      const repeat = () => {
        press();
        held.current.set(b, setTimeout(repeat, 115));
      };
      held.current.set(b, setTimeout(repeat, 420));
    }
  };
  return { state, dispatch, button, chat };
}
