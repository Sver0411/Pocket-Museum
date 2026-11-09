import { FolderOpen } from "lucide-react";
import type { DeviceId } from "../devices";
import { addMedia } from "../systems/media";
export function MediaImport({
  device,
  onDone,
  onError,
}: {
  device: DeviceId;
  onDone: (message: string) => void;
  onError: (error: unknown) => void;
}) {
  return (
    <label className="setting-row media-import">
      <span>
        <FolderOpen size={19} />
        导入媒体
      </span>
      <input
        aria-label="导入本地媒体"
        type="file"
        accept="image/*,audio/*,video/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = "";
          void (async () => {
            try {
              for (const file of files) await addMedia(device, file);
              if (files.length) onDone(`已导入 ${files.length} 个媒体文件`);
            } catch (error) {
              onError(error);
            }
          })();
        }}
      />
    </label>
  );
}
