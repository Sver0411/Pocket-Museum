export const CHANNEL = "pocketsp:v1";
export const BUTTONS = [
  "Up",
  "Down",
  "Left",
  "Right",
  "A",
  "B",
  "L",
  "R",
  "Start",
  "Select",
  "X",
  "Y",
] as const;
export type Button = (typeof BUTTONS)[number];
// Libretro's RetroPad indices, as used by EmulatorJS 4.2.3.
export const RETROPAD: Record<Button, number> = {
  B: 0,
  Select: 2,
  Start: 3,
  Up: 4,
  Down: 5,
  Left: 6,
  Right: 7,
  A: 8,
  L: 10,
  R: 11,
  X: 9,
  Y: 1,
};
export type Command =
  | { type: "hello" }
  | { type: "start"; rom: Uint8Array; gameId: string; nativeSave?: Uint8Array }
  | { type: "input"; button: Button; pressed: boolean }
  | { type: "pause"; paused: boolean }
  | { type: "volume"; volume: number }
  | { type: "save-state" }
  | { type: "load-state"; data: Uint8Array }
  | { type: "save-native" }
  | { type: "load-native"; data: Uint8Array };
export interface Request {
  channel: typeof CHANNEL;
  session: string;
  id: number;
  command: Command;
}
export interface Response {
  channel: typeof CHANNEL;
  session: string;
  id: number;
  ok: boolean;
  data?: Uint8Array | null;
  error?: string;
}
export function isCommand(c: unknown): c is Command {
  if (!c || typeof c !== "object" || !("type" in c)) return false;
  const v = c as Record<string, unknown>;
  switch (v.type) {
    case "hello":
    case "save-state":
    case "save-native":
      return true;
    case "start":
      return (
        v.rom instanceof Uint8Array &&
        v.rom.length >= 192 &&
        v.rom.length <= 32 * 1024 * 1024 &&
        typeof v.gameId === "string" &&
        /^[a-f0-9]{64}$/.test(v.gameId) &&
        (v.nativeSave === undefined || v.nativeSave instanceof Uint8Array)
      );
    case "input":
      return (
        BUTTONS.includes(v.button as Button) && typeof v.pressed === "boolean"
      );
    case "pause":
      return typeof v.paused === "boolean";
    case "volume":
      return typeof v.volume === "number" && v.volume >= 0 && v.volume <= 1;
    case "load-state":
    case "load-native":
      return (
        v.data instanceof Uint8Array &&
        v.data.length > 0 &&
        v.data.length <= 16 * 1024 * 1024
      );
    default:
      return false;
  }
}
