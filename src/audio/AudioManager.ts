import type { DeviceId } from "../devices";
export type Cue =
  | "boot"
  | "shutdown"
  | "move"
  | "press"
  | "confirm"
  | "back"
  | "warning";
const FILES: Record<Cue, string> = {
  boot: "/audio/kenney-ui/switch6.wav",
  shutdown: "/audio/kenney-ui/switch7.wav",
  move: "/audio/kenney-ui/rollover1.wav",
  press: "/audio/kenney-ui/switch1.wav",
  confirm: "/audio/kenney-ui/mouseclick1.wav",
  back: "/audio/kenney-ui/mouserelease1.wav",
  warning: "/audio/kenney-ui/switch10.wav",
};
const RATE: Record<DeviceId, number> = {
  gb: 0.85,
  gba: 1.12,
  sp: 1.05,
  ds: 1.25,
  "3ds": 1.15,
  psp: 0.95,
  vita: 0.9,
};
export const SOUND_PRESETS = [
  "OFF",
  "HEAVY",
  "POPS",
  "JAZZ",
  "UNIQUE",
] as const;
export type SoundPreset = (typeof SOUND_PRESETS)[number];
/** CC0 samples, one UI mixer. Game cores retain their own audio engines. */
export class AudioManager {
  private ctx?: AudioContext;
  private gain?: GainNode;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private sources = new Set<AudioBufferSourceNode>();
  private epoch = 0;
  private lastAt = 0;
  private lastCue = "";
  private count = 0;
  private ambience = false;
  private visible = true;
  private music?: AudioBufferSourceNode;
  private musicGain?: GainNode;
  private musicLoading = false;
  setAmbience(enabled: boolean) {
    this.ambience = enabled;
    void this.syncMusic();
  }
  setVisible(visible: boolean) {
    this.visible = visible;
    if (!visible) this.stop();
    else void this.syncMusic();
  }
  private stopMusic() {
    const source = this.music,
      gain = this.musicGain;
    this.music = undefined;
    this.musicGain = undefined;
    if (!source) return;
    if (gain && this.ctx?.state === "running") {
      gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
      source.stop(this.ctx.currentTime + 0.1);
    } else {
      try {
        source.stop();
      } catch {}
    }
  }
  private async syncMusic() {
    const enabled = () =>
      this.ambience &&
      this.visible &&
      !this.config.muted &&
      this.config.volume > 0 &&
      this.ctx?.state === "running";
    if (!enabled()) {
      this.stopMusic();
      return;
    }
    if (this.music || this.musicLoading || !this.ctx) return;
    this.musicLoading = true;
    const ctx = this.ctx,
      epoch = this.epoch;
    const path = "/audio/menu-loop.wav";
    try {
      if (!this.buffers.has(path))
        this.buffers.set(
          path,
          fetch(path)
            .then((r) => {
              if (!r.ok) throw new Error("Music unavailable");
              return r.arrayBuffer();
            })
            .then((b) => ctx.decodeAudioData(b)),
        );
      const buffer = await this.buffers.get(path)!;
      if (!enabled() || epoch !== this.epoch) return;
      const source = ctx.createBufferSource(),
        gain = ctx.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.15);
      source.connect(gain);
      gain.connect(this.gain!);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
      this.music = source;
      this.musicGain = gain;
      source.start();
    } catch {
      this.buffers.delete(path);
    } finally {
      this.musicLoading = false;
    }
  }
  private config = {
    device: "sp" as DeviceId,
    volume: 0.6,
    muted: true,
    keytone: true,
  };
  async unlock() {
    if (!this.ctx) {
      const Constructor = window.AudioContext;
      if (!Constructor) return;
      this.ctx = new Constructor();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.config.muted ? 0 : this.config.volume;
      this.gain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    void this.syncMusic();
  }
  configure(device: DeviceId, volume: number, muted: boolean, keytone = true) {
    if (device !== this.config.device) {
      this.stop();
      this.epoch++;
    }
    this.config = {
      device,
      volume: Math.max(0, Math.min(1, volume)),
      muted,
      keytone,
    };
    if (this.ctx && this.gain) {
      const now = this.ctx.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setTargetAtTime(
        muted ? 0 : this.config.volume,
        now,
        0.025,
      );
    }
    void this.syncMusic();
  }
  async play(cue: Cue) {
    const c = this.config,
      epoch = this.epoch;
    if (
      !this.ctx ||
      this.ctx.state !== "running" ||
      c.muted ||
      c.volume <= 0 ||
      (!c.keytone && !["boot", "shutdown"].includes(cue))
    )
      return;
    const now = performance.now();
    if (cue === this.lastCue && now - this.lastAt < 35) return;
    this.lastAt = now;
    this.lastCue = cue;
    const context = this.ctx,
      path = FILES[cue];
    try {
      if (!this.buffers.has(path))
        this.buffers.set(
          path,
          fetch(path)
            .then((r) => {
              if (!r.ok) throw Error("Audio sample unavailable");
              return r.arrayBuffer();
            })
            .then((b) => context.decodeAudioData(b)),
        );
      const buffer = await this.buffers.get(path)!;
      if (
        epoch !== this.epoch ||
        this.config.muted ||
        !this.visible ||
        this.config.volume <= 0 ||
        (!this.config.keytone && !["boot", "shutdown"].includes(cue)) ||
        context.state !== "running"
      )
        return;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = RATE[c.device];
      source.connect(this.gain!);
      if (this.sources.size >= 8) {
        const old = this.sources.values().next().value as AudioBufferSourceNode;
        old.stop();
        this.sources.delete(old);
      }
      this.sources.add(source);
      source.onended = () => {
        this.sources.delete(source);
        source.disconnect();
      };
      source.start();
      this.count++;
      window.dispatchEvent(
        new CustomEvent("pocketmuseum:audio-played", {
          detail: {
            device: c.device,
            cue,
            rate: RATE[c.device],
            gain: c.volume,
          },
        }),
      );
    } catch {
      this.buffers.delete(path);
    }
  }
  stop() {
    this.stopMusic();
    this.epoch++;
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {}
      source.disconnect();
    }
    this.sources.clear();
  }
  snapshot() {
    return {
      ...this.config,
      state: this.ctx?.state ?? "locked",
      scheduled: this.count,
      active: this.sources.size,
      music: !!this.music,
      decoded: this.buffers.size,
      lastCue: this.lastCue,
    };
  }
  private mediaSources = new WeakMap<
    HTMLMediaElement,
    MediaElementAudioSourceNode
  >();
  attachMedia(element: HTMLMediaElement, preset: SoundPreset) {
    if (!this.ctx) return () => {};
    const ctx = this.ctx;
    let source = this.mediaSources.get(element);
    if (!source) {
      source = ctx.createMediaElementSource(element);
      this.mediaSources.set(element, source);
    }
    source.disconnect();
    const values: Record<SoundPreset, number[]> = {
      OFF: [0, 0, 0],
      HEAVY: [6, -2, 1],
      POPS: [2, 3, 2],
      JAZZ: [3, 1, 4],
      UNIQUE: [-2, 4, 5],
    };
    const filters = [100, 1000, 4500].map((frequency, i) => {
      const f = ctx.createBiquadFilter();
      f.type = i === 0 ? "lowshelf" : i === 2 ? "highshelf" : "peaking";
      f.frequency.value = frequency;
      f.Q.value = 0.8;
      f.gain.value = (values[preset] ?? values.OFF)[i];
      return f;
    });
    source.connect(filters[0]);
    filters[0].connect(filters[1]);
    filters[1].connect(filters[2]);
    filters[2].connect(ctx.destination);
    return () => {
      source!.disconnect();
      filters.forEach((f) => f.disconnect());
      source!.connect(ctx.destination);
    };
  }
  dispose() {
    this.stop();
    void this.ctx?.close();
    this.buffers.clear();
  }
}
export const audioManager = new AudioManager();
if (import.meta.hot) import.meta.hot.dispose(() => audioManager.dispose());
