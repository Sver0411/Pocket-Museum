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
  url: string;
  name: string;
  system: GameSystem;
  license: string;
}[] = [
  {
    url: "/roms/2048.gba",
    name: "2048 Advance",
    system: "gba",
    license: "CC0",
  },
  {
    url: "/roms/snake.gb",
    name: "GB Snake",
    system: "gb",
    license: "MIT / BSD-3-Clause",
  },
  {
    url: "/roms/jamclown.nds",
    name: "JamClown",
    system: "nds",
    license: "MIT",
  },
];
