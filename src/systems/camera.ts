import { useSyncExternalStore } from "react";
import { addMedia } from "./media";
type CameraState = {
  stream: MediaStream | null;
  busy: boolean;
  error: string;
  facing: "user" | "environment";
};
let state: CameraState = {
  stream: null,
  busy: false,
  error: "",
  facing: "environment",
};
const listeners = new Set<() => void>();
let sequence = 0;
let video: HTMLVideoElement | null = null;
function publish(next: Partial<CameraState>) {
  state = { ...state, ...next };
  for (const fn of listeners) fn();
}
export function useCamera() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
  );
}
export function setCameraVideo(element: HTMLVideoElement | null) {
  video = element;
  if (element && state.stream) element.srcObject = state.stream;
}
export function stopCamera() {
  sequence++;
  state.stream?.getTracks().forEach((t) => t.stop());
  publish({ stream: null, busy: false });
  if (video) video.srcObject = null;
}
export async function startCamera(facing = state.facing) {
  stopCamera();
  const token = ++sequence;
  publish({ busy: true, error: "", facing });
  try {
    if (!navigator.mediaDevices?.getUserMedia)
      throw Error("Camera access is unavailable in this browser.");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
    if (token !== sequence) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    publish({ stream, busy: false });
    if (video) {
      video.srcObject = stream;
      await video.play();
    }
  } catch (error) {
    if (token === sequence)
      publish({
        busy: false,
        error: error instanceof Error ? error.message : String(error),
      });
  }
}
export async function takePhoto(device: string) {
  if (!video || !state.stream || !video.videoWidth)
    throw Error("Start the camera before taking a photo.");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d")!.drawImage(video, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(Error("Could not capture the image.")),
      "image/jpeg",
      0.92,
    ),
  );
  return addMedia(device, blob, `Photo ${new Date().toLocaleString()}.jpg`);
}
