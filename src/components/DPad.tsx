import type { CSSProperties } from "react";
import type { Button } from "../emulator/protocol";
import type { DeviceDefinition } from "../devices";
import type { InputController } from "../input/InputController";
import { dpadArt } from "./controlArt";
import { Key, percentRect } from "./HardwareKey";
export const DIRECTIONS: Button[] = ["Up", "Down", "Left", "Right"];
// The directional caps share a linked assembly even on the segmented Sony faceplates.
export function hasLinkedDPad(device: DeviceDefinition) {
  return DIRECTIONS.every((button) =>
    device.keys.some((key) => key.button === button),
  );
}
export function DPad({
  device,
  pressed,
  input,
}: {
  device: DeviceDefinition;
  pressed: Set<Button>;
  input: InputController;
}) {
  const keys = device.keys.filter((k) => DIRECTIONS.includes(k.button));
  const x = Math.min(...keys.map((k) => k.x)),
    y = Math.min(...keys.map((k) => k.y));
  const w = Math.max(...keys.map((k) => k.x + k.w)) - x,
    h = Math.max(...keys.map((k) => k.y + k.h)) - y;
  const segmented = device.id === "psp" || device.id === "vita";
  const dx = Number(pressed.has("Right")) - Number(pressed.has("Left"));
  const dy = Number(pressed.has("Down")) - Number(pressed.has("Up"));
  const active = DIRECTIONS.some((key) => pressed.has(key));
  const style = {
    ...percentRect({ x, y, w, h }, device.width, device.height),
    "--dpad-rotate-x": `${-dy * 7}deg`,
    "--dpad-rotate-y": `${dx * 7}deg`,
    "--dpad-depth": active ? "-.8px" : "0px",
    "--dpad-shift-x": `${dx * 0.8}px`,
    "--dpad-shift-y": `${dy * 0.8}px`,
    "--dpad-light-angle": `${(Math.atan2(dy, dx) * 180) / Math.PI + 90}deg`,
  } as CSSProperties;
  return (
    <div
      className={`dpad-assembly ${active ? "active" : ""} ${segmented ? "segmented" : ""}`}
      style={style}
      data-testid="dpad-assembly"
    >
      <div
        className="dpad-bearing"
        aria-hidden="true"
        style={dpadArt(device, { x, y, w, h })}
      />
      <div
        className="dpad-cap"
        aria-hidden="true"
        data-testid="dpad-cap"
        style={dpadArt(device, { x, y, w, h })}
      >
        <span className="dpad-surface-light" />
      </div>
      {keys.map((key) => (
        <Key
          key={key.button}
          button={key.button}
          className="dpad-hit"
          style={percentRect(
            { x: key.x - x, y: key.y - y, w: key.w, h: key.h },
            w,
            h,
          )}
          input={input}
          pressed={pressed}
        >
          {""}
        </Key>
      ))}
    </div>
  );
}
