import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { storage, identify, importRom } from "../src/storage/database";
import { readFile } from "node:fs/promises";
describe("local persistence", () => {
  it("keeps same-named ROMs and native/state saves isolated by content hash", async () => {
    const a = await identify(new Uint8Array([1])),
      b = await identify(new Uint8Array([2]));
    expect(a).not.toBe(b);
    await storage.putSave(a, "native", new Uint8Array([7, 8]));
    await storage.putSave(a, "state", new Uint8Array([9]));
    await storage.putSave(b, "native", new Uint8Array([3]));
    expect((await storage.getSave(a, "native"))?.data).toEqual(
      new Uint8Array([7, 8]),
    );
    expect((await storage.getSave(a, "state"))?.data).toEqual(
      new Uint8Array([9]),
    );
    expect((await storage.getSave(b, "native"))?.data).toEqual(
      new Uint8Array([3]),
    );
    expect(await storage.getSave(b, "state")).toBeUndefined();
  });
  it("validates local ROM extension, size and GBA header", async () => {
    await expect(importRom(new File(["bad"], "bad.gba"))).rejects.toThrow(
      "大小",
    );
    await expect(
      importRom(new File([new Uint8Array(200)], "bad.zip")),
    ).rejects.toThrow(".gba");
    await expect(
      importRom(new File([new Uint8Array(200)], "bad.gba")),
    ).rejects.toThrow("文件头");
    const bytes = await readFile("public/roms/2048.gba");
    const game = await importRom(new File([bytes], "2048.gba"));
    expect(game.bytes.length).toBe(262144);
    expect(game.id).toHaveLength(64);
  });
});
describe("native media persistence", () => {
  it("keeps local media isolated per machine and supports scoped deletion", async () => {
    const common = {
      kind: "image" as const,
      name: "photo.png",
      blob: new Blob(["test"], { type: "image/png" }),
      createdAt: Date.now(),
    };
    await storage.putMedia({ ...common, id: "media-a", device: "3ds" });
    await storage.putMedia({ ...common, id: "media-b", device: "vita" });
    expect((await storage.media("3ds")).map((x) => x.id)).toEqual(["media-a"]);
    await storage.clearMedia("3ds");
    expect(await storage.media("3ds")).toHaveLength(0);
    expect((await storage.media("vita")).map((x) => x.id)).toEqual(["media-b"]);
  });
});

describe("multi-system ROM import", () => {
  it("validates GB checksum and DS ARM ranges while preserving SHA identities", async () => {
    const gb = await readFile("public/roms/snake.gb"),
      nds = await readFile("public/roms/jamclown.nds");
    const a = await importRom(new File([gb], "snake.gb"), ["gb", "gbc"]);
    const b = await importRom(new File([nds], "jamclown.nds"), ["nds"]);
    expect(a.system).toBe("gb");
    expect(b.system).toBe("nds");
    expect(a.id).toBe(
      "94f66ec5063b33bea89ed80ed05334e1655bcc71114d2c9a33a953aa368bb049",
    );
    await expect(
      importRom(new File([nds], "wrong.nds"), ["gba"]),
    ).rejects.toThrow(".gba");
    const corruptGb = new Uint8Array(gb);
    corruptGb[0x14d] ^= 1;
    await expect(
      importRom(new File([corruptGb], "bad.gb"), ["gb"]),
    ).rejects.toThrow("校验和");
    const corruptDs = new Uint8Array(nds);
    new DataView(corruptDs.buffer).setUint32(0x20, 0x7fffffff, true);
    await expect(
      importRom(new File([corruptDs], "bad.nds"), ["nds"]),
    ).rejects.toThrow("ARM");
    await storage.putSave(b.id, "state", new Uint8Array([1, 2]), "desmume");
    expect((await storage.getSave(b.id, "state"))?.core).toBe("desmume");
  });
});
