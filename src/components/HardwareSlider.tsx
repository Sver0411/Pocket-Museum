import type { CSSProperties } from "react";
export function HardwareSlider({
  label,
  vertical,
  value,
  onChange,
  style,
}: {
  label: string;
  vertical?: boolean;
  value: number;
  onChange: (n: number) => void;
  style: CSSProperties;
}) {
  return (
    <label
      className={`hardware-slider ${vertical ? "vertical" : ""}`}
      style={style}
      title={label}
    >
      <span className="slider-track" />
      <span
        className="slider-thumb"
        style={{
          [vertical ? "bottom" : "left"]:
            `${Math.min(90, Math.max(0, value * 0.9))}%`,
        }}
      />
      <input
        aria-label={label}
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
