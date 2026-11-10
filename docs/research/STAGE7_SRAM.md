# Stage 7 — Native save initialization

The failing CI diff appends **98,304 bytes** to a **32,768 byte** SRAM image: the received image is **131,072 bytes**, not 98,304 bytes total. Its original bytes remain intact; the added tail is `0xff`.

## Reproduction and source evidence

The bundled mGBA source `57678d6`, `src/platform/libretro/libretro.c`, returns `GBA_SIZE_FLASH1M` from `retro_get_memory_size(RETRO_MEMORY_SAVE_RAM)` while the save type is `GBA_SAVEDATA_AUTODETECT`. The save buffer is initialized to `0xff`; `_doDeferredSetup()` attaches it on the first `retro_run`. For the bundled 2048 Advance ROM, a frame-by-frame browser probe measured 131,072 bytes at frames 0–6 and 32,768 bytes from frame 7. Calling `getSaveFile()` in the actual EJS start callback reproduces the provisional 131,072-byte export.

EmulatorJS 4.2.3 `GameManager.getSaveFile()` invokes `cmd_savefiles`, then reads `getSaveFilePath()` from FS. `loadSaveFiles()` calls `refresh_save_files`, which loads file bytes into the core memory. Neither method waits for save-type detection. The EJS `start` event is emitted immediately after `callMain`, before the first emulated frame. The original adapter injected saves in that callback and reported the game ready immediately.

The `save-save-files-interval` setting also did not exist: the pinned frontend uses `save-save-interval`. Its `disableDatabases` option disables frontend cache stores, but `mountFileSystems()` still mounts auto-persisting IDBFS at `/data/saves`.

## Implementation

- Register the `saveDatabaseLoaded` lifecycle handler before triggering core startup.
- Configure the iframe's GameManager to create session MEMFS directories in place of EJS's auxiliary IDBFS mount. The existing Pocket Museum database remains the persistent owner.
- Write the full stored native image to the pinned core's native path before ROM initialization and the first frame, so the game can read its saved progress during initialization.
- Wait for a real core frame and, when restoring a smaller GBA image, completion of save-size autodetection before resolving `EmulatorAdapter.start`. A timeout reports an initialization error. No bytes are trimmed, padded or substituted.
- Disable the frontend interval using its correct key. The existing application autosave persists full native images.
- Freeze the core before the final shutdown snapshot; resume if persistence fails.

`EmulatorBridge` and `runtime.ts` already carry the complete `Uint8Array` through structured cloning. `putSave` copies the array and resolves on transaction completion. Those paths did not truncate or expand the image and were left unchanged. Database **pocketsp**, version **2**, ROM SHA-256, compound save keys, core and EmulatorJS version fields are preserved.

## Browser evidence

The original strict `expect(restored).toEqual(native)` remains. It now also asserts complete equality with bytes passed from the actual WASM HEAP into FS writes, the resulting FS file, IndexedDB after shutdown and reload, and the file preloaded before the first core frame. A deliberate frame-zero export exercises the original failure window. Evidence JSON records each length, SHA-256, differing-byte count and first differing offset; it is attached to the browser report and included in CI artifacts.

See `STAGE7_SRAM_EVIDENCE.json` for a completed run. Random initial 2048 tiles change save hashes between independent runs; equality is checked within each complete power-cycle experiment.

## Completed validation

2026-11-10: `npm run verify` (76 SHA-256 assets and TypeScript), `npm test` (30 tests), `npm run build`, `npm run test` twice (30 tests each) all passed. The final complete `npm run test:e2e` run passed **37** cases in **6.0 minutes**; the existing optional native PPSSPP case requires a separately running local emulator and remained optional. No SRAM test was skipped. `npm run test:production` passed real GB/GBA/NDS cores, video, state restoration and mobile checks with zero page errors or external requests.
