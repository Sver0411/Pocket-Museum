import { build } from "esbuild";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const result = await build({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  write: false,
  outfile: "pocketsp.js",
  format: "iife",
  minify: true,
  target: "es2022",
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.hot": "undefined",
  },
  legalComments: "inline",
});
const javascript = result.outputFiles.find((f) => f.path.endsWith(".js")).text;
const css = result.outputFiles.find((f) => f.path.endsWith(".css")).text;
// Read the same typed device definitions with esbuild, without maintaining another UI.
const configBuild = await build({
  entryPoints: ["src/devices.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const { DEVICES, FLAT_VIEWS } = await import(
  "data:text/javascript;base64," +
    Buffer.from(configBuild.outputFiles[0].text).toString("base64")
);
await mkdir("public/standalone", { recursive: true });
const outputs = [];
for (const device of DEVICES) {
  const image = await readFile(resolve("public" + device.asset));
  const data = "data:image/png;base64," + image.toString("base64");
  let code = javascript
    .replaceAll(JSON.stringify(device.asset), JSON.stringify(data))
    .replace(/<\/script/gi, "<\\/script");
  const flatAsset = FLAT_VIEWS[device.id]?.asset;
  if (flatAsset) {
    const flatImage = await readFile(resolve("public" + flatAsset));
    code = code.replaceAll(
      JSON.stringify(flatAsset),
      JSON.stringify("data:image/png;base64," + flatImage.toString("base64")),
    );
  }
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${device.name} · PocketSP 单文件版</title><style>${css}</style></head><body><div id="root"></div><script>window.__POCKETSP_STANDALONE__=true;window.__POCKETSP_DEVICE__=${JSON.stringify(device.id)};</script><script>${code}</script></body></html>`;
  const file = "public/standalone/" + device.id + ".html";
  await writeFile(file, html);
  outputs.push({
    id: device.id,
    name: device.name,
    file: device.id + ".html",
    bytes: Buffer.byteLength(html),
  });
}
let collectionCode = javascript;
for (const device of DEVICES) {
  const image = await readFile(resolve("public" + device.asset));
  collectionCode = collectionCode.replaceAll(
    JSON.stringify(device.asset),
    JSON.stringify("data:image/png;base64," + image.toString("base64")),
  );
  const flatAsset = FLAT_VIEWS[device.id]?.asset;
  if (flatAsset) {
    const flatImage = await readFile(resolve("public" + flatAsset));
    collectionCode = collectionCode.replaceAll(
      JSON.stringify(flatAsset),
      JSON.stringify("data:image/png;base64," + flatImage.toString("base64")),
    );
  }
}
collectionCode = collectionCode.replace(/<\/script/gi, "<\\/script");
await writeFile(
  "public/standalone/pocketsp-all.html",
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PocketSP · 全掌机单文件版</title><style>${css}</style></head><body><div id="root"></div><script>window.__POCKETSP_STANDALONE__=true;window.__POCKETSP_COLLECTION__=true;window.__POCKETSP_DEVICE__="sp";</script><script>${collectionCode}</script></body></html>`,
);
await writeFile(
  "public/standalone/index.json",
  JSON.stringify(
    {
      mode: "self-contained-shell-and-system-ui",
      collection: "pocketsp-all.html",
      devices: outputs,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Built ${outputs.length} self-contained HTML files; each embeds its own image, React UI, CSS and interaction code.`,
);
