import type { Button } from "./emulator/protocol";
export { FLAT_VIEWS } from "./flatDevices";
export type DeviceId = "gb" | "gba" | "sp" | "ds" | "3ds" | "psp" | "vita";
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface DeviceKey extends Rect {
  button: Button;
  label?: string;
  round?: boolean;
}
export interface DeviceDefinition {
  id: DeviceId;
  label: string;
  name: string;
  asset: string;
  width: number;
  height: number;
  landscape?: boolean;
  viewport?: Rect;
  sliders?: (Rect & {
    id: "volume" | "contrast" | "depth";
    label: string;
    vertical?: boolean;
    lid?: boolean;
  })[];
  lid?: Rect;
  folded?: Rect;
  sleepOnClose?: boolean;
  view?: "flat";
  dpadOutline?: number[][];
  screens: (Rect & {
    lid?: boolean;
    quad?: import("./components/projection").Quad;
  })[];
  keys: DeviceKey[];
  lightKey?: Rect;
  powerKey?: Rect;
  led?: Rect;
  analogs?: (Rect & { id: string; light?: boolean })[];
  faceLabels?: Partial<Record<Button, string>>;
  utilityKeys?: (Rect & {
    id: string;
    label: string;
    action: "menu" | "volume-up" | "volume-down" | "sound" | "light";
    round?: boolean;
  })[];
}
export const DEVICES: DeviceDefinition[] = [
  {
    id: "sp",
    label: "GBA SP",
    name: "Game Boy Advance SP",
    asset: "/assets/silver-sp-v2.png",
    width: 1199,
    height: 1312,
    lid: { x: 216, y: 63, w: 764, h: 608 },
    folded: { x: 176, y: 757, w: 844, h: 426 },
    sleepOnClose: false,
    screens: [{ x: 334, y: 190, w: 532.5, h: 355, lid: true }],
    keys: [
      { button: "Up", x: 363, y: 828, w: 69, h: 54 },
      { button: "Down", x: 363, y: 910, w: 69, h: 50 },
      { button: "Left", x: 302, y: 868, w: 65, h: 54 },
      { button: "Right", x: 425, y: 868, w: 65, h: 54 },
      { button: "A", x: 814, y: 840, w: 94, h: 76, round: true },
      { button: "B", x: 688, y: 869, w: 94, h: 76, round: true },
      { button: "Select", x: 495, y: 1102, w: 65, h: 48, round: true },
      { button: "Start", x: 640, y: 1102, w: 65, h: 48, round: true },
      { button: "L", x: 229, y: 686, w: 68, h: 60, label: "L" },
      { button: "R", x: 897, y: 686, w: 68, h: 60, label: "R" },
    ],
    lightKey: { x: 570, y: 781, w: 58, h: 44 },
    powerKey: { x: 967, y: 837, w: 30, h: 80 },
    led: { x: 958, y: 790, w: 20, h: 12 },
  },
  {
    id: "gb",
    label: "Game Boy",
    name: "Game Boy",
    asset: "/assets/gb-v1.png",
    width: 1199,
    height: 1312,
    screens: [{ x: 398, y: 210, w: 407, h: 360 }],
    keys: [
      { button: "Up", x: 352, y: 754, w: 69, h: 67 },
      { button: "Down", x: 352, y: 884, w: 69, h: 67 },
      { button: "Left", x: 287, y: 819, w: 68, h: 67 },
      { button: "Right", x: 419, y: 819, w: 68, h: 67 },
      { button: "A", x: 818, y: 764, w: 99, h: 99, round: true },
      { button: "B", x: 695, y: 826, w: 99, h: 99, round: true },
      { button: "Select", x: 447, y: 1008, w: 95, h: 58, round: true },
      { button: "Start", x: 583, y: 1008, w: 95, h: 58, round: true },
    ],
    powerKey: { x: 310, y: 20, w: 90, h: 37 },
    led: { x: 321, y: 324, w: 23, h: 23 },
  },
  {
    id: "gba",
    label: "GBA",
    name: "Game Boy Advance",
    asset: "/assets/gba-v1.png",
    width: 1774,
    height: 887,
    landscape: true,
    screens: [{ x: 553, y: 176, w: 660, h: 440 }],
    keys: [
      { button: "Up", x: 231, y: 260, w: 76, h: 76 },
      { button: "Down", x: 231, y: 398, w: 76, h: 76 },
      { button: "Left", x: 156, y: 330, w: 76, h: 76 },
      { button: "Right", x: 303, y: 330, w: 76, h: 76 },
      { button: "A", x: 1532, y: 283, w: 118, h: 118, round: true },
      { button: "B", x: 1374, y: 338, w: 118, h: 118, round: true },
      { button: "Start", x: 354, y: 549, w: 58, h: 58, round: true },
      { button: "Select", x: 354, y: 643, w: 58, h: 58, round: true },
      { button: "L", x: 125, y: 45, w: 280, h: 75 },
      { button: "R", x: 1370, y: 45, w: 280, h: 75 },
    ],
    led: { x: 1408, y: 157, w: 26, h: 25 },
  },
  {
    id: "ds",
    label: "DS",
    name: "Nintendo DS Lite",
    asset: "/assets/ds-v1.png",
    width: 1299,
    height: 1211,
    lid: { x: 79, y: 28, w: 1134, h: 551 },
    folded: { x: 28, y: 665, w: 1242, h: 440 },
    sleepOnClose: true,
    screens: [
      {
        x: 372,
        y: 128,
        w: 553,
        h: 414.75,
        lid: true,
        quad: [
          [372, 128],
          [925, 128],
          [925, 519],
          [372, 519],
        ],
      },
      {
        x: 379,
        y: 720,
        w: 530,
        h: 397.5,
        quad: [
          [378, 720],
          [908, 720],
          [921, 1000],
          [365, 1000],
        ],
      },
    ],
    keys: [
      { button: "Up", x: 174, y: 753, w: 59, h: 61 },
      { button: "Down", x: 174, y: 842, w: 59, h: 53 },
      { button: "Left", x: 115, y: 794, w: 59, h: 57 },
      { button: "Right", x: 230, y: 794, w: 59, h: 57 },
      { button: "A", x: 1132, y: 769, w: 70, h: 65, round: true },
      { button: "B", x: 1083, y: 823, w: 67, h: 66, round: true },
      { button: "X", x: 1066, y: 713, w: 69, h: 66, round: true },
      { button: "Y", x: 1005, y: 768, w: 69, h: 66, round: true },
      { button: "Start", x: 1021, y: 947, w: 40, h: 42, round: true },
      { button: "Select", x: 1027, y: 1005, w: 40, h: 42, round: true },
      { button: "L", x: 101, y: 591, w: 98, h: 60, label: "L" },
      { button: "R", x: 1101, y: 591, w: 98, h: 60, label: "R" },
    ],
    powerKey: { x: 154, y: 1134, w: 102, h: 37 },
  },
  {
    id: "3ds",
    label: "3DS",
    name: "Nintendo 3DS",
    asset: "/assets/3ds-v1.png",
    width: 1312,
    height: 1199,
    lid: { x: 61, y: 21, w: 1190, h: 561 },
    folded: { x: 12, y: 670, w: 1284, h: 424 },
    sleepOnClose: true,
    screens: [
      { x: 307, y: 140, w: 698, h: 412, lid: true },
      {
        x: 365,
        y: 708,
        w: 585,
        h: 438.75,
        quad: [
          [366, 708],
          [945, 708],
          [966, 988],
          [350, 988],
        ],
      },
    ],
    keys: [
      { button: "Up", x: 155, y: 876, w: 58, h: 49 },
      { button: "Down", x: 155, y: 954, w: 58, h: 54 },
      { button: "Left", x: 101, y: 914, w: 58, h: 49 },
      { button: "Right", x: 207, y: 914, w: 58, h: 49 },
      { button: "A", x: 1157, y: 773, w: 70, h: 65, round: true },
      { button: "B", x: 1095, y: 828, w: 70, h: 65, round: true },
      { button: "X", x: 1083, y: 719, w: 70, h: 65, round: true },
      { button: "Y", x: 1018, y: 773, w: 70, h: 65, round: true },
      { button: "Select", x: 325, y: 1034, w: 210, h: 47 },
      { button: "Start", x: 785, y: 1034, w: 209, h: 47 },
      { button: "L", x: 82, y: 594, w: 97, h: 57, label: "L" },
      { button: "R", x: 1139, y: 594, w: 97, h: 57, label: "R" },
    ],
    powerKey: { x: 1043, y: 1028, w: 66, h: 51 },
    analogs: [{ id: "left", x: 126, y: 720, w: 137, h: 119, light: true }],
  },
  {
    id: "psp",
    label: "PSP",
    name: "PlayStation Portable",
    asset: "/assets/psp-v1.png",
    width: 1774,
    height: 887,
    landscape: true,
    screens: [{ x: 377, y: 137, w: 1020, h: 544 }],
    keys: [
      { button: "Up", x: 154, y: 266, w: 90, h: 96 },
      { button: "Down", x: 154, y: 419, w: 90, h: 99 },
      { button: "Left", x: 68, y: 345, w: 109, h: 99 },
      { button: "Right", x: 217, y: 345, w: 109, h: 99 },
      { button: "A", x: 1530, y: 439, w: 107, h: 107, round: true },
      { button: "B", x: 1629, y: 341, w: 107, h: 107, round: true },
      { button: "X", x: 1530, y: 246, w: 107, h: 107, round: true },
      { button: "Y", x: 1432, y: 340, w: 107, h: 107, round: true },
      { button: "Select", x: 1221, y: 733, w: 110, h: 53, round: true },
      { button: "Start", x: 1347, y: 733, w: 110, h: 53, round: true },
      { button: "L", x: 104, y: 62, w: 215, h: 62 },
      { button: "R", x: 1452, y: 62, w: 215, h: 62 },
    ],
    analogs: [{ id: "left", x: 155, y: 567, w: 122, h: 119 }],
    faceLabels: { A: "×", B: "○", X: "△", Y: "□" },
  },
  {
    id: "vita",
    label: "PS Vita",
    name: "PlayStation Vita",
    asset: "/assets/vita-v1.png",
    width: 1774,
    height: 887,
    landscape: true,
    screens: [{ x: 370, y: 108, w: 1034, h: 594 }],
    keys: [
      { button: "Up", x: 158, y: 223, w: 80, h: 96 },
      { button: "Down", x: 158, y: 336, w: 80, h: 97 },
      { button: "Left", x: 97, y: 289, w: 95, h: 80 },
      { button: "Right", x: 216, y: 289, w: 95, h: 80 },
      { button: "A", x: 1540, y: 355, w: 84, h: 91, round: true },
      { button: "B", x: 1615, y: 279, w: 84, h: 91, round: true },
      { button: "X", x: 1540, y: 209, w: 84, h: 91, round: true },
      { button: "Y", x: 1463, y: 278, w: 84, h: 91, round: true },
      { button: "Select", x: 1466, y: 648, w: 84, h: 52, round: true },
      { button: "Start", x: 1567, y: 648, w: 84, h: 52, round: true },
      { button: "L", x: 135, y: 60, w: 170, h: 66 },
      { button: "R", x: 1457, y: 60, w: 170, h: 66 },
    ],
    analogs: [
      { id: "left", x: 165, y: 474, w: 123, h: 123 },
      { id: "right", x: 1485, y: 474, w: 123, h: 123 },
    ],
    faceLabels: { A: "×", B: "○", X: "△", Y: "□" },
  },
];
DEVICES.find((d) => d.id === "psp")!.utilityKeys = [
  {
    id: "home",
    label: "Home",
    action: "menu",
    x: 330,
    y: 733,
    w: 113,
    h: 53,
    round: true,
  },
  {
    id: "volume-down",
    label: "音量减",
    action: "volume-down",
    x: 493,
    y: 733,
    w: 66,
    h: 53,
    round: true,
  },
  {
    id: "volume-up",
    label: "音量加",
    action: "volume-up",
    x: 621,
    y: 733,
    w: 66,
    h: 53,
    round: true,
  },
  {
    id: "brightness",
    label: "亮度",
    action: "light",
    x: 1049,
    y: 733,
    w: 65,
    h: 53,
    round: true,
  },
  {
    id: "sound",
    label: "SOUND",
    action: "sound",
    x: 1136,
    y: 733,
    w: 65,
    h: 53,
    round: true,
  },
];
DEVICES.find((d) => d.id === "vita")!.utilityKeys = [
  {
    id: "home",
    label: "Home",
    action: "menu",
    x: 157,
    y: 643,
    w: 126,
    h: 61,
    round: true,
  },
];
DEVICES.find((d) => d.id === "3ds")!.utilityKeys = [
  { id: "home", label: "Home", action: "menu", x: 549, y: 1034, w: 220, h: 47 },
];
const viewports: Partial<Record<DeviceId, Rect>> = {
  gb: { x: 215, y: 18, w: 780, h: 1272 },
  gba: { x: 28, y: 10, w: 1720, h: 860 },
  sp: { x: 170, y: 60, w: 860, h: 1220 },
  ds: { x: 25, y: 25, w: 1250, h: 1165 },
  "3ds": { x: 10, y: 18, w: 1290, h: 1165 },
  psp: { x: 25, y: 50, w: 1725, h: 760 },
  vita: { x: 22, y: 25, w: 1730, h: 815 },
};
for (const d of DEVICES) d.viewport = viewports[d.id];
deviceMutable("gba").powerKey = { x: 1655, y: 205, w: 50, h: 105 };
deviceMutable("psp").powerKey = { x: 1695, y: 505, w: 45, h: 105 };
deviceMutable("ds").powerKey = { x: 1228, y: 800, w: 40, h: 95 };
deviceMutable("ds").sliders = [
  { id: "volume", label: "掌机音量", x: 154, y: 1133, w: 110, h: 38 },
];
deviceMutable("gb").sliders = [
  {
    id: "contrast",
    label: "LCD 对比度",
    x: 214,
    y: 374,
    w: 24,
    h: 130,
    vertical: true,
  },
];
deviceMutable("3ds").sliders = [
  {
    id: "depth",
    label: "3D 深度",
    x: 1221,
    y: 383,
    w: 28,
    h: 150,
    vertical: true,
    lid: true,
  },
  {
    id: "volume",
    label: "掌机音量",
    x: 60,
    y: 732,
    w: 60,
    h: 100,
    vertical: true,
  },
];
deviceMutable("vita").powerKey = { x: 370, y: 24, w: 95, h: 30 };
deviceMutable("vita").utilityKeys!.push(
  {
    id: "volume-down",
    label: "音量减",
    action: "volume-down",
    x: 1190,
    y: 24,
    w: 76,
    h: 30,
  },
  {
    id: "volume-up",
    label: "音量加",
    action: "volume-up",
    x: 1270,
    y: 24,
    w: 76,
    h: 30,
  },
);
function deviceMutable(id: DeviceId) {
  return DEVICES.find((d) => d.id === id)!;
}
DEVICES.sort(
  (a, b) =>
    ["gb", "gba", "sp", "ds", "3ds", "psp", "vita"].indexOf(a.id) -
    ["gb", "gba", "sp", "ds", "3ds", "psp", "vita"].indexOf(b.id),
);
export const DEVICE_ORDER: DeviceId[] = [
  "gb",
  "gba",
  "sp",
  "ds",
  "3ds",
  "psp",
  "vita",
];
export function deviceById(id: DeviceId) {
  return DEVICES.find((d) => d.id === id)!;
}
