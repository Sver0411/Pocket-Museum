import type { DeviceDefinition } from "../devices";
/** Native pixel geometry; mode switches move existing LCD nodes, never recreate the core. */
export function focusDevice(d: DeviceDefinition): DeviceDefinition {
  if (d.id !== "gb" && d.id !== "sp") return d;
  const [w, h] = d.id === "gb" ? [160, 144] : [240, 160];
  return {
    ...d,
    width: w,
    height: h,
    viewport: { x: 0, y: 0, w, h },
    lid: d.lid ? { x: 0, y: 0, w, h } : undefined,
    folded: undefined,
    screens: [{ x: 0, y: 0, w, h, lid: !!d.lid }],
    sliders: [],
    powerKey: undefined,
    led: undefined,
    lightKey: undefined,
    analogs: [],
    utilityKeys: [],
  };
}
