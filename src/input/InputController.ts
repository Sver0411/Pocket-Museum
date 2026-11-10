import { BUTTONS } from "../emulator/protocol";
import type { Button } from "../emulator/protocol";
export const KEY_MAP: Record<string, Button> = {
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  KeyW: "Up",
  KeyS: "Down",
  KeyA: "Left",
  KeyD: "Right",
  KeyX: "A",
  KeyZ: "B",
  KeyC: "X",
  KeyV: "Y",
  KeyQ: "L",
  KeyE: "R",
  Enter: "Start",
  ShiftRight: "Select",
  ShiftLeft: "Select",
};
/** Each device/key/pointer owns a source. A button is released only after its last owner. */
export class InputController {
  private sources = new Map<string, Button>();
  private enabled = false;
  private lastAnalog = { x: 0, y: 0 };
  private analogHandler?: (x: number, y: number) => void;
  private analogSources = new Map<string, { x: number; y: number }>();
  setAnalogHandler(handler?: (x: number, y: number) => void) {
    this.analogHandler?.(0, 0);
    this.analogSources.clear();
    this.lastAnalog = { x: 0, y: 0 };
    this.analogHandler = handler;
  }
  analog(source: string, x: number, y: number) {
    if (!this.analogHandler) return false;
    if (!this.enabled && (x || y)) return true;
    if (x || y) this.analogSources.set(source, { x, y });
    else this.analogSources.delete(source);
    let point = { x: 0, y: 0 };
    for (const p of this.analogSources.values())
      if (Math.hypot(p.x, p.y) >= Math.hypot(point.x, point.y)) point = p;
    if (point.x !== this.lastAnalog.x || point.y !== this.lastAnalog.y) {
      this.lastAnalog = point;
      this.analogHandler(point.x, point.y);
    }
    return true;
  }
  constructor(
    private emit: (button: Button, pressed: boolean) => void,
    private change: (
      pressed: Set<Button>,
      visual: Set<Button>,
    ) => void = () => {},
  ) {}
  setEnabled(enabled: boolean) {
    if (!enabled) this.releaseAll();
    this.enabled = enabled;
  }
  set(source: string, button: Button, pressed: boolean) {
    if (!this.enabled && pressed) return;
    if (pressed) {
      if (this.sources.get(source) === button) return;
      this.release(source);
      const held = [...this.sources.values()].includes(button);
      this.sources.set(source, button);
      if (!held) this.emit(button, true);
    } else {
      if (!this.sources.has(source)) return;
      this.release(source);
    }
    this.publish();
  }
  private publish() {
    const visual = new Set<Button>();
    for (const [source, button] of this.sources)
      if (!source.startsWith("stick:") && !source.includes(":axis:"))
        visual.add(button);
    this.change(new Set(this.sources.values()), visual);
  }
  private release(source: string) {
    const button = this.sources.get(source);
    if (!button) return;
    this.sources.delete(source);
    if (![...this.sources.values()].includes(button)) this.emit(button, false);
  }
  releasePrefix(prefix: string) {
    for (const source of [...this.analogSources.keys()])
      if (source.startsWith(prefix)) this.analog(source, 0, 0);
    let changed = false;
    for (const source of [...this.sources.keys()])
      if (source.startsWith(prefix)) {
        this.release(source);
        changed = true;
      }
    if (changed) this.publish();
  }
  releaseAll() {
    this.analogSources.clear();
    this.lastAnalog = { x: 0, y: 0 };
    this.analogHandler?.(0, 0);
    for (const b of new Set(this.sources.values())) this.emit(b, false);
    this.sources.clear();
    this.publish();
  }
}
const PAD_BUTTONS: Record<number, Button> = {
  0: "A",
  1: "B",
  2: "X",
  3: "Y",
  4: "L",
  5: "R",
  8: "Select",
  9: "Start",
  12: "Up",
  13: "Down",
  14: "Left",
  15: "Right",
};
export function readGamepads(
  pads: readonly (Gamepad | null)[],
  input: InputController,
) {
  const connected = new Set<number>();
  for (const pad of pads) {
    if (!pad || !pad.connected || pad.mapping !== "standard") continue;
    connected.add(pad.index);
    const analogOwned = input.analog(
      `pad:${pad.index}:axis`,
      pad.axes[0] ?? 0,
      pad.axes[1] ?? 0,
    );
    for (const b of BUTTONS) {
      const pressed = Object.entries(PAD_BUTTONS).some(
        ([i, key]) => key === b && pad.buttons[+i]?.pressed,
      );
      input.set(`pad:${pad.index}:button:${b}`, b, pressed);
      const axis =
        !analogOwned &&
        (b === "Left"
          ? pad.axes[0] < -0.35
          : b === "Right"
            ? pad.axes[0] > 0.35
            : b === "Up"
              ? pad.axes[1] < -0.35
              : b === "Down"
                ? pad.axes[1] > 0.35
                : false);
      input.set(`pad:${pad.index}:axis:${b}`, b, axis);
    }
  }
  // Browsers expose at most a few pads. Explicitly clear disconnected indices.
  for (let i = 0; i < 16; i++)
    if (!connected.has(i)) input.releasePrefix(`pad:${i}:`);
  return [...connected];
}
