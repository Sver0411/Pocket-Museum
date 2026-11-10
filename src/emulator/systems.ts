import type { DeviceId } from "../devices";

export type GameSystem = "gb" | "gbc" | "gba" | "nds";
export type Core = "mgba" | "desmume";
export interface SystemAdapterConfig {
  core: Core;
  systems: readonly GameSystem[];
  extensions: string;
  label: string;
  maxMiB: number;
  width: number;
  height: number;
  screens: number;
  touch: boolean;
}
// Each physical model has an explicit adapter. Unsupported machines never fall back to mGBA.
export const DEVICE_ADAPTERS: Partial<Record<DeviceId, SystemAdapterConfig>> = {
  gb: {
    core: "mgba",
    systems: ["gb", "gbc"],
    extensions: ".gb,.gbc",
    label: "GB / GBC",
    maxMiB: 8,
    width: 160,
    height: 144,
    screens: 1,
    touch: false,
  },
  gba: {
    core: "mgba",
    systems: ["gba"],
    extensions: ".gba",
    label: "GBA",
    maxMiB: 32,
    width: 240,
    height: 160,
    screens: 1,
    touch: false,
  },
  sp: {
    core: "mgba",
    systems: ["gba"],
    extensions: ".gba",
    label: "GBA",
    maxMiB: 32,
    width: 240,
    height: 160,
    screens: 1,
    touch: false,
  },
  ds: {
    core: "desmume",
    systems: ["nds"],
    extensions: ".nds",
    label: "NDS",
    maxMiB: 256,
    width: 256,
    height: 192,
    screens: 2,
    touch: true,
  },
};
export function gameSystem(game: { system?: GameSystem }): GameSystem {
  return game.system ?? "gba"; // v1/v2 games retain the same identity and GBA save format.
}
export function acceptsGame(device: DeviceId, game: { system?: GameSystem }) {
  return DEVICE_ADAPTERS[device]?.systems.includes(gameSystem(game)) ?? false;
}
export function coreFor(system: GameSystem): Core {
  return system === "nds" ? "desmume" : "mgba";
}
export const DEMOS: {
  id: string;
  description: string;
  url: string;
  name: string;
  system: GameSystem;
  license: string;
}[] = [
  {
    id: "0a0e8018dbbc8d7f8cd99f05e7cdc7b4cc9e358ecfe9377ebfb2291a84c6e310",
    description: "弹跳平台冒险 · Start 开始，方向键移动，A 冲刺。",
    url: "/roms/tobudx.gb",
    name: "Tobu Tobu Girl Deluxe",
    system: "gb",
    license: "MIT / CC BY 4.0",
  },
  {
    id: "6c6cfe318b1c724a29c5e08516a15e5ace354e32b2a04a08d388cfeb4c65ee58",
    description: "方向键移动方块，A 开始，拼出 2048。",
    url: "/roms/2048.gba",
    name: "2048 Advance",
    system: "gba",
    license: "CC0",
  },
  {
    id: "94f66ec5063b33bea89ed80ed05334e1655bcc71114d2c9a33a953aa368bb049",
    description: "Start 开始，方向键转向，收集食物。",
    url: "/roms/snake.gb",
    name: "GB Snake",
    system: "gb",
    license: "MIT / BSD-3-Clause",
  },
  {
    id: "21c020cb71997de4cb487d65f0a301679bfb3d4855baa49c36ee72d17d866ccd",
    description: "方向键移动，A 跳跃，B 射击。",
    url: "/roms/jamclown.nds",
    name: "JamClown",
    system: "nds",
    license: "MIT",
  },
];
