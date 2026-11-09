import { useEffect, useRef, useState } from "react";
import type { Dispatch, PointerEvent } from "react";
import type { AppIcon, NativeAction, NativeState } from "./model";
export function useIconReorder(
  s: NativeState,
  dispatch: Dispatch<NativeAction>,
  apps: AppIcon[],
  key: string,
) {
  const [dragging, setDragging] = useState("");
  const gesture = useRef<{
      id: number;
      source: string;
      x: number;
      y: number;
      timer: ReturnType<typeof setTimeout>;
      active: boolean;
    } | null>(null),
    suppress = useRef(false);
  const cancel = () => {
    if (gesture.current) clearTimeout(gesture.current.timer);
    gesture.current = null;
    setDragging("");
  };
  useEffect(() => {
    cancel();
    return () => cancel();
  }, [s.phase, s.page]);
  const up = (e: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    clearTimeout(g.timer);
    if (g.active) e.stopPropagation();
    if (g.active && !cancelled) {
      const target = (
        document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      )?.closest<HTMLElement>("[data-app-id]")?.dataset.appId;
      if (target && target !== g.source) {
        const ids = apps.map((a) => a.id),
          from = ids.indexOf(g.source),
          to = ids.indexOf(target);
        if (from >= 0 && to >= 0) {
          [ids[from], ids[to]] = [ids[to], ids[from]];
          dispatch({ type: "set", key, value: JSON.stringify(ids) });
          dispatch({
            type: "select",
            index: to % (s.device === "vita" ? 10 : ids.length),
          });
        }
      }
      suppress.current = true;
    }
    cancel();
  };
  return {
    dragging,
    bind: {
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        const id = (e.target as HTMLElement).closest<HTMLElement>(
          "[data-app-id]",
        )?.dataset.appId;
        if (!id || e.button !== 0) return;
        cancel();
        suppress.current = false;
        const target = e.currentTarget;
        const g = {
          id: e.pointerId,
          source: id,
          x: e.clientX,
          y: e.clientY,
          active: false,
          timer: setTimeout(() => {
            g.active = true;
            setDragging(id);
            target.setPointerCapture(g.id);
          }, 550),
        };
        gesture.current = g;
      },
      onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
        const g = gesture.current;
        if (!g || g.id !== e.pointerId) return;
        if (!g.active && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8)
          cancel();
        else if (g.active) e.preventDefault();
      },
      onPointerUp: (e: PointerEvent<HTMLDivElement>) => up(e),
      onPointerCancel: (e: PointerEvent<HTMLDivElement>) => up(e, true),
      onLostPointerCapture: (e: PointerEvent<HTMLDivElement>) => up(e, true),
      onClickCapture: (e: React.MouseEvent<HTMLDivElement>) => {
        if (suppress.current) {
          e.preventDefault();
          e.stopPropagation();
          suppress.current = false;
        }
      },
      onContextMenu: (e: React.MouseEvent<HTMLDivElement>) =>
        e.preventDefault(),
    },
  };
}
