import { useEffect, useRef } from "react";
export interface CaptureCrop {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
export function ExternalScreen({
  stream,
  crop,
  still,
  onError,
}: {
  stream?: MediaStream;
  crop: CaptureCrop;
  still?: string;
  onError: (error: unknown) => void;
}) {
  const video = useRef<HTMLVideoElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const player = video.current,
      ctx = canvas.current?.getContext("2d", { alpha: false });
    if (!player || !ctx || !stream) return;
    player.srcObject = stream;
    void player.play().catch(onError);
    let raf = 0;
    const draw = () => {
      if (player.readyState >= 2) {
        const sx = (player.videoWidth * crop.left) / 100,
          sy = (player.videoHeight * crop.top) / 100;
        const w = player.videoWidth * (1 - (crop.left + crop.right) / 100),
          h = player.videoHeight * (1 - (crop.top + crop.bottom) / 100);
        const scale = Math.min(480 / w, 272 / h),
          dw = w * scale,
          dh = h * scale;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 480, 272);
        ctx.drawImage(
          player,
          sx,
          sy,
          w,
          h,
          (480 - dw) / 2,
          (272 - dh) / 2,
          dw,
          dh,
        );
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      player.pause();
      player.srcObject = null;
    };
  }, [stream, crop, onError]);
  return (
    <div className="external-screen">
      {stream ? (
        <>
          <video ref={video} autoPlay muted playsInline aria-hidden="true" />
          <canvas
            ref={canvas}
            width={480}
            height={272}
            aria-label="外部模拟器实时画面"
          />
        </>
      ) : still ? (
        <img src={still} alt="外部模拟器暂停画面" />
      ) : (
        <div className="external-screen-wait">
          已连接 PPSSPP
          <br />
          在连接面板共享模拟器窗口
        </div>
      )}
    </div>
  );
}
