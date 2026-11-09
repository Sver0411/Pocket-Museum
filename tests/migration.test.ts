import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { storage } from "../src/storage/database";
it("upgrades the original v1 database without deleting ROMs, saves or settings", async () => {
  const request = indexedDB.open("pocketsp", 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    db.createObjectStore("games", { keyPath: "id" });
    db.createObjectStore("saves", { keyPath: ["gameId", "kind"] });
    db.createObjectStore("settings");
  };
  const old = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const tx = old.transaction(["games", "settings"], "readwrite");
  tx.objectStore("games").put({
    id: "old-game",
    name: "Existing ROM",
    bytes: new Uint8Array([1, 2, 3]),
    importedAt: 1,
  });
  tx.objectStore("settings").put({ volume: 42 }, "display");
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  old.close();
  expect((await storage.games()).map((g) => g.id)).toContain("old-game");
  expect(await storage.getSetting("display")).toEqual({ volume: 42 });
  await storage.putMedia({
    id: "new-photo",
    device: "vita",
    kind: "image",
    name: "New photo",
    blob: new Blob(["photo"]),
    createdAt: 2,
  });
  expect(await storage.media("vita")).toHaveLength(1);
  expect((await storage.games())[0].name).toBe("Existing ROM");
});
