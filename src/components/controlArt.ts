import type { CSSProperties } from "react";
import { publicUrl } from "../publicUrl";
import type { DeviceDefinition, Rect } from "../devices";
/** Visual outlines use source-image coordinates, independently of generous hit targets. */
const crosses: Record<string, number[][]> = {
  gb: [
    [361, 763],
    [411, 763],
    [411, 826],
    [478, 826],
    [478, 879],
    [411, 879],
    [411, 943],
    [361, 943],
    [361, 879],
    [294, 879],
    [294, 826],
    [361, 826],
  ],
  gba: [
    [236, 265],
    [298, 265],
    [298, 334],
    [366, 334],
    [366, 392],
    [298, 392],
    [298, 460],
    [237, 460],
    [237, 392],
    [166, 392],
    [166, 334],
    [236, 334],
  ],
  sp: [
    [370, 837],
    [420, 837],
    [420, 868],
    [480, 868],
    [480, 907],
    [420, 907],
    [420, 950],
    [364, 950],
    [364, 907],
    [309, 907],
    [309, 868],
    [370, 868],
  ],
  ds: [
    [178, 754],
    [227, 754],
    [227, 795],
    [278, 795],
    [281, 846],
    [225, 846],
    [222, 889],
    [169, 889],
    [173, 846],
    [119, 846],
    [121, 797],
    [175, 797],
  ],
  "3ds": [
    [161, 878],
    [202, 878],
    [202, 917],
    [257, 917],
    [257, 955],
    [201, 956],
    [198, 1000],
    [153, 1000],
    [156, 956],
    [104, 956],
    [107, 918],
    [158, 918],
  ],
};
function roundedPolygon(points: number[][], r = 3) {
  const near = (a: number[], b: number[]) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t = Math.min(r / d, 0.15);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  return (
    points
      .map((p, i) => {
        const a = near(p, points[(i + points.length - 1) % points.length]),
          b = near(p, points[(i + 1) % points.length]);
        return `${i ? "L" : "M"}${a.join(",")}Q${p.join(",")} ${b.join(",")}`;
      })
      .join("") + "Z"
  );
}
export function svgMask(d: DeviceDefinition, rect: Rect, markup: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${rect.x} ${rect.y} ${rect.w} ${rect.h}">${markup}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
export function photoArt(
  d: DeviceDefinition,
  rect: Rect,
  mask: string,
): CSSProperties {
  return {
    backgroundImage: `url(${publicUrl(d.asset)})`,
    backgroundSize: `${(d.width / rect.w) * 100}% ${(d.height / rect.h) * 100}%`,
    backgroundPosition: `${(rect.x / (d.width - rect.w)) * 100}% ${(rect.y / (d.height - rect.h)) * 100}%`,
    maskImage: mask,
    WebkitMaskImage: mask,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
  };
}
export function dpadArt(d: DeviceDefinition, rect: Rect) {
  let markup = "";
  const outline = d.dpadOutline ?? crosses[d.id];
  if (outline) markup = `<path d="${roundedPolygon(outline)}" fill="white"/>`;
  else {
    // Sony caps are four tapered faces on one linked rocker; gaps stay in the shell.
    const p =
      d.id === "psp"
        ? [
            [163, 273],
            [235, 273],
            [235, 333],
            [200, 359],
            [163, 333],
          ]
        : [
            [164, 228],
            [230, 228],
            [230, 292],
            [199, 318],
            [164, 292],
          ];
    const cx = d.id === "psp" ? 199 : 199,
      cy = d.id === "psp" ? 391 : 328;
    markup = [0, 90, 180, 270]
      .map(
        (a) =>
          `<path transform="rotate(${a} ${cx} ${cy})" d="${roundedPolygon(p, 6)}" fill="white"/>`,
      )
      .join("");
  }
  return photoArt(d, rect, svgMask(d, rect, markup));
}
export function buttonArt(d: DeviceDefinition, rect: Rect, id: string) {
  let markup = "";
  const r = rect;
  if (d.id === "gb" && (id === "Start" || id === "Select")) {
    markup = `<rect x="${r.x + 3}" y="${r.y + 15}" width="${r.w - 6}" height="${r.h - 28}" rx="14" transform="rotate(-30 ${r.x + r.w / 2} ${r.y + r.h / 2})" fill="white"/>`;
  } else if (d.id === "3ds" && ["Start", "Select", "home"].includes(id)) {
    markup = `<rect x="${r.x + 2}" y="${r.y + 1}" width="${r.w - 4}" height="${r.h - 6}" rx="3" fill="white"/>`;
  } else if (
    [
      "Start",
      "Select",
      "home",
      "volume-up",
      "volume-down",
      "brightness",
      "sound",
    ].includes(id) &&
    ["psp", "vita"].includes(d.id)
  ) {
    markup = `<rect x="${r.x + 5}" y="${r.y + 7}" width="${r.w - 10}" height="${r.h - 14}" rx="${(r.h - 14) / 2}" fill="white"/>`;
  } else
    markup = `<ellipse cx="${r.x + r.w / 2}" cy="${r.y + r.h / 2 - 1}" rx="${r.w * 0.46}" ry="${r.h * 0.46}" fill="white"/>`;
  return photoArt(d, rect, svgMask(d, rect, markup));
}
export function analogArt(d: DeviceDefinition, r: Rect) {
  // Crop just the cap. The photographed surrounding bearing/ring never travels.
  const inset =
    d.id === "3ds" && d.view !== "flat"
      ? { x: 0, y: -3, w: 0, h: 0 }
      : d.id === "psp"
        ? { x: 1, y: 0, w: -4, h: -4 }
        : { x: 4, y: 3, w: -8, h: -8 };
  const cap = {
    x: r.x + inset.x,
    y: r.y + inset.y,
    w: r.w + inset.w,
    h: r.h + inset.h,
  };
  return photoArt(
    d,
    r,
    svgMask(
      d,
      r,
      `<ellipse cx="${cap.x + cap.w / 2}" cy="${cap.y + cap.h / 2}" rx="${cap.w / 2}" ry="${cap.h / 2}" fill="white"/>`,
    ),
  );
}
