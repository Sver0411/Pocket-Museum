import { useSyncExternalStore } from "react";
import type { DeviceId } from "../devices";
import { storage } from "../storage/database";

export interface SystemResources {
  format: 1;
  device: DeviceId;
  icons: Record<string, string>;
  backgrounds: Record<string, string>;
  banners: Record<string, string>;
  font?: string;
}
type ResourceManifest = Omit<
  SystemResources,
  "icons" | "backgrounds" | "banners"
> & {
  icons?: Record<string, string>;
  backgrounds?: Record<string, string>;
  banners?: Record<string, string>;
};
const packs: Partial<Record<DeviceId, SystemResources>> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
const key = (device: DeviceId) => `systemResources:v1:${device}`;
const standalone = () => window.__POCKETSP_STANDALONE__ === true;
const fonts = new Map<DeviceId, FontFace>();
async function installFont(pack: SystemResources) {
  const previous = fonts.get(pack.device);
  if (previous) {
    document.fonts.delete(previous);
    fonts.delete(pack.device);
  }
  if (!pack.font) return;
  const font = new FontFace(
    `PocketMuseum-${pack.device}`,
    `url(${JSON.stringify(pack.font)})`,
  );
  await font.load();
  document.fonts.add(font);
  fonts.set(pack.device, font);
}
export function useSystemResources(device: DeviceId) {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => packs[device],
  );
}
export async function restoreSystemResources() {
  await Promise.all(
    (["3ds", "psp", "vita"] as DeviceId[]).map(async (device) => {
      try {
        const pack = standalone()
          ? JSON.parse(localStorage.getItem(key(device)) ?? "null")
          : await storage.getSetting<SystemResources>(key(device));
        if (!pack || pack.format !== 1 || pack.device !== device) return;
        await installFont(pack);
        packs[device] = pack;
      } catch {
        /* A broken user font must not prevent the machine from booting. */
      }
    }),
  );
  emit();
}
async function dataUrl(file: File, font = false) {
  if (file.size > (font ? 4 : 8) * 1024 * 1024 || file.size === 0)
    throw Error(`素材大小无效：${file.name}`);
  if (
    font
      ? !/\.(ttf|otf|woff2?)$/i.test(file.name)
      : !/\.(png|jpe?g|webp)$/i.test(file.name)
  )
    throw Error(`不支持此素材格式：${file.name}`);
  if (!font) {
    const image = await createImageBitmap(file);
    const valid =
      image.width >= 8 &&
      image.height >= 8 &&
      image.width <= 4096 &&
      image.height <= 4096;
    image.close();
    if (!valid) throw Error(`图片尺寸应在 8–4096 像素之间：${file.name}`);
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
/** Folder manifests contain local relative paths only. No URL fetching or firmware redistribution. */
export async function importSystemResources(files: File[], device: DeviceId) {
  const manifestFile = files.find((f) => f.name === "pocket-museum-theme.json");
  if (!manifestFile)
    throw Error(
      "文件夹缺少 pocket-museum-theme.json；格式见项目 docs/SYSTEM_RESOURCES.md",
    );
  if (manifestFile.size > 65536) throw Error("系统资源清单过大");
  const manifest = JSON.parse(await manifestFile.text()) as ResourceManifest;
  if (manifest.format !== 1 || manifest.device !== device)
    throw Error("系统资源格式或机型与当前掌机不一致");
  if (files.reduce((n, f) => n + f.size, 0) > 32 * 1024 * 1024)
    throw Error("系统资源文件夹最大 32 MiB");
  const base = manifestFile.webkitRelativePath
    .split("/")
    .slice(0, -1)
    .join("/");
  const resolve = (path: string) => {
    if (typeof path !== "string" || /(^\/|\\|:|(^|\/)\.\.($|\/))/.test(path))
      throw Error("素材必须使用文件夹内的相对路径");
    const target = base ? `${base}/${path}` : path;
    const file = files.find((f) => (f.webkitRelativePath || f.name) === target);
    if (!file) throw Error(`找不到素材：${path}`);
    return file;
  };
  const readMap = async (map?: Record<string, string>) => {
    if (!map) return {};
    const entries = Object.entries(map);
    if (entries.length > 150) throw Error("每种素材最多 150 项");
    return Object.fromEntries(
      await Promise.all(
        entries.map(async ([name, path]) => [
          name,
          await dataUrl(resolve(path)),
        ]),
      ),
    );
  };
  const pack: SystemResources = {
    format: 1,
    device,
    icons: await readMap(manifest.icons),
    backgrounds: await readMap(manifest.backgrounds),
    banners: await readMap(manifest.banners),
    font: manifest.font
      ? await dataUrl(resolve(manifest.font), true)
      : undefined,
  };
  if (pack.font) {
    const check = new FontFace(
      "PocketMuseum-validation",
      `url(${JSON.stringify(pack.font)})`,
    );
    await check.load();
  }
  if (standalone()) localStorage.setItem(key(device), JSON.stringify(pack));
  else await storage.putSetting(key(device), pack);
  await installFont(pack);
  packs[device] = pack;
  emit();
}
export async function clearSystemResources(device: DeviceId) {
  if (standalone()) localStorage.removeItem(key(device));
  else await storage.putSetting(key(device), null);
  await installFont({
    format: 1,
    device,
    icons: {},
    backgrounds: {},
    banners: {},
  });
  delete packs[device];
  emit();
}
