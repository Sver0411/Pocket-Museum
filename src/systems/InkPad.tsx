import { useRef } from "react";
export interface InkStroke {
  d: string;
  color: string;
  width: number;
}
export function InkPad({
  strokes,
  onChange,
  color = "#353a40",
  width = 2,
  eraser = false,
}: {
  strokes: InkStroke[];
  onChange: (strokes: InkStroke[]) => void;
  color?: string;
  width?: number;
  eraser?: boolean;
}) {
  const drawing = useRef<number | null>(null),
    current = useRef(strokes);
  current.current = strokes;
  return (
    <svg
      className="native-ink-pad"
      viewBox="0 0 256 110"
      preserveAspectRatio="none"
      role="img"
      aria-label="手写绘图区域"
      onPointerDown={(e) => {
        if (drawing.current !== null) return;
        e.preventDefault();
        drawing.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        const b = e.currentTarget.getBoundingClientRect(),
          x = ((e.clientX - b.x) / b.width) * 256,
          y = ((e.clientY - b.y) / b.height) * 110;
        onChange([
          ...current.current,
          {
            d: `M${x.toFixed(1)} ${y.toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}`,
            color: eraser ? "#ffffff" : color,
            width: eraser ? 10 : width,
          },
        ]);
      }}
      onPointerMove={(e) => {
        if (drawing.current !== e.pointerId) return;
        const b = e.currentTarget.getBoundingClientRect(),
          x = Math.max(0, Math.min(256, ((e.clientX - b.x) / b.width) * 256)),
          y = Math.max(0, Math.min(110, ((e.clientY - b.y) / b.height) * 110));
        onChange(
          current.current.map((p, i) =>
            i === current.current.length - 1
              ? { ...p, d: p.d + `L${x.toFixed(1)} ${y.toFixed(1)}` }
              : p,
          ),
        );
      }}
      onPointerUp={(e) => {
        if (drawing.current === e.pointerId) drawing.current = null;
      }}
      onPointerCancel={() => (drawing.current = null)}
      onLostPointerCapture={() => (drawing.current = null)}
    >
      <rect width="256" height="110" fill="white" />
      {strokes.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.color}
          strokeWidth={p.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </svg>
  );
}
