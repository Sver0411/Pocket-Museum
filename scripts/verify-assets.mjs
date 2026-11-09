import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const manifest = JSON.parse(
  await readFile(
    new URL("../public/assets-manifest.json", import.meta.url),
    "utf8",
  ),
);
for (const file of manifest.files) {
  const bytes = await readFile(
    new URL("../public/" + file.path, import.meta.url),
  );
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== file.sha256 || bytes.length !== file.bytes)
    throw new Error("Asset integrity mismatch: " + file.path);
}
console.log(`Verified ${manifest.files.length} pinned local assets (SHA-256).`);
