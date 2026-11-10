# Pocket Museum — third-party notices

Pocket Museum is an independent browser project. Hardware model names are descriptive. The seven angled device cutouts and three independent orthographic flat views in `/assets/` were generated with the built-in imagegen tool for this project; prompt and provenance notes are in `docs/design/ASSETS.md` and `docs/design/FLAT_PROMPTS.md`. The device UI does not render the Nintendo wordmark or oval logo. Official hardware photographs are used for research only and are not bundled as UI assets. No commercial game or Nintendo BIOS is included.

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

## DeSmuME / RetroArch WebAssembly core

- DeSmuME contributors, [GPL-2.0-or-later](DeSmuME-GPL-2.0.txt). Fixed EJS 4.2.3 package `desmume-wasm.data`, build 2025-06-14 18:20:07Z; SHA-256 `a9fddaa4bd742e558dfe5095fa4eaf074493b591a7bc18c5f7c65d64b9fa7572`.
- [Source snapshot](source/DeSmuME-c6317a4.tar.gz), EmulatorJS/desmume commit `c6317a446c3146ee30efe55a5c0763975a100ce7`. Exact binary build commit is not published upstream; this dated source snapshot is not a byte-identical rebuild claim. [Core/build sources](https://github.com/EmulatorJS/desmume), [RetroArch frontend sources](https://github.com/EmulatorJS/RetroArch), [build system](https://github.com/EmulatorJS/build).
- The browser frontend is the same GPL-3.0 EmulatorJS / RetroArch distribution as above. No DS BIOS/firmware is bundled; DeSmuME uses its built-in replacement. Hardware/firmware compatibility is not guaranteed for all games.

## GB Snake 2.0

- Christian Reinbacher, [MIT notice](GB-Snake-MIT.txt), [sound driver BSD-3-Clause notice](GB-Snake-Sound-BSD.txt).
- [Unmodified release](https://github.com/reini1305/gb_snake/releases/tag/2.0), [source snapshot](source/GB-Snake-7c5145c.tar.gz), commit `7c5145c2fb40dc123085355a523b07a747cbf497`; snake.gb 32768 bytes, SHA-256 `94f66ec5063b33bea89ed80ed05334e1655bcc71114d2c9a33a953aa368bb049`.
- GBDK 2020 [license overview](GBDK-LICENSE.txt) and [runtime library terms with linking exception](GBDK-LIBRARY-LICENSE.txt) retained. Exact upstream prebuilt toolchain version was not locked. The game has no SRAM; do not treat an empty save file as SRAM validation.

## JamClown v1.0

- Lorenzo Langlois, [MIT notice](JamClown-MIT.txt), [release](https://github.com/lorenzolanglois/JamClown/releases/tag/v1.0), [source snapshot](source/JamClown-v1.0.zip), commit `e35774b344d89ecc1ffce761eb657ac9225e253d`. Author states models, textures and sounds are original.
- Unmodified jamclown.nds 409600 bytes, SHA-256 `21c020cb71997de4cb487d65f0a301679bfb3d4855baa49c36ee72d17d866ccd`.
- BlocksDS dependencies: libnds Zlib / FatFs permissive notices, picolibc BSD/MIT notices, Maxmod ISC, DSWiFi MIT / lwIP BSD / mbedTLS Apache-2.0 OR GPL-2.0 are retained in `BlocksDS-*` license files. The game's source does not lock the exact toolchain versions. The default ARM7 may include wireless/sound code, so related notices are retained even though the game has no networking UI.
- BlocksDS startup source is MPL-2.0, same legal text as [devkitARM-MPL-2.0.txt](devkitARM-MPL-2.0.txt); [source and build instructions](https://codeberg.org/blocksds/sdk/src/branch/master/sys/crts). GCC libraries use GPL-3.0 plus [GCC Runtime Library Exception](GCC-Runtime-Exception.txt). See [official dependency guide](https://blocksds.skylyrac.net/docs/guides/licenses/) and `BlocksDS-provenance.json` for downloaded source notices. No toolchain executable is distributed.
- JamClown does not produce a nonempty cartridge save in our test; its real binary instant state is tested separately. Upstream notes occasional game sound playback issues.

## UI components, font and audio

- XMDB by Moeez Alam (2026), MIT, commit `0cf798b1f5f02404b0c382f4990df10f424a53fd`. Original wave renderer and category SVGs are adapted in `src/third-party/xmdb`; resource cleanup was added. [MIT notice](XMDB-MIT.txt), [upstream](https://github.com/moeezalam/xmdb). No movie artwork/API data copied.
- FS/DoubleScreen ENO© by Enzo Bicudo Pepi (2020), unmodified OFL 1.1 font from lueyo/DS-Menu commit `233601c1cf4184ce079efbbdaa3c69f8edb040a2`. [OFL](FS-DoubleScreen-OFL.txt), [author README](FS-DoubleScreen-README.txt). Other noncommercial fonts in that repository are excluded.
- Kenney UI Audio by Kenney Vleugels, CC0, unmodified WAV conversion mirror Calinou/kenney-ui-audio commit `8c3d81b9159d058c444f89d12d518276b0b09345`. [CC0 notice](Kenney-UI-Audio-CC0.txt), original https://kenney.nl/assets/ui-audio ; file hashes/durations in `/audio/kenney-ui/provenance.json`.
- Menu Loop by Victor / Akikazer (2013), CC0, [source and notice](Menu-Loop-CC0.txt). Unmodified WAV is used as a quiet optional Vita menu substitute, never as original firmware audio.
- These are authorized replacement sounds; no original Nintendo/Sony firmware sound or system font has been extracted.

## Reference geometry corrections

Vita3K GPL-2.0-or-later source commit `a01f2b15b6b4149a80f531e56df351369ebc2e55` is used to adapt LiveArea content/gate/Start-button geometry and lock-screen text positions; copyright Vita3K contributors, [license](Vita3K-GPL-2.0.txt), [source](https://github.com/Vita3K/Vita3K/tree/a01f2b15b6b4149a80f531e56df351369ebc2e55). No Vita firmware icons, fonts, textures or binaries are copied. The adapted source is `src/systems/referenceGeometry.ts` and `NativeScreen.tsx`.

PSP layout numbers are cross-checked against the GPLv3 sources of [VitaXMB](https://github.com/dekiller82/VitaXMB/tree/b2512e46a8562ed4f2203b63647e89bd2b96b9ef) (dekiller82 and contributors) and [PTF-Studio](https://github.com/S1implyBlue/PTF-Studio/tree/3b2c6407201bf02a22412725c9009a52bbdf1517) (S1implyBlue and contributors). Their firmware-derived or separately restricted icon/font/audio/wave assets are excluded. The numerical provenance and original source links are recorded in `docs/research/PSP_VISUAL_SPEC.md`.

`ReferenceIcons.tsx` contains independently constructed vector reconstructions from official visual references, not firmware image extractions. They are not represented as pixel-identical official assets. Sony/Nintendo research screenshots remain in ignored local research directories and are not redistributed. User-provided local resource packs are stored only in that user's browser and are not included in source releases or HTML distributions.

## Museum system-screen previews

`assets/previews/*.png` are browser captures of Pocket Museum's own native UI reconstruction components (2026-11-10). They are used as static exhibit previews on the homepage, and contain no extracted firmware files or commercial-game screenshots. Source components and upstream geometry notices are listed above; the project license applies to the original presentation work.
