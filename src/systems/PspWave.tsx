import { useEffect, useState } from "react";
/** PSP wave silhouette traced from PPSSPP's official vshdemo frame8, native480x272.
 * This reconstructed curve is not the proprietary firmware mesh/shader.
 * Unlike the prior XMDB background it adds no particles or neon ribbons.
 */
export function PspWave({ month }: { month: number }) {
  const [running, setRunning] = useState(true);
  useEffect(() => {
    const suspend = () => setRunning(false),
      resume = () => setRunning(true),
      visible = () => setRunning(!document.hidden);
    window.addEventListener("pocketsp:system-suspend", suspend);
    window.addEventListener("pocketsp:system-resume", resume);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("pocketsp:system-suspend", suspend);
      window.removeEventListener("pocketsp:system-resume", resume);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return (
    <svg
      className={`psp-reference-wave ${running ? "" : "suspended"}`}
      viewBox="0 0 480 272"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={
        {
          "--psp-wave-hue": `${({ 0: -20, 1: 70, 2: 140, 5: 0, 8: -140, 10: 45 } as Record<number, number>)[month] ?? 0}deg`,
        } as React.CSSProperties
      }
    >
      <defs>
        <linearGradient id="psp-sky-y" x2="0" y2="1">
          <stop stopColor="#00064e" />
          <stop offset="1" stopColor="#3e9dd5" />
        </linearGradient>
        <linearGradient id="psp-sky-x">
          <stop stopColor="#0047b2" stopOpacity="0" />
          <stop offset="1" stopColor="#08b0df" stopOpacity=".62" />
        </linearGradient>
        <linearGradient id="psp-wave-fill" x2="0" y2="1">
          <stop stopColor="#1bb0d6" stopOpacity=".5" />
          <stop offset="1" stopColor="#91fff2" stopOpacity=".96" />
        </linearGradient>
      </defs>
      <rect width="480" height="272" fill="url(#psp-sky-y)" />
      <rect width="480" height="272" fill="url(#psp-sky-x)" />
      <path
        className="psp-wave-silhouette"
        d="M-20 180C105 226 210 142 317 111C388 92 446 101 500 116V292H-20Z"
        fill="url(#psp-wave-fill)"
      />
      <path
        className="psp-wave-edge"
        d="M-20 179C113 224 223 134 327 108C391 92 449 104 500 120"
        fill="none"
        stroke="#c4f7ff"
        strokeOpacity=".12"
        strokeWidth="2"
      />
    </svg>
  );
}
