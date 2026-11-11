import { focusDevice } from "./focusDevice";
import { DsGameScreen } from "./DsGameScreen";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { projectiveMatrix, scaledQuad } from "./projection";
import { presentationDevice } from "../flatDevices";
import type { Quad } from "./projection";
import { HardwareSlider } from "./HardwareSlider";
import { LidCover } from "./LidCover";
import { buttonArt } from "./controlArt";
import { Key, percentRect } from "./HardwareKey";
import { DPad, DIRECTIONS, hasLinkedDPad } from "./DPad";
import { UtilityKey } from "./UtilityKey";
import { AnalogStick } from "./AnalogStick";
import type { CSSProperties, ReactNode } from "react";
import { LoaderCircle, Pause } from "lucide-react";
import type { Button } from "../emulator/protocol";
import type { InputController } from "../input/InputController";
import type { DeviceDefinition, Rect } from "../devices";
export type Status = "off" | "loading" | "running" | "paused" | "error";
interface Props {
  focus?: boolean;
  emulate?: boolean;
  nativeScreen?: (index: number) => ReactNode;
  cancelToken?: string;
  device: DeviceDefinition;
  status: Status;
  pressed: Set<Button>;
  input: InputController;
  closed: boolean;
  flat: boolean;
  light: boolean;
  onLight: () => void;
  onPower: () => void;
  powerDisabled?: boolean;
  onFold: () => void;
  foldDisabled?: boolean;
  onLidMotion: () => void;
  onMenu: () => void;
  onVolume: (delta: number) => void;
  onSound: (long: boolean) => void;
  hardwareValues: Record<string, number>;
  onHardwareValue: (id: string, value: number) => void;
  session: string;
  onFrame: (frame: HTMLIFrameElement) => void;
  onTouch: (x: number, y: number, down: boolean) => void;
}
export function Console({
  device: sourceDevice,
  focus = false,
  status,
  pressed,
  input,
  closed,
  flat,
  light,
  onLight,
  onPower,
  powerDisabled,
  onFold,
  foldDisabled = false,
  onLidMotion,
  onMenu,
  onVolume,
  onSound,
  hardwareValues,
  onHardwareValue,
  session,
  onFrame,
  onTouch,
  emulate = true,
  nativeScreen,
  cancelToken = "",
}: Props) {
  // Flat play has its own photograph and coordinates; the original perspective is never warped.
  const shell = presentationDevice(sourceDevice, flat || focus);
  const d = focus ? focusDevice(shell) : shell;
  const stage = useRef<HTMLDivElement>(null);
  const dsFrame = useRef<HTMLIFrameElement>(null);
  const [stageWidth, setStageWidth] = useState(d.width);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([e]) =>
      setStageWidth(e.contentRect.width),
    );
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const isFlat = (flat || focus) && !closed;
  const view = d.viewport ?? { x: 0, y: 0, w: d.width, h: d.height };
  const photoScale = stageWidth / view.w;
  const [drag, setDrag] = useState<number | null>(null),
    [moving, setMoving] = useState(false);
  const gesture = useRef<{
    id: number;
    y: number;
    start: number;
    travel: number;
  } | null>(null);
  const previousClosed = useRef(closed);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const settleLid = () => {
    clearTimeout(settleTimer.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMoving(false);
      return;
    }
    setMoving(true);
    settleTimer.current = setTimeout(() => setMoving(false), 820);
  };
  useLayoutEffect(() => {
    if (previousClosed.current === closed) return;
    previousClosed.current = closed;
    settleLid();
  }, [closed]);
  useEffect(() => () => clearTimeout(settleTimer.current), []);
  const progress = drag ?? Number(closed);
  const folding = moving || drag !== null;
  const dragProgress = (g: NonNullable<typeof gesture.current>, y: number) =>
    Math.max(0, Math.min(1, g.start + (y - g.y) / g.travel));
  const finishDrag = (
    e: React.PointerEvent<HTMLButtonElement>,
    cancel = false,
  ) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    const desired = cancel ? closed : dragProgress(g, e.clientY) > 0.5;
    if (drag !== null && drag !== Number(closed)) settleLid();
    setDrag(null);
    if (desired !== closed) onFold();
  };
  const powered = status !== "off" && status !== "error";
  const screen = (
    r: DeviceDefinition["screens"][number],
    index: number,
    lid = false,
  ) => {
    const relative =
      lid && d.lid ? { x: r.x - d.lid.x, y: r.y - d.lid.y, w: r.w, h: r.h } : r;
    return (
      <div
        key={index}
        inert={folding || closed || (lid && ["ds", "3ds"].includes(d.id))}
        className={`lcd ${light ? "" : "dim"} ${powered ? "screen-powered" : ""}`}
        style={{
          ...percentRect(
            relative,
            lid ? d.lid!.w : d.width,
            lid ? d.lid!.h : d.height,
          ),
          transformOrigin: "0 0",
          filter:
            d.id === "gb"
              ? `contrast(${0.35 + (hardwareValues.contrast ?? 65) / 50})`
              : undefined,
          ...(r.quad
            ? {
                transform: `matrix3d(${projectiveMatrix(
                  scaledQuad(
                    [
                      [0, 0],
                      [r.w, 0],
                      [r.w, r.h],
                      [0, r.h],
                    ],
                    photoScale,
                  ),
                  scaledQuad(
                    r.quad.map(([x, y]) => [
                      x - r.x,
                      y - r.y,
                    ]) as unknown as Quad,
                    photoScale,
                  ),
                ).join(",")})`,
              }
            : {}),
        }}
      >
        {powered && ["sp", "gba", "gb"].includes(d.id) && emulate && (
          <iframe
            key={session}
            title={d.id === "gb" ? "GB 游戏画面" : "GBA 游戏画面"}
            src={`/emulator.html?session=${session}`}
            onLoad={(e) => onFrame(e.currentTarget)}
            tabIndex={-1}
            allow="autoplay; gamepad"
          />
        )}
        {powered && d.id === "ds" && emulate && (
          <DsGameScreen
            frame={dsFrame}
            index={lid ? 0 : 1}
            active={status === "running" && !closed}
            onTouch={onTouch}
          />
        )}
        {powered &&
          !(["sp", "gba", "gb", "ds"].includes(d.id) && emulate) &&
          nativeScreen?.(d.screens.indexOf(r as (typeof d.screens)[number]))}
        {status === "off" && (
          <div className="screen-idle" aria-label="掌机屏幕已关闭" />
        )}
        {status === "loading" && emulate && (
          <div className="screen-overlay">
            <LoaderCircle className="spin" size={20} />
            <span>正在启动 {d.id === "ds" ? "DeSmuME" : "mGBA"}…</span>
          </div>
        )}
        {status === "paused" && !closed && !folding && (
          <div className="screen-overlay paused">
            <Pause size={20} />
            <span>已暂停</span>
          </div>
        )}
      </div>
    );
  };
  const photoStyle =
    d.lid && !focus
      ? {
          backgroundImage: `url(${d.asset})`,
          backgroundSize: `${(d.width / d.lid!.w) * 100}% ${(d.height / d.lid!.h) * 100}%`,
          backgroundPosition: `${(d.lid!.x / (d.width - d.lid!.w)) * 100}% ${(d.lid!.y / (d.height - d.lid!.h)) * 100}%`,
        }
      : {};
  return (
    <div
      ref={stage}
      className={`console-space ${focus ? "focus-console" : ""} ${isFlat ? "fully-open" : ""} ${drag !== null ? "lid-dragging" : ""} ${closed ? "closed" : ""} ${d.landscape ? "landscape" : "portrait"}`}
      data-device={d.id}
      data-focus={focus || undefined}
      data-posture={closed ? "closed" : isFlat ? "flat" : "angled"}
      data-art-view={d.view ?? "angled"}
      data-folding={folding || undefined}
      data-lid-sleep={(d.sleepOnClose && (closed || moving)) || undefined}
      style={
        {
          "--fold": progress,
          "--fold-x":
            d.lid && d.folded
              ? `${((d.folded.x + d.folded.w / 2 - d.lid.x - d.lid.w / 2) / d.lid.w) * 100}%`
              : "0%",
          "--fold-y":
            d.lid && d.folded
              ? `${((d.folded.y - d.lid.y - d.lid.h) / d.lid.h) * 100}%`
              : "0%",
          "--fold-sx": d.lid && d.folded ? d.folded.w / d.lid.w : 1,
          "--fold-sy": d.lid && d.folded ? d.folded.h / d.lid.h : 1,
          "--fold-lift": d.folded
            ? `${((d.folded.y + d.folded.h / 2 - d.height / 2) / d.height) * 100}%`
            : "0%",
          "--lid-rim":
            d.id === "3ds" ? "#096d79" : d.id === "ds" ? "#dfdedc" : "#8d9199",
          "--device-ratio": `${view.w} / ${view.h}`,
          "--view-ratio": view.w / view.h,
          "--original-ratio": `${d.width} / ${d.height}`,
          "--canvas-width": d.landscape
            ? "1000px"
            : d.view === "flat" && d.id === "sp"
              ? "450px"
              : "620px",
        } as CSSProperties
      }
    >
      {powered && emulate && d.id === "ds" && (
        <iframe
          ref={dsFrame}
          key={session}
          title="DS 模拟器运行实例"
          className="ds-runtime"
          src={`/emulator.html?session=${session}`}
          tabIndex={-1}
          aria-hidden="true"
          allow="autoplay; gamepad"
          onLoad={(e) => onFrame(e.currentTarget)}
        />
      )}
      <div className="console-shadow" />
      <div
        className="handheld"
        aria-label={d.name}
        style={{
          width: `${(d.width / view.w) * 100}%`,
          left: `${(-view.x / view.w) * 100}%`,
          top: `${(-view.y / view.h) * 100}%`,
        }}
      >
        {d.lid && (
          <div className="lid" style={percentRect(d.lid, d.width, d.height)}>
            <div className="lid-back">
              <LidCover device={d.id} flat={d.view === "flat"} />
            </div>
            <div className="lid-thickness" />
            <div className="lid-front" style={photoStyle}>
              {d.screens.filter((r) => r.lid).map((r, i) => screen(r, i, true))}
              {d.sliders
                ?.filter((k) => k.lid)
                .map((k) => (
                  <HardwareSlider
                    key={k.id}
                    label={k.label}
                    vertical={k.vertical}
                    value={hardwareValues[k.id] ?? 0}
                    onChange={(v) => onHardwareValue(k.id, v)}
                    style={percentRect(
                      { ...k, x: k.x - d.lid!.x, y: k.y - d.lid!.y },
                      d.lid!.w,
                      d.lid!.h,
                    )}
                  />
                ))}
            </div>
            <button
              className="lid-handle"
              aria-label={closed ? "拖动或打开上盖" : "拖动或合上上盖"}
              disabled={foldDisabled}
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                onLidMotion();
                e.currentTarget.setPointerCapture(e.pointerId);
                const console = stage.current!;
                const rect = console.getBoundingClientRect();
                const start = Number(getComputedStyle(console).getPropertyValue("--fold"));
                gesture.current = {
                  id: e.pointerId,
                  y: e.clientY,
                  start,
                  travel: rect.height * 0.3,
                };
                setDrag(start);
              }}
              onPointerMove={(e) => {
                const g = gesture.current;
                if (g?.id === e.pointerId) setDrag(dragProgress(g, e.clientY));
              }}
              onPointerUp={(e) => {
                const g = gesture.current;
                if (g && Math.abs(e.clientY - g.y) < 5) {
                  gesture.current = null;
                  setDrag(null);
                  onFold();
                } else finishDrag(e);
              }}
              onPointerCancel={(e) => finishDrag(e, true)}
              onLostPointerCapture={(e) => finishDrag(e, true)}
              onClick={(e) => {
                if (e.detail === 0) onFold();
              }}
            />
          </div>
        )}

        <div className="hinge-occlusion" />
        {d.powerKey && (
          <button
            className={`photo-power ${powered ? "powered" : ""}`}
            disabled={powerDisabled}
            title={powered ? "关闭电源" : "开启电源"}
            style={percentRect(
              closed && d.folded
                ? {
                    x: d.folded.x + d.folded.w - 18,
                    y: d.folded.y + d.folded.h * 0.68,
                    w: 28,
                    h: 55,
                  }
                : d.powerKey,
              d.width,
              d.height,
            )}
            onClick={onPower}
            aria-label={powered ? "机身电源：关闭" : "机身电源：开启"}
          />
        )}
        <div className="base-plane">
          <img
            className="device-photo base-face"
            src={d.asset}
            alt=""
            draggable={false}
            style={
              d.lid
                ? {
                    clipPath:
                      d.view === "flat"
                        ? `inset(${((d.lid.y + d.lid.h) / d.height) * 100}% 0 0)`
                        : `polygon(${d.id === "sp" ? 18 : d.id === "ds" ? 6 : 4.5}% ${((d.lid.y + d.lid.h) / d.height) * 100}%, ${d.id === "sp" ? 82 : d.id === "ds" ? 94 : 95.5}% ${((d.lid.y + d.lid.h) / d.height) * 100}%,100% 100%,0 100%)`,
                  }
                : undefined
            }
          />
          {d.screens.filter((r) => !r.lid).map((r, i) => screen(r, i))}
          <div
            className="face-controls"
            inert={focus || closed || moving || drag !== null}
          >
            {hasLinkedDPad(d) && (
              <DPad device={d} pressed={pressed} input={input} />
            )}
            {d.keys
              .filter(
                (k) => !hasLinkedDPad(d) || !DIRECTIONS.includes(k.button),
              )
              .map((k) => (
                <Key
                  key={k.button}
                  button={k.button}
                  className={`${k.round ? "round-key" : ""} ${k.button === "L" || k.button === "R" ? "shoulder-key" : ""}`}
                  style={{
                    ...percentRect(k, d.width, d.height),
                    ...buttonArt(d, k, k.button),
                  }}
                  input={input}
                  pressed={pressed}
                >
                  {k.label || ""}
                </Key>
              ))}
            {d.analogs?.map((stick) => (
              <AnalogStick
                key={`${d.id}:${stick.id}:${status}:${closed}:${cancelToken}`}
                device={d}
                stick={stick}
                input={input}
              />
            ))}
            {d.utilityKeys?.map((key) => (
              <UtilityKey
                key={`${d.id}:${key.id}:${status}:${closed}:${cancelToken}`}
                label={key.label}
                round={key.round}
                style={{
                  ...percentRect(key, d.width, d.height),
                  ...buttonArt(d, key, key.id),
                }}
                onLongActivate={
                  key.action === "sound" ? () => onSound(true) : undefined
                }
                onActivate={() => {
                  switch (key.action) {
                    case "menu":
                      onMenu();
                      break;
                    case "volume-up":
                      onVolume(5);
                      break;
                    case "volume-down":
                      onVolume(-5);
                      break;
                    case "sound":
                      onSound(false);
                      break;
                    case "light":
                      onLight();
                      break;
                  }
                }}
              />
            ))}
            {d.lightKey && (
              <button
                className="photo-light"
                style={percentRect(d.lightKey, d.width, d.height)}
                onClick={onLight}
                aria-label="切换前光"
                aria-pressed={light}
              />
            )}
          </div>
          {d.sliders
            ?.filter((k) => !k.lid)
            .map((k) => (
              <HardwareSlider
                key={k.id}
                label={k.label}
                vertical={k.vertical}
                recessed={d.id === "3ds" && k.id === "volume"}
                value={hardwareValues[k.id] ?? 60}
                onChange={(v) => onHardwareValue(k.id, v)}
                style={percentRect(k, d.width, d.height)}
              />
            ))}
          {d.led && (
            <i
              className={`photo-led ${powered ? "on" : ""}`}
              style={percentRect(d.led, d.width, d.height)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
