import { EmulatorAdapter } from "./EmulatorAdapter";
import { CHANNEL, isCommand } from "./protocol";
import type { Request, Response } from "./protocol";
const session = new URLSearchParams(location.search).get("session");
const adapter = new EmulatorAdapter();
// No keyboard listeners from the underlying emulator may bypass the parent arbiter.
for (const type of ["keydown", "keyup"])
  window.addEventListener(type, (e) => e.stopImmediatePropagation(), true);
window.addEventListener("message", async (event: MessageEvent<Request>) => {
  const r = event.data;
  if (
    event.origin !== location.origin ||
    event.source !== parent ||
    r?.channel !== CHANNEL ||
    !session ||
    r.session !== session ||
    !Number.isSafeInteger(r.id) ||
    !isCommand(r.command)
  )
    return;
  const response: Response = { channel: CHANNEL, session, id: r.id, ok: true };
  try {
    const c = r.command;
    switch (c.type) {
      case "hello":
        break;
      case "start":
        await adapter.start(c.rom, c.gameId, c.nativeSave);
        break;
      case "input":
        adapter.input(c.button, c.pressed);
        break;
      case "pause":
        adapter.pause(c.paused);
        break;
      case "volume":
        adapter.volume(c.volume);
        break;
      case "save-state":
        response.data = adapter.saveState();
        break;
      case "load-state":
        adapter.loadState(c.data);
        break;
      case "save-native":
        response.data = adapter.saveNative();
        break;
      case "load-native":
        adapter.loadNative(c.data);
        break;
    }
  } catch (e) {
    response.ok = false;
    response.error = e instanceof Error ? e.message : String(e);
  }
  parent.postMessage(response, location.origin);
});
