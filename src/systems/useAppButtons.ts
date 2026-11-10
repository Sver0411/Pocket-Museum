import { useEffect } from "react";
import type { RefObject } from "react";
import type { DeviceId } from "../devices";
import type { Button } from "../emulator/protocol";
export type AppButtonEvent = CustomEvent<{ device: DeviceId; button: Button }>;
/** Physical navigation goes through actual application controls, including focus and scroll. */
export function useAppButtons(
  ref: RefObject<HTMLElement | null>,
  device: DeviceId,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    const listener = (event: Event) => {
      const e = event as AppButtonEvent;
      if (e.detail.device !== device || !ref.current) return;
      const root = ref.current,
        controls = [
          ...root.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)",
          ),
        ].filter(
          (el) =>
            el.getBoundingClientRect().width > 0 &&
            el.getAttribute("type") !== "file",
        );
      if (!controls.length) return;
      const focus = document.activeElement as HTMLElement,
        index = controls.indexOf(focus),
        current = controls[Math.max(0, index)];
      if (e.detail.button === "A") {
        (current as HTMLButtonElement).click();
        current.focus({ preventScroll: true });
        e.preventDefault();
        return;
      }
      const direction = e.detail.button;
      if (!["Up", "Down", "Left", "Right"].includes(direction)) return;
      if (
        current instanceof HTMLInputElement &&
        current.type === "range" &&
        ["Left", "Right"].includes(direction)
      ) {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )!.set!;
        setter.call(
          current,
          String(
            Math.min(
              Number(current.max || 100),
              Math.max(
                Number(current.min || 0),
                Number(current.value) +
                  (direction === "Right" ? 1 : -1) * Number(current.step || 1),
              ),
            ),
          ),
        );
        current.dispatchEvent(new Event("input", { bubbles: true }));
        current.dispatchEvent(new Event("change", { bubbles: true }));
        e.preventDefault();
        return;
      }
      if (
        current instanceof HTMLSelectElement &&
        ["Left", "Right"].includes(direction)
      ) {
        current.selectedIndex = Math.min(
          current.options.length - 1,
          Math.max(0, current.selectedIndex + (direction === "Right" ? 1 : -1)),
        );
        current.dispatchEvent(new Event("change", { bubbles: true }));
        e.preventDefault();
        return;
      }
      const r = current.getBoundingClientRect(),
        cx = r.x + r.width / 2,
        cy = r.y + r.height / 2;
      const scored = controls
        .filter((el) => el !== current)
        .map((el) => {
          const t = el.getBoundingClientRect(),
            dx = t.x + t.width / 2 - cx,
            dy = t.y + t.height / 2 - cy;
          const primary =
              direction === "Right"
                ? dx
                : direction === "Left"
                  ? -dx
                  : direction === "Down"
                    ? dy
                    : -dy,
            cross =
              direction === "Right" || direction === "Left"
                ? Math.abs(dy)
                : Math.abs(dx);
          return { el, score: primary > 2 ? primary + cross * 2.8 : Infinity };
        })
        .sort((a, b) => a.score - b.score);
      const next =
        index < 0
          ? controls[0]
          : scored[0]?.score !== Infinity
            ? scored[0]?.el
            : current;
      next?.focus({ preventScroll: true });
      let parent = next?.parentElement;
      while (parent && root.contains(parent)) {
        if (
          parent.scrollHeight > parent.clientHeight + 2 &&
          getComputedStyle(parent).overflowY === "auto"
        ) {
          const r = next!.getBoundingClientRect(),
            p = parent.getBoundingClientRect();
          if (r.bottom > p.bottom)
            parent.scrollTop +=
              (r.bottom - p.bottom) / (p.height / parent.clientHeight);
          else if (r.top < p.top)
            parent.scrollTop -=
              (p.top - r.top) / (p.height / parent.clientHeight);
          break;
        }
        parent = parent.parentElement;
      }
      e.preventDefault();
    };
    window.addEventListener("pocketsp:app-button", listener);
    return () => window.removeEventListener("pocketsp:app-button", listener);
  }, [device, enabled, ref]);
}
