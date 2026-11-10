import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
export function UtilityKey({
  label,
  style,
  round,
  onActivate,
  onLongActivate,
}: {
  label: string;
  style: CSSProperties;
  round?: boolean;
  onActivate: () => void;
  onLongActivate?: () => void;
}) {
  const [down, setDown] = useState(false),
    sources = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    long = useRef(false);
  const activate = () => {
    if (!long.current) onActivate();
  };
  const press = (id: string) => {
    if (!sources.current.size) {
      long.current = false;
      if (onLongActivate)
        timer.current = setTimeout(() => {
          long.current = true;
          onLongActivate();
        }, 1000);
    }
    sources.current.add(id);
    setDown(true);
  };
  const release = (id: string) => {
    const held = sources.current.delete(id);
    if (!sources.current.size) clearTimeout(timer.current);
    setDown(sources.current.size > 0);
    return held;
  };
  const reset = () => {
    clearTimeout(timer.current);
    sources.current.clear();
    setDown(false);
  };
  useEffect(() => {
    window.addEventListener("blur", reset);
    return () => {
      reset();
      window.removeEventListener("blur", reset);
    };
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
        if (release(`pointer:${e.pointerId}`)) activate();
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
          if (release(`key:${e.code}`)) activate();
        }
      }}
      onClick={(e) => {
        if (e.detail === 0) activate();
      }}
    />
  );
}
