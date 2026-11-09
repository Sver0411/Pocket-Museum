import { useEffect, useRef, useState } from "react";
import { projectiveMatrix, scaledQuad } from "./projection";
import { presentationDevice } from "../flatDevices";
import type { Quad } from "./projection";
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
  onFold: () => void;
  foldDisabled?: boolean;
  onLidMotion: () => void;
  onMenu: () => void;
  onVolume: (delta: number) => void;
  onMute: () => void;
  session: string;
  onFrame: (frame: HTMLIFrameElement) => void;
}
export function Console({
  device: sourceDevice,
  status,
  pressed,
  input,
  closed,
  flat,
  light,
  onLight,
  onPower,
  onFold,
  foldDisabled = false,
  onLidMotion,
  onMenu,
  onVolume,
  onMute,
  session,
  onFrame,
  emulate = true,
  nativeScreen,
  cancelToken = "",
}: Props) {
  // Flat play has its own photograph and coordinates; the original perspective is never warped.
  const d = presentationDevice(sourceDevice, flat);
  const stage = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(d.width);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([e]) =>
      setStageWidth(e.contentRect.width),
    );
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const isFlat = flat && !closed;
  const [drag, setDrag] = useState<number | null>(null),
    [moving, setMoving] = useState(false);
  const gesture = useRef<{
    id: number;
    y: number;
    start: number;
    travel: number;
  } | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setMoving(true);
    const t = setTimeout(() => setMoving(false), 820);
    return () => clearTimeout(t);
  }, [closed]);
  const progress = drag ?? Number(closed);
  const finishDrag = (
    e: React.PointerEvent<HTMLButtonElement>,
    cancel = false,
  ) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    const desired = cancel ? closed : (drag ?? g.start) > 0.5;
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
        className={`lcd ${light ? "" : "dim"} ${powered ? "screen-powered" : ""}`}
        style={{
          ...percentRect(
            relative,
            lid ? d.lid!.w : d.width,
            lid ? d.lid!.h : d.height,
          ),
          transformOrigin: "0 0",
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
                    stageWidth / d.width,
                  ),
                  scaledQuad(
                    r.quad.map(([x, y]) => [
                      x - r.x,
                      y - r.y,
                    ]) as unknown as Quad,
                    stageWidth / d.width,
                  ),
                ).join(",")})`,
              }
            : {}),
        }}
      >
        {powered && ["sp", "gba"].includes(d.id) && emulate && (
          <iframe
            key={session}
            title="GBA 游戏画面"
            src={`/emulator.html?session=${session}`}
            onLoad={(e) => onFrame(e.currentTarget)}
            tabIndex={-1}
            allow="autoplay; gamepad"
          />
        )}
        {powered &&
          !(["sp", "gba"].includes(d.id) && emulate) &&
          nativeScreen?.(d.screens.indexOf(r as (typeof d.screens)[number]))}
        {status === "off" && (
          <div className="screen-idle" aria-label="掌机屏幕已关闭" />
        )}
        {status === "loading" && emulate && (
          <div className="screen-overlay">
            <LoaderCircle className="spin" size={20} />
            <span>正在启动 mGBA…</span>
          </div>
        )}
        {status === "paused" && !closed && (
          <div className="screen-overlay paused">
            <Pause size={20} />
            <span>已暂停</span>
          </div>
        )}
      </div>
    );
  };
  const photoStyle = d.lid
    ? {
        backgroundImage: `url(${d.asset})`,
        backgroundSize: `${(d.width / d.lid!.w) * 100}% ${(d.height / d.lid!.h) * 100}%`,
        backgroundPosition: `${(d.lid!.x / (d.width - d.lid!.w)) * 100}% ${(d.lid!.y / (d.height - d.lid!.h)) * 100}%`,
      }
    : {};
  return (
    <div
      ref={stage}
      className={`console-space ${isFlat ? "fully-open" : ""} ${drag !== null ? "lid-dragging" : ""} ${closed ? "closed" : ""} ${d.landscape ? "landscape" : "portrait"}`}
      data-device={d.id}
      data-posture={closed ? "closed" : isFlat ? "flat" : "angled"}
      data-art-view={d.view ?? "angled"}
      data-folding={moving || drag !== null || undefined}
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
          "--device-ratio": `${d.width} / ${d.height}`,
          "--original-ratio": `${d.width} / ${d.height}`,
          "--canvas-width": d.landscape
            ? "1000px"
            : d.view === "flat" && d.id === "sp"
              ? "450px"
              : "620px",
        } as CSSProperties
      }
    >
      <div className="console-shadow" />
      <div className="handheld" aria-label={d.name}>
        {d.lid && (
          <div className="lid" style={percentRect(d.lid, d.width, d.height)}>
            <div className="lid-back">
              <LidCover device={d.id} flat={d.view === "flat"} />
            </div>
            <div className="lid-thickness" />
            <div className="lid-front" style={photoStyle}>
              {d.screens.filter((r) => r.lid).map((r, i) => screen(r, i, true))}
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
                const rect = e.currentTarget
                  .closest(".console-space")!
                  .getBoundingClientRect();
                gesture.current = {
                  id: e.pointerId,
                  y: e.clientY,
                  start: Number(closed),
                  travel: rect.height * 0.3,
                };
                setDrag(Number(closed));
              }}
              onPointerMove={(e) => {
                const g = gesture.current;
                if (g?.id === e.pointerId)
                  setDrag(
                    Math.max(
                      0,
                      Math.min(1, g.start + (e.clientY - g.y) / g.travel),
                    ),
                  );
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
            inert={closed || moving || drag !== null}
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
                    case "mute":
                      onMute();
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
          {d.powerKey && (
            <button
              className="photo-power"
              style={percentRect(d.powerKey, d.width, d.height)}
              onClick={onPower}
              aria-label={powered ? "关闭电源" : "开启电源"}
            />
          )}
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
