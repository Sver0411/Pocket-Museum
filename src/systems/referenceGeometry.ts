/** Native-pixel reference geometry, not responsive host-page measurements.
 * PSP: VitaXMB PAF6.61 / PTF-Studio cross-check; Sony PPSSPP vshdemo.
 * Vita: Sony basic_start_01.jpg and Vita3K a01f2b1 live_area.cpp (GPL-2.0+).
 * Details and uncertainty are in docs/research/*_VISUAL_SPEC.md.
 */
export const PSP_GEOMETRY = {
  categoryX: 110,
  categoryY: 72,
  categoryPitch: 82,
  itemX: 110,
  itemY: 137,
  itemTextX: 149,
  itemPitch: 80,
  selectedGap: 5,
  settingsPitch: 45,
  settingsGap: 10,
  transitionMs: 200,
} as const;
export function pspItemY(index: number, selection: number, settings = false) {
  const d = index - selection;
  return (
    135 + (settings ? d * 45 + Math.sign(d) * 10 : d * 65 + (d < 0 ? -60 : 0))
  );
}

export const VITA_BUBBLES = [
  [252, 132],
  [482, 132],
  [708, 132],
  [145, 283],
  [368, 283],
  [595, 283],
  [815, 283],
  [252, 434],
  [482, 434],
  [708, 434],
] as const;
// GPL Vita3K a01f2b1: content y=32, gate_pos=(620,361), gate_size=(280,158).
export const VITA_GATE = { x: 340, y: 183, w: 280, h: 158 } as const;
