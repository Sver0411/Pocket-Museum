import { DEVICES } from "../devices";
import { storage } from "./database";
import type { Save } from "./database";

const keys = [
  "deviceDisplay:v1", "selectedGame", "selectedGame:gb", "selectedGame:nds",
  "lastPlayed", ...DEVICES.map(({ id }) => `system:${id}`),
];
const format = "pocket-museum-backup";

function encode(bytes: Uint8Array) {
  let binary = "";
  for (let start = 0; start < bytes.length; start += 8192)
    binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
  return btoa(binary);
}

export async function exportBackup() {
  const [saves, entries] = await Promise.all([
    storage.listSaves(),
    Promise.all(keys.map(async (key) => [key, await storage.getSetting(key)] as const)),
  ]);
  return JSON.stringify({
    format,
    version: 1,
    settings: Object.fromEntries(entries),
    saves: saves.map((save) => ({ ...save, data: encode(save.data) })),
  });
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validSettings(key: string, value: unknown) {
  if (key.startsWith("system:"))
    return record(value) && Object.values(value).every((entry) => typeof entry === "string");
  if (key.startsWith("selectedGame"))
    return typeof value === "string" && /^(?:[a-f0-9]{64})?$/.test(value);
  if (key === "lastPlayed")
    return record(value) && DEVICES.some(({ id }) => value.device === id) &&
      typeof value.gameId === "string" && /^[a-f0-9]{64}$/.test(value.gameId);
  return record(value) && Object.entries(value).every(([id, profile]) =>
    DEVICES.some((device) => device.id === id) && record(profile) &&
    typeof profile.light === "boolean" && typeof profile.muted === "boolean" &&
    typeof profile.volume === "number" && profile.volume >= 0 && profile.volume <= 100 &&
    record(profile.hardware) && Object.values(profile.hardware).every(Number.isFinite) &&
    typeof profile.headphones === "boolean",
  );
}

export async function importBackup(file: File) {
  const invalid = new Error("备份文件格式不正确");
  if (file.size > 128 * 1024 * 1024) throw new Error("备份超过 128 MB");
  const data: unknown = JSON.parse(await file.text());
  if (!record(data) || data.format !== format || data.version !== 1 ||
      !record(data.settings) || !Array.isArray(data.saves)) throw invalid;
  for (const [key, value] of Object.entries(data.settings))
    if (!keys.includes(key) || !validSettings(key, value)) throw invalid;
  const saves: Save[] = data.saves.map((save: unknown) => {
    if (!record(save) || typeof save.gameId !== "string" || !/^[a-f0-9]{64}$/.test(save.gameId) ||
        (save.kind !== "native" && save.kind !== "state") ||
        (save.core !== "mgba" && save.core !== "desmume") || save.version !== "4.2.3" ||
        typeof save.updatedAt !== "number" || !Number.isSafeInteger(save.updatedAt) ||
        typeof save.data !== "string") throw invalid;
    const bytes = Uint8Array.from(atob(save.data), (character) => character.charCodeAt(0));
    if (!bytes.length) throw invalid;
    return { gameId: save.gameId, kind: save.kind, core: save.core,
      updatedAt: save.updatedAt, version: save.version, data: bytes };
  });
  await storage.restoreBackup(saves, data.settings);
}
