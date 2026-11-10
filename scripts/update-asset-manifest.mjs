import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function walk(dir) {
  let result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = dir + "/" + entry.name;
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else result.push(path);
  }
  return result;
}
const paths = [
  ...(await walk("public/vendor")),
  ...(await walk("public/roms")),
  ...(await walk("public/licenses")),
  ...(await walk("public/assets")),
  ...(await walk("public/fonts")),
  ...(await walk("public/audio")),
].sort();
const files = [];
for (const path of paths) {
  const bytes = await readFile(path);
  files.push({
    path: path.slice(7),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
await writeFile(
  "public/assets-manifest.json",
  JSON.stringify(
    { emulatorjs: "4.2.3", core: "mgba", demo: "2048-GBA 1.3.1", files },
    null,
    2,
  ) + "\n",
);
console.log(`Recorded ${files.length} local asset hashes.`);
