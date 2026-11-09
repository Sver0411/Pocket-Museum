import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import type { DeviceDefinition, Rect } from "../devices";
import type { Button } from "../emulator/protocol";
import type { InputController } from "../input/InputController";
import { analogArt } from "./controlArt";
import { percentRect } from "./HardwareKey";
interface Props {
  device: DeviceDefinition;
  stick: Rect & { id: string; light?: boolean };
  input: InputController;
}
const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
export function AnalogStick({ device, stick, input }: Props) {
  const [point, setPoint] = useState({ x: 0, y: 0 }),
    [active, setActive] = useState(false);
  const pointer = useRef<number | undefined>(undefined),
    keys = useRef(new Set<string>());
  const tilt = device.id === "vita";
  const update = (x: number, y: number) => {
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    setPoint({ x, y });
    for (const [button, pressed] of [
      ["Left", x < -0.3],
      ["Right", x > 0.3],
      ["Up", y < -0.3],
      ["Down", y > 0.3],
    ] as [Button, boolean][])
      input.set(`stick:${stick.id}:${button}`, button, pressed);
  };
  const keyboardVector = () =>
    update(
      Number(keys.current.has("ArrowRight")) -
        Number(keys.current.has("ArrowLeft")),
      Number(keys.current.has("ArrowDown")) -
        Number(keys.current.has("ArrowUp")),
    );
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    update(
      (e.clientX - r.x - r.width / 2) / (r.width * 0.42),
      (e.clientY - r.y - r.height / 2) / (r.height * 0.42),
    );
  };
  const releasePointer = (e: PointerEvent<HTMLButtonElement>) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = undefined;
    setActive(keys.current.size > 0);
    keyboardVector();
  };
  const cancel = () => {
    pointer.current = undefined;
    keys.current.clear();
    setActive(false);
    setPoint({ x: 0, y: 0 });
    input.releasePrefix(`stick:${stick.id}:`);
  };
  useEffect(() => {
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("blur", cancel);
      input.releasePrefix(`stick:${stick.id}:`);
    };
  }, [input, stick.id]);
  const travel = tilt ? 5 : 7;
  const style = {
    ...percentRect(stick, device.width, device.height),
    "--stick-x": `${point.x * travel}%`,
    "--stick-y": `${point.y * travel}%`,
    "--stick-rx": `${-point.y * 8}deg`,
    "--stick-ry": `${point.x * 8}deg`,
    "--cap-image": `url(${device.asset})`,
    "--cap-size": `${(device.width / stick.w) * 100}% ${(device.height / stick.h) * 100}%`,
    "--cap-position": `${(stick.x / (device.width - stick.w)) * 100}% ${(stick.y / (device.height - stick.h)) * 100}%`,
  } as CSSProperties;
  return (
    <button
      className={`analog-stick ${active ? "active" : ""} ${stick.light ? "light-stick" : ""} ${tilt ? "tilt-stick" : "slide-stick"}`}
      style={style}
      aria-label={stick.id === "right" ? "右摇杆" : "左摇杆"}
      aria-pressed={active}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (e.button !== 0 || pointer.current !== undefined) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        pointer.current = e.pointerId;
        setActive(true);
        move(e);
      }}
      onPointerMove={(e) => {
        if (pointer.current === e.pointerId) move(e);
      }}
      onPointerUp={releasePointer}
      onPointerCancel={releasePointer}
      onLostPointerCapture={releasePointer}
      onBlur={cancel}
      onKeyDown={(e) => {
        if (ARROWS.includes(e.code)) {
          e.preventDefault();
          e.stopPropagation();
          keys.current.add(e.code);
          setActive(true);
          if (pointer.current === undefined) keyboardVector();
        }
      }}
      onKeyUp={(e) => {
        if (ARROWS.includes(e.code)) {
          e.preventDefault();
          e.stopPropagation();
          keys.current.delete(e.code);
          setActive(pointer.current !== undefined || keys.current.size > 0);
          if (pointer.current === undefined) keyboardVector();
        }
      }}
    >
      <span className="analog-support" />
      <span className="analog-cap" style={analogArt(device, stick)} />
    </button>
  );
}
