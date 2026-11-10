import { describe, it, expect } from "vitest";
import {
  initialSystem,
  systemReducer as reduce,
  APPS_VITA,
} from "../src/systems/model";
import type { DeviceId } from "../src/devices";
import type { Button } from "../src/emulator/protocol";
const boot = (d: DeviceId) =>
  reduce(reduce(initialSystem(d), { type: "power", device: d, on: true }), {
    type: "ready",
  });
const button = (s: ReturnType<typeof boot>, b: Button) =>
  reduce(s, { type: "button", button: b });
describe("native handheld startup and navigation", () => {
  it("GB/GBA/SP never invent a cartridge-selection menu", () => {
    for (const d of ["gb", "gba", "sp"] as DeviceId[]) {
      let s = boot(d);
      for (const b of ["A", "Start", "Right"] as Button[]) s = button(s, b);
      expect(s.phase).toBe("boot");
      expect(s.app).toBe("");
    }
  });
  it("DS requires the health screen and Settings Quit confirms a shutdown", () => {
    let s = boot("ds");
    expect(s.phase).toBe("health");
    s = button(s, "A");
    s = reduce(s, { type: "open", app: "settings" });
    s = button(s, "B");
    expect(s.dialog).toContain("shut down");
    s = button(s, "A");
    expect(s.shutdown).toBe(true);
  });
  it("PSP separates horizontal categories and vertical items and bounds the lists", () => {
    let s = boot("psp");
    s = button(s, "Right");
    expect(s.category).toBe(1);
    s = button(s, "Down");
    expect(s.selection).toBe(1);
    s = button(s, "Down");
    expect(s.selection).toBe(1);
    s = button(s, "Left");
    expect(s.category).toBe(0);
    expect(s.selection).toBe(0);
  });
  it("settings edits are cancelled or committed explicitly", () => {
    let s = reduce(boot("psp"), { type: "open", app: "settings" });
    s = reduce(s, { type: "section", name: "Theme Settings" });
    s = button(s, "Down");
    s = button(s, "A");
    expect(s.editor).toBe("colour");
    s = button(s, "Right");
    expect(s.draft).toBe("Purple");
    s = button(s, "B");
    expect(s.prefs.colour).toBeUndefined();
    s = button(s, "A");
    s = button(s, "Right");
    s = button(s, "A");
    expect(s.prefs.colour).toBe("Purple");
  });
  it("Vita follows lock → home → LiveArea → app → PS → LiveArea → index → home and evicts a seventh LiveArea", () => {
    let s = boot("vita");
    expect(s.phase).toBe("lock");
    s = reduce(s, { type: "home" });
    expect(s.phase).toBe("home");
    s = reduce(s, { type: "open", app: "settings" });
    expect(s.phase).toBe("live");
    expect(s.started).not.toContain("settings");
    s = button(s, "A");
    expect(s.started).toContain("settings");
    expect(s.phase).toBe("app");
    s = reduce(s, { type: "home" });
    expect(s.phase).toBe("live");
    s = reduce(s, { type: "home" });
    expect(s.phase).toBe("index");
    s = reduce(s, { type: "home" });
    expect(s.phase).toBe("home");
    for (const app of APPS_VITA.slice(0, 7))
      s = reduce(s, { type: "open", app: app.id });
    expect(s.open).toHaveLength(6);
    expect(s.open).not.toContain(APPS_VITA[0].id);
  });
  it("3DS HOME suspends software immediately and resumes; System Settings closes through its own menu", () => {
    let s = reduce(boot("3ds"), { type: "open", app: "health" });
    s = reduce(s, { type: "home" });
    expect(s.phase).toBe("home");
    expect(s.suspended).toBe("health");
    s = reduce(s, { type: "home" });
    expect(s.phase).toBe("app");
    expect(s.app).toBe("health");
    s = reduce(boot("3ds"), { type: "open", app: "settings" });
    s = reduce(s, { type: "home" });
    expect(s.phase).toBe("app");
    s = button(s, "B");
    expect(s.phase).toBe("home");
  });
});
describe("effective system settings", () => {
  it("3DS Profile is a nested page and brightness stays in the HOME menu", () => {
    let s = reduce(boot("3ds"), { type: "open", app: "settings" });
    s = reduce(s, { type: "section", name: "Other Settings" });
    s = button(s, "A");
    expect(s.section).toBe("Profile");
    s = button(s, "A");
    expect(s.editor).toBe("nickname");
    s = button(s, "B");
    s = button(s, "B");
    expect(s.section).toBe("Other Settings");
    expect(s.selection).toBe(0);
  });
  it("manual clock settings are applied and invalid dates do not silently roll over", () => {
    let s = reduce(boot("ds"), { type: "open", app: "settings" });
    s = reduce(s, { type: "section", name: "Clock" });
    s = reduce(s, { type: "edit", key: "date" });
    s = reduce(s, { type: "draft", value: "2026-02-30" });
    s = reduce(s, { type: "commit", now: 1794230000000 });
    expect(s.dialog).toContain("valid date");
    s = reduce(s, { type: "dismiss" });
    s = reduce(s, { type: "draft", value: "2026-11-20" });
    s = reduce(s, { type: "commit", now: 1794230000000 });
    expect(Number(s.prefs.clockOffset)).not.toBe(0);
    expect(s.editor).toBe("");
  });
  it("destructive system settings require confirmation before clearing preferences", () => {
    let s = reduce(boot("psp"), {
      type: "set",
      key: "colour",
      value: "Purple",
    });
    s = reduce(s, { type: "open", app: "settings" });
    s = reduce(s, { type: "section", name: "System Settings" });
    s = reduce(s, { type: "edit", key: "restore" });
    expect(s.pending).toBe("setting:restore");
    expect(s.prefs.colour).toBe("Purple");
    s = button(s, "B");
    expect(s.prefs.colour).toBe("Purple");
    s = reduce(s, { type: "edit", key: "restore" });
    s = button(s, "A");
    expect(s.prefs).toEqual({});
  });
});
it("restoring settings preserves user-created notes and Mii data", () => {
  let s = reduce(boot("vita"), {
    type: "set",
    key: "notes",
    value: '[{"text":"Keep me"}]',
  });
  s = reduce(s, { type: "set", key: "colour", value: "Purple" });
  s = reduce(s, { type: "open", app: "settings" });
  s = reduce(s, { type: "start" });
  s = reduce(s, { type: "section", name: "Format" });
  s = reduce(s, { type: "edit", key: "restore" });
  s = button(s, "A");
  expect(s.prefs.notes).toContain("Keep me");
  expect(s.prefs.colour).toBeUndefined();
});
