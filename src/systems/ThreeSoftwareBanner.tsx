import { Camera, Music } from "lucide-react";
import type { AppIcon } from "./model";
import { NativeAppIcon } from "./NativeAppIcon";

export function ThreeSoftwareBanner({ app }: { app: AppIcon }) {
  if (app.id === "camera" || app.id === "sound") {
    const camera = app.id === "camera";
    return (
      <div className={`three-software-banner three-wordmark wordmark-${app.id}`}>
        <div><span>Nintendo 3DS</span><strong>{camera ? "Camera" : "Sound"}</strong></div>
        {camera ? (
          <span className="three-camera-brand">
            <Camera size={53} strokeWidth={3.1} aria-hidden="true" />
            <svg viewBox="0 0 35 29" width="34" height="29" aria-hidden="true">
              <path d="M7 17c-5-2-5-6-2-9 2-2 5-1 7 1l5 7 12 7 1 4-9-4c-7 1-13-1-16-6m4-6h.1M3 11l-3 2 4 2" fill="#fff1c6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M13 15q6 3 9 7" fill="none" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
          </span>
        ) : <Music size={54} fill="currentColor" strokeWidth={2} aria-hidden="true" />}
      </div>
    );
  }
  return (
    <div className="three-software-banner three-wordmark three-static-mark" style={{ color: app.color }}>
      <NativeAppIcon name={app.icon} size={62} />
      <strong>{app.name}</strong>
    </div>
  );
}
