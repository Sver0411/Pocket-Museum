import { it, expect } from "vitest";
import { cartridgeTitle } from "../src/emulator/cartridge";
const header = (offset: number, text: string) => {
  const b = new Uint8Array(512);
  b.set(new TextEncoder().encode(text), offset);
  return b;
};
it("recognizes regional cartridge headers without relying on filenames or changing bytes", () => {
  for (const code of ["BPRE", "BPRJ", "BPRD"]) {
    const b = header(0xac, code),
      before = b.slice();
    expect(cartridgeTitle(b, "gba")).toBe("宝可梦 火红");
    expect(b).toEqual(before);
  }
  expect(cartridgeTitle(header(0xc, "ADAE"), "nds")).toBe("宝可梦 钻石");
  expect(cartridgeTitle(header(0x134, "POKEMON RED"), "gb")).toBe("宝可梦 红");
  expect(cartridgeTitle(header(0xac, "????"), "gba")).toBeUndefined();
  expect(cartridgeTitle(new Uint8Array(), "gba")).toBeUndefined();
});
