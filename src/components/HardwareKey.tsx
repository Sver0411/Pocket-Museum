import { useRef } from "react";
import type { CSSProperties, PointerEvent } from "react";
import type { Button } from "../emulator/protocol";
import type { InputController } from "../input/InputController";
import type { Rect } from "../devices";
export function percentRect(
  rect: Rect,
  width: number,
  height: number,
): CSSProperties {
  return {
    left: `${(rect.x / width) * 100}%`,
    top: `${(rect.y / height) * 100}%`,
    width: `${(rect.w / width) * 100}%`,
    height: `${(rect.h / height) * 100}%`,
  };
}
export function Key({
  button,
  className = "",
  children,
  input,
  pressed,
  style,
}: {
  button: Button;
  className?: string;
  children: React.ReactNode;
  input: InputController;
  pressed: Set<Button>;
  style?: CSSProperties;
}) {
  const pointers = useRef(new Set<number>());
  const release = (e: PointerEvent<HTMLButtonElement>) => {
    if (pointers.current.delete(e.pointerId))
      input.set(`pointer:${e.pointerId}`, button, false);
  };
  return (
    <button
      style={style}
      type="button"
      className={`hardware-key ${className} ${pressed.has(button) ? "is-pressed" : ""}`}
      data-button={button}
      aria-label={`掌机 ${button}`}
      aria-pressed={pressed.has(button)}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.add(e.pointerId);
        input.set(`pointer:${e.pointerId}`, button, true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onKeyDown={(e) => {
        if ((e.code === "Space" || e.code === "Enter") && !e.repeat) {
          e.preventDefault();
          input.set(`accessible:${button}`, button, true);
        }
      }}
      onKeyUp={(e) => {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          input.set(`accessible:${button}`, button, false);
        }
      }}
      onBlur={() => input.set(`accessible:${button}`, button, false)}
    >
      {children}
    </button>
  );
}
