import { DEVICES } from "../devices";
import { useEffect, useState } from "react";
import type { DeviceId } from "../devices";
import { ThemeBackdrop } from "./ThemeBackdrop";
import { HostDialog } from "./HostDialog";
import { publicUrl } from "../publicUrl";
export const MODEL_CODES: Record<DeviceId, string> = {
  gb: "DMG-01",
  gba: "AGB-001",
  sp: "AGS-001",
  ds: "USG-001",
  "3ds": "CTR-001",
  psp: "PSP-1000",
  vita: "PCH-1000",
};
// Browser captures of this project's native screen implementations.
export const SYSTEM_PREVIEWS: Record<DeviceId, string[]> = {
  gb: ["/assets/previews/gb-0.png"],
  gba: ["/assets/previews/gba-0.png"],
  sp: ["/assets/previews/sp-0.png"],
  ds: ["/assets/previews/ds-0.png", "/assets/previews/ds-1.png"],
  "3ds": ["/assets/previews/3ds-0.png", "/assets/previews/3ds-1.png"],
  psp: ["/assets/previews/psp-0.png"],
  vita: ["/assets/previews/vita-0.png"],
};
const exhibitAsset = (id: DeviceId) => `/assets/exhibits/${id}.webp`;

export function MuseumHome({
  onSelect, standalone, onQuickPlay, recent, onExport, onImport, error,
}: {
  onSelect: (id: DeviceId) => void;
  standalone: boolean;
  onQuickPlay?: () => void;
  recent?: { title: string; play: () => void };
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
  error: string;
}) {
  const [loaded, setLoaded] = useState<Partial<Record<DeviceId, boolean>>>({});
  const [backupOpen, setBackupOpen] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [restored, setRestored] = useState(false);
  const [backupFile, setBackupFile] = useState<File>();
  const runBackup = async (operation: () => Promise<void>, restoring = false) => {
    setBackupBusy(true);
    setBackupMessage("");
    try {
      await operation();
      setRestored(restoring);
      setBackupMessage(restoring ? "备份已导入。重新载入后生效。" : "备份已导出。");
    } catch (cause) {
      setBackupMessage(cause instanceof Error ? cause.message : "备份操作失败。");
    } finally {
      setBackupBusy(false);
    }
  };
  useEffect(() => {
    let active = true;
    for (const device of DEVICES) {
      const image = new Image();
      image.src = publicUrl(standalone ? device.asset : exhibitAsset(device.id));
      void Promise.all([
        image.decode(),
        ...SYSTEM_PREVIEWS[device.id].map((path) => {
          const preview = new Image();
          preview.src = publicUrl(path);
          return preview.decode();
        }),
      ])
        .then(() => {
          if (active) setLoaded((v) => ({ ...v, [device.id]: true }));
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [standalone]);
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
        {standalone ? <p className="museum-mode">离线展馆 · 机身与系统体验</p> : (
          <nav className="museum-actions" aria-label="快速开始">
            <button disabled={!onQuickPlay} onClick={onQuickPlay}>试玩 2048</button>
            {recent && <button onClick={recent.play} title={recent.title}>继续上次</button>}
            <button onClick={() => setBackupOpen(true)}>存档备份</button>
          </nav>
        )}
        {error && <p className="museum-mode" role="alert">{error}</p>}
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
                <image href={publicUrl(standalone ? d.asset : exhibitAsset(d.id))} width={d.width} height={d.height} />
                {d.screens.map((screen, index) => (
                  <image
                    key={index}
                    className="exhibit-screen-preview"
                    href={publicUrl(SYSTEM_PREVIEWS[d.id][index])}
                    x={screen.x}
                    y={screen.y}
                    width={screen.w}
                    height={screen.h}
                    preserveAspectRatio="none"
                    style={
                      screen.quad
                        ? {
                            clipPath: `polygon(${screen.quad.map(([x, y]) => `${((x - screen.x) / screen.w) * 100}% ${((y - screen.y) / screen.h) * 100}%`).join(",")})`,
                          }
                        : undefined
                    }
                  />
                ))}
              </svg>
            </div>
            <span className="exhibit-label">
              <span className="exhibit-name">{d.name}</span>
              <span className="exhibit-model">{MODEL_CODES[d.id]}</span>
            </span>
          </button>
        ))}
      </main>
      {backupOpen && (
        <HostDialog label="存档备份" onDismiss={() => {
          if (!backupBusy && !restored) setBackupOpen(false);
        }}>
          <section className="museum-backup help-modal">
            <h2>存档备份</h2>
            <p>备份包含游戏存档、笔记和设置。导入会恢复备份里的设置，并保留日期较新的游戏存档。</p>
            {!restored ? <div className="museum-backup-actions">
              <button disabled={backupBusy} onClick={() => void runBackup(onExport)}>导出备份</button>
              <label>选择备份文件 <input type="file" accept=".json" disabled={backupBusy} onChange={(event) => setBackupFile(event.target.files?.[0])} /></label>
              <button disabled={backupBusy || !backupFile} onClick={() => backupFile && void runBackup(() => onImport(backupFile), true)}>导入备份</button>
              <button disabled={backupBusy} onClick={() => setBackupOpen(false)}>关闭</button>
            </div> : <button onClick={() => location.reload()}>重新载入</button>}
            {backupMessage && <p role="status">{backupMessage}</p>}
          </section>
        </HostDialog>
      )}
    </div>
  );
}
