import type { ReactNode } from "react";
import { Hand, Circle, Disc3, Gamepad2, Grid2X2, Layers } from "lucide-react";
import type { DeviceDefinition, DeviceId } from "../devices";

export interface PresentationSlots {
  keyboard: ReactNode;
  handheld: ReactNode;
  controls: ReactNode;
}
function Keyboard({ children }: { children: ReactNode }) {
  return (
    <aside className="control-rail" aria-label="键盘操作">
      {children}
    </aside>
  );
}
function Controls({ children }: { children: ReactNode }) {
  return (
    <aside className="settings-rail" aria-label="游玩控制">
      {children}
    </aside>
  );
}
function Title({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <h1 className="presentation-title">
      {icon}
      {children}
    </h1>
  );
}
/** Seven display compositions; the slots retain one shared emulator and state owner. */
export function GBPresentation(s: PresentationSlots) {
  return (
    <main className="studio-main presentation-gb" data-layout="pixel-frame">
      <Keyboard>
        <Title>Game Boy</Title>
        <div className="gb-keyboard-frame">{s.keyboard}</div>
      </Keyboard>
      <section className="play-space gb-display-frame" aria-label="掌机游玩区">
        <div className="gb-frame-corner" aria-hidden="true" />
        {s.handheld}
      </section>
      <Controls>
        <div className="gb-control-stack">{s.controls}</div>
      </Controls>
    </main>
  );
}
export function GBAPresentation(s: PresentationSlots) {
  return (
    <main className="studio-main presentation-gba" data-layout="wide-glass">
      <Keyboard>
        <Title icon={<Gamepad2 />}>Game Boy Advance</Title>
        {s.keyboard}
      </Keyboard>
      <section className="play-space gba-glass-stage" aria-label="掌机游玩区">
        <div className="gba-orbit" aria-hidden="true" />
        {s.handheld}
      </section>
      <Controls>
        <div className="gba-glass-toolbar">{s.controls}</div>
      </Controls>
    </main>
  );
}
export function GBSPPresentation(s: PresentationSlots) {
  return (
    <main className="studio-main presentation-sp" data-layout="silver-gallery">
      <Keyboard>
        <Title>Game Boy Advance SP</Title>
        {s.keyboard}
      </Keyboard>
      <section className="play-space sp-silver-plinth" aria-label="掌机游玩区">
        {s.handheld}
      </section>
      <Controls>{s.controls}</Controls>
    </main>
  );
}
export function DSPresentation(s: PresentationSlots) {
  return (
    <main className="studio-main presentation-ds" data-layout="dual-screen">
      <Keyboard>
        <Title icon={<Layers />}>DS Lite</Title>
        <div className="ds-keyboard-card">{s.keyboard}</div>
        <p className="touch-hint">
          <Hand size={17} />
          下屏支持触摸
        </p>
      </Keyboard>
      <section className="play-space ds-screen-stage" aria-label="掌机游玩区">
        <div className="ds-dual-guides" aria-hidden="true">
          <i />
          <i />
        </div>
        {s.handheld}
      </section>
      <Controls>
        <div className="ds-control-tile">{s.controls}</div>
      </Controls>
    </main>
  );
}
export function ThreeDSPresentation(s: PresentationSlots) {
  return (
    <main className="studio-main presentation-3ds" data-layout="home-tiles">
      <Keyboard>
        <Title icon={<Grid2X2 />}>Nintendo 3DS</Title>
        <div className="three-keyboard-tiles">{s.keyboard}</div>
      </Keyboard>
      <section className="play-space three-home-stage" aria-label="掌机游玩区">
        {s.handheld}
      </section>
      <Controls>
        <div className="three-tools-tiles">{s.controls}</div>
      </Controls>
    </main>
  );
}
export function PSPPresentation(s: PresentationSlots) {
  return (
    <main className="studio-main presentation-psp" data-layout="xmb-axis">
      <Keyboard>
        <Title icon={<Disc3 />}>PSP</Title>
        <div className="psp-keyboard-list">{s.keyboard}</div>
      </Keyboard>
      <section className="play-space psp-wide-stage" aria-label="掌机游玩区">
        <div className="psp-axis" aria-hidden="true" />
        {s.handheld}
      </section>
      <Controls>
        <div className="psp-xmb-tools">{s.controls}</div>
      </Controls>
    </main>
  );
}
export function VitaPresentation(s: PresentationSlots) {
  return (
    <main
      className="studio-main presentation-vita"
      data-layout="livearea-bubbles"
    >
      <Keyboard>
        <Title icon={<Circle />}>PS Vita</Title>
        <div className="vita-keyboard-bubbles">{s.keyboard}</div>
        <p className="touch-hint">
          <Hand size={17} />
          轻触屏幕选择应用
        </p>
      </Keyboard>
      <section className="play-space vita-oled-stage" aria-label="掌机游玩区">
        <div className="vita-orbit" aria-hidden="true" />
        {s.handheld}
      </section>
      <Controls>
        <div className="vita-livearea-tools">{s.controls}</div>
      </Controls>
    </main>
  );
}
const PRESENTATIONS: Record<DeviceId, (slots: PresentationSlots) => ReactNode> =
  {
    gb: GBPresentation,
    gba: GBAPresentation,
    sp: GBSPPresentation,
    ds: DSPresentation,
    "3ds": ThreeDSPresentation,
    psp: PSPPresentation,
    vita: VitaPresentation,
  };
export function DevicePresentation({
  device,
  ...slots
}: PresentationSlots & { device: DeviceId }) {
  const Presentation = PRESENTATIONS[device];
  return <Presentation {...slots} />;
}
export function KeyboardLegend({
  device,
  pads,
}: {
  device: DeviceDefinition;
  pads: number;
}) {
  const face = device.faceLabels;
  const rows = [
    { keys: ["↑", "↓", "←", "→"], label: "移动" },
    { keys: ["X", "Z"], label: `${face?.A || "A"} / ${face?.B || "B"}` },
    ...(device.keys.some((k) => k.button === "X")
      ? [{ keys: ["C", "V"], label: `${face?.X || "X"} / ${face?.Y || "Y"}` }]
      : []),
    ...(device.keys.some((k) => k.button === "L")
      ? [{ keys: ["Q", "E"], label: "L / R" }]
      : []),
    { keys: ["Enter"], label: "START" },
    { keys: ["Shift"], label: "SELECT" },
  ];
  return (
    <>
      <dl className="control-legend">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>
              {row.keys.map((k) => (
                <kbd key={k} className={k.length > 1 ? "wide" : undefined}>
                  {k}
                </kbd>
              ))}
            </dt>
            <dd>{row.label}</dd>
          </div>
        ))}
      </dl>
      {pads > 0 && (
        <div className="gamepad-status connected">
          <i />
          已连接 {pads} 个手柄
        </div>
      )}
    </>
  );
}
