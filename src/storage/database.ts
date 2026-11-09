export interface Game {
  id: string;
  name: string;
  bytes: Uint8Array;
  importedAt: number;
  demo?: boolean;
}
export interface MediaItem {
  id: string;
  device: string;
  kind: "image" | "audio" | "video";
  name: string;
  blob: Blob;
  createdAt: number;
}
export interface Save {
  gameId: string;
  kind: "native" | "state";
  data: Uint8Array;
  updatedAt: number;
  core: "mgba";
  version: "4.2.3";
}
let connection: Promise<IDBDatabase> | undefined;
function db() {
  return (connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("pocketsp", 2);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains("games"))
        r.result.createObjectStore("games", { keyPath: "id" });
      if (!r.result.objectStoreNames.contains("saves"))
        r.result.createObjectStore("saves", { keyPath: ["gameId", "kind"] });
      if (!r.result.objectStoreNames.contains("settings"))
        r.result.createObjectStore("settings");
      if (!r.result.objectStoreNames.contains("media"))
        r.result.createObjectStore("media", { keyPath: "id" });
    };
    r.onsuccess = () => {
      r.result.onversionchange = () => {
        r.result.close();
        connection = undefined;
      };
      resolve(r.result);
    };
    r.onerror = () => {
      connection = undefined;
      reject(r.error);
    };
  }));
}
async function transact<T>(
  store: string,
  mode: IDBTransactionMode,
  operation: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const t = database.transaction(store, mode),
      r = operation(t.objectStore(store));
    t.oncomplete = () => resolve(r.result);
    t.onerror = () => reject(t.error || r.error);
    t.onabort = () => reject(t.error || new Error("存储事务被中断"));
  });
}
export const storage = {
  media: async (device: string, kind?: MediaItem["kind"]) =>
    (await transact<MediaItem[]>("media", "readonly", (s) => s.getAll()))
      .filter((m) => m.device === device && (!kind || m.kind === kind))
      .sort((a, b) => b.createdAt - a.createdAt),
  putMedia: (item: MediaItem) =>
    transact("media", "readwrite", (s) => s.put(item)),
  deleteMedia: (id: string) =>
    transact("media", "readwrite", (s) => s.delete(id)),
  clearMedia: async (device: string) => {
    const list = await storage.media(device);
    await Promise.all(list.map((m) => storage.deleteMedia(m.id)));
  },

  games: () => transact<Game[]>("games", "readonly", (s) => s.getAll()),
  putGame: (game: Game) => transact("games", "readwrite", (s) => s.put(game)),
  getSave: (id: string, kind: Save["kind"]) =>
    transact<Save | undefined>("saves", "readonly", (s) => s.get([id, kind])),
  putSave: (gameId: string, kind: Save["kind"], data: Uint8Array) =>
    transact("saves", "readwrite", (s) =>
      s.put({
        gameId,
        kind,
        data: new Uint8Array(data),
        updatedAt: Date.now(),
        core: "mgba",
        version: "4.2.3",
      } satisfies Save),
    ),
  getSetting: <T>(key: string) =>
    transact<T | undefined>("settings", "readonly", (s) => s.get(key)),
  putSetting: (key: string, value: unknown) =>
    transact("settings", "readwrite", (s) => s.put(value, key)),
};
export async function identify(bytes: Uint8Array) {
  const hash = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export async function importRom(file: File): Promise<Game> {
  if (!/\.gba$/i.test(file.name)) throw new Error("请选择 .gba 格式的游戏文件");
  if (file.size < 192 || file.size > 32 * 1024 * 1024)
    throw new Error("ROM 大小应在 192 B 至 32 MB 之间");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0xb2] !== 0x96)
    throw new Error("无效的 GBA 文件头，请选择完整的 .gba ROM");
  return {
    id: await identify(bytes),
    name: file.name.replace(/\.gba$/i, ""),
    bytes,
    importedAt: Date.now(),
  };
}

if (import.meta.hot)
  import.meta.hot.dispose(() => {
    void connection?.then((database) => database.close());
    connection = undefined;
  });
