import type { Frame, Page } from "@playwright/test";
import { createHash } from "node:crypto";

export function fingerprint(bytes: number[]) {
  return {
    length: bytes.length,
    sha256: createHash("sha256").update(Buffer.from(bytes)).digest("hex"),
  };
}
export function differences(expected: number[], actual: number[]) {
  let count = 0;
  let first = -1;
  for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
    if (expected[i] !== actual[i]) {
      count++;
      if (first === -1) first = i;
    }
  }
  return {
    count,
    first,
    expectedAtFirst: expected[first],
    actualAtFirst: actual[first],
  };
}
/** Observe the real HEAP bytes passed by cmd_savefiles to Emscripten FS.write. */
export async function nativeSnapshot(frame: Frame) {
  return frame.evaluate(() => {
    const gm = (window as any).EJS_emulator.gameManager;
    const path = gm.getSaveFilePath();
    const writes: number[] = [];
    const write = gm.FS.write;
    gm.FS.write = function (
      stream: any,
      buffer: Uint8Array,
      offset: number,
      length: number,
      ...rest: any[]
    ) {
      if (stream.path === path && buffer.buffer === gm.Module.HEAPU8.buffer)
        for (const byte of new Uint8Array(
          buffer.buffer,
          buffer.byteOffset + offset,
          length,
        ))
          writes.push(byte);
      return write.call(this, stream, buffer, offset, length, ...rest);
    };
    let exported: number[];
    try {
      exported = Array.from(gm.getSaveFile() || []);
    } finally {
      gm.FS.write = write;
    }
    return {
      frame: gm.functions.getFrameNum(),
      path,
      memory: writes,
      filesystem: Array.from(gm.FS.readFile(path)) as number[],
      exported,
    };
  });
}
export async function nativeRecord(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{
        data: number[];
        gameId: string;
        core: string;
        version: string;
      }>((resolve, reject) => {
        const request = indexedDB.open("pocketsp", 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("saves");
          const all = transaction.objectStore("saves").getAll();
          transaction.oncomplete = () => {
            db.close();
            const save = all.result.find((s) => s.kind === "native");
            if (!save) return reject(new Error("Missing native save"));
            resolve({ ...save, data: Array.from(save.data) });
          };
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );
}
