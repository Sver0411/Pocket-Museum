import { useEffect, useRef } from "react";
import type { RefObject, PointerEvent } from "react";

/** Two LCDs display crops of one same-origin emulator, never two running games. */
export function DsGameScreen({
  frame,
  index,
  active,
  onTouch,
}: {
  frame: RefObject<HTMLIFrameElement | null>;
  index: number;
  active: boolean;
  onTouch: (x: number, y: number, down: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<number | null>(null);
  const point = useRef({ x: 0, y: 0 });
  useEffect(() => {
    let raf = 0;
    const ctx = canvas.current?.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const draw = () => {
      const source =
        frame.current?.contentDocument?.querySelector<HTMLCanvasElement>(
          "canvas[data-nds-output]",
        );
      if (source?.width && source.height >= 384)
        ctx.drawImage(source, 0, index * 192, 256, 192, 0, 0, 256, 192);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [frame, index]);
  useEffect(() => {
    if (!active && pointer.current !== null) {
      pointer.current = null;
      onTouch(point.current.x, point.current.y, false);
    }
  }, [active, onTouch]);
  const update = (e: PointerEvent<HTMLCanvasElement>, down: boolean) => {
    // offset coordinates are in the unprojected canvas CSS plane, including the angled pose.
    const x = Math.max(
      0,
      Math.min(1, e.nativeEvent.offsetX / e.currentTarget.clientWidth),
    );
    const y = Math.max(
      0,
      Math.min(1, e.nativeEvent.offsetY / e.currentTarget.clientHeight),
    );
    point.current = { x, y };
    onTouch(x, y, down);
  };
  return (
    <canvas
      ref={canvas}
      className="ds-game-screen"
      width={256}
      height={192}
      aria-label={index === 0 ? "DS 游戏上屏" : "DS 游戏触摸屏"}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (
          !active ||
          index === 0 ||
          e.button !== 0 ||
          pointer.current !== null
        )
          return;
        e.preventDefault();
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e, true);
      }}
      onPointerMove={(e) => {
        if (pointer.current === e.pointerId) update(e, true);
      }}
      onPointerUp={(e) => {
        if (pointer.current === e.pointerId) {
          update(e, false);
          pointer.current = null;
        }
      }}
      onPointerCancel={(e) => {
        if (pointer.current === e.pointerId) {
          onTouch(point.current.x, point.current.y, false);
          pointer.current = null;
        }
      }}
      onLostPointerCapture={(e) => {
        if (pointer.current === e.pointerId) {
          onTouch(point.current.x, point.current.y, false);
          pointer.current = null;
        }
      }}
    />
  );
}
