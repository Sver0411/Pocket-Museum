import { describe, it, expect } from "vitest";
import { projectiveMatrix } from "../src/components/projection";
import { DEVICES } from "../src/devices";
import { FLAT_VIEWS, presentationDevice } from "../src/flatDevices";
import type { Quad } from "../src/components/projection";

describe("panel geometry", () => {
  it("maps angled LCD corners to their photographed glass window", () => {
    for (const d of DEVICES)
      for (const screen of d.screens.filter((s) => s.quad)) {
        const source: Quad = [
            [0, 0],
            [screen.w, 0],
            [screen.w, screen.h],
            [0, screen.h],
          ],
          target = screen.quad!.map(([x, y]) => [
            x - screen.x,
            y - screen.y,
          ]) as unknown as Quad,
          m = projectiveMatrix(source, target);
        source.forEach(([x, y], i) => {
          const w = m[3] * x + m[7] * y + 1;
          expect((m[0] * x + m[4] * y + m[12]) / w).toBeCloseTo(
            target[i][0],
            6,
          );
          expect((m[1] * x + m[5] * y + m[13]) / w).toBeCloseTo(
            target[i][1],
            6,
          );
        });
      }
  });
  it("flat play selects independent art with round controls and native LCD proportions", () => {
    expect(Object.keys(FLAT_VIEWS).sort()).toEqual(["3ds", "ds", "sp"]);
    for (const original of DEVICES.filter((d) => d.lid)) {
      const d = presentationDevice(original, true);
      expect(d.asset).not.toBe(original.asset);
      expect(d.view).toBe("flat");
      expect(d.screens.every((s) => !s.quad)).toBe(true);
      expect(d.keys.find((k) => k.button === "A")!.w).toBe(
        d.keys.find((k) => k.button === "A")!.h,
      );
      for (const s of d.analogs ?? []) expect(s.w).toBe(s.h);
      expect(presentationDevice(original, false)).toBe(original);
      const ratios = d.screens.map((s) => s.w / s.h);
      expect(ratios).toEqual(
        d.id === "sp"
          ? [3 / 2]
          : d.id === "ds"
            ? [4 / 3, 4 / 3]
            : [5 / 3, 4 / 3],
      );
    }
  });
});
