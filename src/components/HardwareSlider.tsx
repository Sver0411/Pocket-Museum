import type { CSSProperties } from "react";
export function HardwareSlider({
  label,
  vertical,
  recessed = false,
  value,
  onChange,
  style,
}: {
  label: string;
  vertical?: boolean;
  recessed?: boolean;
  value: number;
  onChange: (n: number) => void;
  style: CSSProperties;
}) {
  return (
    <label
      className={`hardware-slider ${vertical ? "vertical" : ""} ${recessed ? "recessed" : ""}`}
      style={style}
      title={label}
    >
      <span className="slider-track" aria-hidden="true">
        <span
          className="slider-thumb"
          style={{
            [vertical ? "bottom" : "left"]:
              `${Math.min(100, Math.max(0, value)) * (recessed ? 0.8 : 0.9)}%`,
          }}
        />
      </span>
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
