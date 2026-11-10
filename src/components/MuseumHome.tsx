import { DEVICES } from "../devices";
import { useEffect, useState } from "react";
import type { DeviceId } from "../devices";
import { ThemeBackdrop } from "./ThemeBackdrop";
export const MODEL_CODES: Record<DeviceId, string> = {
  gb: "DMG-01",
  gba: "AGB-001",
  sp: "AGS-001",
  ds: "USG-001",
  "3ds": "CTR-001",
  psp: "PSP-1000",
  vita: "PCH-1000",
};
export function MuseumHome({ onSelect }: { onSelect: (id: DeviceId) => void }) {
  const [loaded, setLoaded] = useState<Partial<Record<DeviceId, boolean>>>({});
  useEffect(() => {
    let active = true;
    for (const device of DEVICES) {
      const image = new Image();
      image.src = device.asset;
      void image
        .decode()
        .then(() => {
          if (active) setLoaded((v) => ({ ...v, [device.id]: true }));
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="museum-home" data-theme="museum">
      <ThemeBackdrop device="museum" />
      <header className="museum-header">
        <a href="#/" aria-label="Pocket Museum 首页">
          <span className="museum-color-tabs" aria-hidden="true">
            <i />
            <i />
          </span>
          Pocket Museum
          <span className="museum-color-tabs" aria-hidden="true">
            <i />
            <i />
          </span>
        </a>
      </header>
      <main className="museum-gallery" aria-label="掌机博物馆">
        {DEVICES.map((d) => (
          <button
            key={d.id}
            className={`museum-exhibit ${d.landscape ? "wide" : ""}`}
            data-theme={d.id}
            onClick={() => onSelect(d.id)}
            aria-label={`体验 ${d.label}`}
          >
            <div className="exhibit-image">
              <svg
                className={`exhibit-art ${loaded[d.id] ? "ready" : ""}`}
                data-loaded={loaded[d.id] ? "true" : "false"}
                role="img"
                aria-label={d.name}
                preserveAspectRatio="xMidYMax meet"
                viewBox={`${d.viewport?.x ?? 0} ${d.viewport?.y ?? 0} ${d.viewport?.w ?? d.width} ${d.viewport?.h ?? d.height}`}
              >
                <image href={d.asset} width={d.width} height={d.height} />
              </svg>
            </div>
            <span className="exhibit-label">
              <span className="exhibit-name">{d.name}</span>
              <span className="exhibit-model">{MODEL_CODES[d.id]}</span>
            </span>
          </button>
        ))}
      </main>
    </div>
  );
}
