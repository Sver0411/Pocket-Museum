import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
export function UtilityKey({
  label,
  style,
  round,
  onActivate,
}: {
  label: string;
  style: CSSProperties;
  round?: boolean;
  onActivate: () => void;
}) {
  const [down, setDown] = useState(false),
    sources = useRef(new Set<string>());
  const press = (id: string) => {
    sources.current.add(id);
    setDown(true);
  };
  const release = (id: string) => {
    const held = sources.current.delete(id);
    setDown(sources.current.size > 0);
    return held;
  };
  const reset = () => {
    sources.current.clear();
    setDown(false);
  };
  useEffect(() => {
    window.addEventListener("blur", reset);
    return () => window.removeEventListener("blur", reset);
  }, []);
  const cancel = (e: PointerEvent<HTMLButtonElement>) =>
    release(`pointer:${e.pointerId}`);
  return (
    <button
      className={`hardware-utility ${round ? "round-key" : ""} ${down ? "is-pressed" : ""}`}
      style={style}
      aria-label={`掌机 ${label}`}
      aria-pressed={down}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        press(`pointer:${e.pointerId}`);
      }}
      onPointerUp={(e) => {
        if (release(`pointer:${e.pointerId}`)) onActivate();
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onBlur={reset}
      onKeyDown={(e) => {
        if (["Space", "Enter"].includes(e.code) && !e.repeat) {
          e.preventDefault();
          press(`key:${e.code}`);
        }
      }}
      onKeyUp={(e) => {
        if (["Space", "Enter"].includes(e.code)) {
          e.preventDefault();
          if (release(`key:${e.code}`)) onActivate();
        }
      }}
      onClick={(e) => {
        if (e.detail === 0) onActivate();
      }}
    />
  );
}
