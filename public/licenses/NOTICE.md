# PocketSP — third-party notices

PocketSP is an independent browser project. Hardware model names are descriptive. The seven angled device cutouts and three independent orthographic flat views in `/assets/` were generated with the built-in imagegen tool for this project; prompt and provenance notes are in `docs/design/ASSETS.md` and `docs/design/FLAT_PROMPTS.md`. The device UI does not render the Nintendo wordmark or oval logo. Official hardware photographs are used for research only and are not bundled as UI assets. No commercial game or Nintendo BIOS is included.

## EmulatorJS 4.2.3

- Copyright (C) 2022–2025 Ethan O'Brien and contributors.
- [Upstream](https://github.com/EmulatorJS/EmulatorJS/tree/v4.2.3), commit `e150dc0491ae747028919fb82d6598954976ede6`.
- [GPL-3.0-or-later text](EmulatorJS-GPL-3.0.txt).
- Bundled runtime, compression helpers and mGBA packages were obtained from the fixed `https://cdn.emulatorjs.org/4.2.3/data/` directory, not `stable`, `latest` or `nightly`.
- [Original source snapshot](source/EmulatorJS-v4.2.3.tar.gz), including the loader, JS dependencies, compression helpers and build instructions.
- [Local patch notice](source/EmulatorJS-local-version.patch): one URL in the minified runtime is changed so localhost update checks use bundled version metadata. All runtime assets are local.
- Upstream embeds third-party helpers such as nipplejs (MIT), socket.io (MIT), compression libraries and Font Awesome icons. Their upstream source notices are retained in the source snapshot and bundled files. The RAR helper is shipped as part of the upstream package and is unused for uncompressed .gba ROMs.

## mGBA / RetroArch WebAssembly core

- mGBA copyright Vicki Pfau and contributors. [mGBA source](https://github.com/EmulatorJS/mgba), [MPL-2.0 text from the core package](mGBA-MPL-2.0.txt).
- The bundled core archive identifies `mgba`, `minimumEJSVersion: 4.2.2`, package build format `2.0.2`. The upstream report dates it to `2025-06-14T18:10:32Z`.
- [Source snapshot at the latest upstream mGBA commit preceding that build](source/mGBA-57678d6.tar.gz), commit `57678d6180e7020798809703283e02d2bba18b63`. The CDN build report does **not** publish a source commit hash; this snapshot is provenance assistance, not a claim of a reproducible byte-identical build.
- The WebAssembly package includes the RetroArch/libretro frontend, governed by GPL-3.0; see [EmulatorJS build system](https://github.com/EmulatorJS/build) and [RetroArch fork](https://github.com/EmulatorJS/RetroArch) for its build sources and component notices. The absence of exact build-source revision metadata is recorded in the project's acceptance notes.

## 2048 Advance / 2048-GBA 1.3.1

- Code, graphics and sound effects by Basil Termini (Paperdomo101), with contributions by Carsten Teibes. [CC0-1.0 dedication](2048-CC0.txt).
- [Author's download page](https://basil-termini.itch.io/2048-advance), upload `18422861`, named `2048.gba v1.3.1`, 262144 bytes. The ROM is unmodified.
- [Source repository](https://github.com/Paperdomo101/2048-GBA), commit `ae36800dfa1314f96c4c8785b5c2d077fb731aff`. [Bundled source snapshot](source/2048-GBA-ae36800.tar.gz).
- Original 2048 concept: Gabriele Cirulli. This is a native GBA homebrew port, not the browser JavaScript game.
- The source's build files require **libtonc**, **Maxmod**, **devkitARM/devkitPro**, grit and mmutil. CC0 covers the author's original work; it does not replace dependency terms:
  - **libtonc** — Copyright 2005–2009 J Vijn, [MIT text](libtonc-MIT.txt), from the maintained [libtonc repository](https://github.com/gbadev-org/libtonc/blob/master/license.txt).
  - **Maxmod** — Copyright (c) 2008 Mukunda Johnson, [ISC text](Maxmod-ISC.txt), from [upstream](https://github.com/devkitPro/maxmod/blob/master/maxmod_license.txt).
  - **devkitARM startup/linker files** — MPL-2.0, [license text](devkitARM-MPL-2.0.txt), [full source snapshot](source/devkitarm-crtls-1c0c102.tar.gz), upstream commit `1c0c10257c44bbb5a433453bb6bba91582825492` dated 2025-05-02. `gba_crt0.s` and GBA linker/spec files retain their notices. The prebuilt game does not include a dependency lockfile, so its exact toolchain/library versions are not asserted here.

## Application libraries

- React / React DOM — MIT, Meta Platforms, Inc. and affiliates.
- Lucide icons — ISC, Lucide contributors. [License text](Lucide-ISC.txt).
- Vite, TypeScript, Vitest, Playwright, fake-indexeddb retain their licenses in installed packages. Exact versions are locked in package-lock.json.

All hashes of bundled ROM/runtime/license/source files are recorded in `/assets-manifest.json` and can be checked with `npm run verify:assets`.
