import { describe, it, expect, vi } from "vitest";
import { InputController, readGamepads } from "../src/input/InputController";
describe("physical input arbitration", () => {
  it("holds a button until every keyboard/pointer source releases", () => {
    const emit = vi.fn(),
      c = new InputController(emit);
    c.setEnabled(true);
    c.set("key:KeyX", "A", true);
    c.set("touch:1", "A", true);
    c.set("key:KeyX", "A", true);
    c.set("key:KeyX", "A", false);
    expect(emit.mock.calls).toEqual([["A", true]]);
    c.set("touch:1", "A", false);
    expect(emit.mock.calls).toEqual([
      ["A", true],
      ["A", false],
    ]);
  });
  it("supports chords and releases everything on pause/blur", () => {
    const emit = vi.fn(),
      c = new InputController(emit);
    c.setEnabled(true);
    c.set("1", "L", true);
    c.set("2", "R", true);
    c.set("3", "Select", true);
    c.setEnabled(false);
    c.set("4", "A", true);
    expect(emit.mock.calls).toEqual([
      ["L", true],
      ["R", true],
      ["Select", true],
      ["L", false],
      ["R", false],
      ["Select", false],
    ]);
  });
  it("polls standard gamepad buttons and axes, releases on disconnect", () => {
    const emit = vi.fn(),
      c = new InputController(emit);
    c.setEnabled(true);
    const p = {
      index: 0,
      connected: true,
      mapping: "standard",
      axes: [-0.9, 0.8],
      buttons: Array.from({ length: 16 }, (_, i) => ({
        pressed: i === 0 || i === 5,
      })),
    } as Gamepad;
    readGamepads([p], c);
    expect(emit.mock.calls).toEqual(
      expect.arrayContaining([
        ["A", true],
        ["R", true],
        ["Left", true],
        ["Down", true],
      ]),
    );
    readGamepads([], c);
    expect(emit.mock.calls).toEqual(
      expect.arrayContaining([
        ["A", false],
        ["R", false],
        ["Left", false],
        ["Down", false],
      ]),
    );
  });
});
describe("input and physical feedback are separate", () => {
  it("keeps native analog input separate from D-pad and resumes the same vector after blur", () => {
    const emit = vi.fn(),
      axis = vi.fn(),
      c = new InputController(emit);
    c.setAnalogHandler(axis);
    c.setEnabled(true);
    c.analog("stick:left", 0.7, -0.5);
    c.analog("stick:left", 0.7, -0.5);
    expect(axis.mock.calls).toEqual([[0.7, -0.5]]);
    expect(emit).not.toHaveBeenCalled();
    c.set("pointer:1", "Up", true);
    c.setEnabled(false);
    expect(axis.mock.lastCall).toEqual([0, 0]);
    expect(emit.mock.lastCall).toEqual(["Up", false]);
    c.setEnabled(true);
    c.analog("stick:left", 0.7, -0.5);
    expect(axis.mock.lastCall).toEqual([0.7, -0.5]);
    c.analog("pad:0:axis", -0.9, 0);
    c.releasePrefix("pad:0:");
    expect(axis.mock.lastCall).toEqual([0.7, -0.5]);
    c.releaseAll();
    expect(axis.mock.lastCall).toEqual([0, 0]);
  });
  it("stick movement reaches logical input while only independent digital owners animate the D-pad", () => {
    const emit = vi.fn(),
      change = vi.fn(),
      c = new InputController(emit, change);
    c.setEnabled(true);
    c.set("stick:left:Right", "Right", true);
    expect(change.mock.lastCall?.[0]).toEqual(new Set(["Right"]));
    expect(change.mock.lastCall?.[1]).toEqual(new Set());
    c.set("pointer:4", "Right", true);
    expect(change.mock.lastCall?.[1]).toEqual(new Set(["Right"]));
    c.set("pointer:4", "Right", false);
    expect(change.mock.lastCall?.[1]).toEqual(new Set());
    expect(emit.mock.calls).toEqual([["Right", true]]);
    c.releasePrefix("stick:");
    expect(emit.mock.lastCall).toEqual(["Right", false]);
  });
});
