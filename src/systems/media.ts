import { useEffect, useState } from "react";
import { storage } from "../storage/database";
import type { MediaItem } from "../storage/database";
export function notifyMedia() {
  window.dispatchEvent(new Event("pocketsp:mediachange"));
}
export async function addMedia(
  device: string,
  file: File | Blob,
  name?: string,
) {
  const kind = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("audio/")
      ? "audio"
      : file.type.startsWith("video/")
        ? "video"
        : null;
  if (!kind) throw new Error("请选择图片、音频或视频文件");
  if (file.size > 128 * 1024 * 1024)
    throw new Error("单个媒体文件不能超过 128 MB");
  const item: MediaItem = {
    id: crypto.randomUUID(),
    device,
    kind,
    name: name || ("name" in file ? file.name : "Capture"),
    blob: file,
    createdAt: Date.now(),
  };
  await storage.putMedia(item);
  notifyMedia();
  return item;
}
export function useMedia(device: string, kind?: MediaItem["kind"]) {
  const [items, setItems] = useState<MediaItem[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const update = () =>
      void storage
        .media(device, kind)
        .then((list) => {
          if (alive) setItems(list);
        })
        .catch((e) => {
          if (alive) setError(String(e));
        });
    update();
    window.addEventListener("pocketsp:mediachange", update);
    return () => {
      alive = false;
      window.removeEventListener("pocketsp:mediachange", update);
    };
  }, [device, kind]);
  return { items, error };
}
export function useBlobUrl(blob?: Blob) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const value = URL.createObjectURL(blob);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [blob]);
  return url;
}
