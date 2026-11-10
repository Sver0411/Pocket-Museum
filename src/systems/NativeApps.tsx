import { audioManager } from "../audio/AudioManager";
import type { SoundPreset } from "../audio/AudioManager";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, Dispatch } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Film,
  Folder,
  Globe,
  Image,
  Mic,
  Music,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Star,
  Trash2,
  Users,
  Video,
  Volume2,
} from "lucide-react";
import type { NativeAction, NativeState } from "./model";
import { addMedia, useBlobUrl, useMedia } from "./media";
import { storage } from "../storage/database";
import type { MediaItem } from "../storage/database";
import { InkPad } from "./InkPad";
import type { InkStroke } from "./InkPad";
import { useAppButtons } from "./useAppButtons";
import {
  useCamera,
  setCameraVideo,
  startCamera,
  stopCamera,
  takePhoto,
} from "./camera";
import "./apps.css";
export interface AppProps {
  s: NativeState;
  dispatch: Dispatch<NativeAction>;
  top: boolean;
  volume?: number;
  headphones?: boolean;
}
function json<T>(value: string | undefined, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function pref(props: AppProps, key: string, value: unknown) {
  props.dispatch({
    type: "set",
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  });
}
function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="app-error">
      {error}
    </p>
  ) : null;
}
export function AppChrome({
  props,
  title,
  children,
  theme = "",
}: {
  props: AppProps;
  title: string;
  children: React.ReactNode;
  theme?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useAppButtons(ref, props.s.device, !props.top);
  return (
    <div
      ref={ref}
      className={`native-app-shell app-${props.s.device} ${theme}`}
    >
      <header>{title}</header>
      <main>{children}</main>
      <footer>
        <button onClick={() => props.dispatch({ type: "back" })}>Back</button>
        {props.s.device === "3ds" && (
          <button onClick={() => props.dispatch({ type: "home" })}>
            HOME Menu
          </button>
        )}
      </footer>
    </div>
  );
}
interface Mii {
  id: string;
  name: string;
  gender: string;
  skin: string;
  hair: string;
  style: number;
  eyes: number;
  mouth: number;
  glasses: boolean;
  colour: string;
  height: number;
  weight: number;
}
const DEFAULT_MII: Mii = {
  id: "",
  name: "",
  gender: "Male",
  skin: "#f3caa6",
  hair: "#3b2419",
  style: 0,
  eyes: 0,
  mouth: 0,
  glasses: false,
  colour: "#db3a3b",
  height: 50,
  weight: 50,
};
const MII_COLOURS = [
  "#c73634",
  "#e77e28",
  "#efcf35",
  "#87ae41",
  "#22683f",
  "#263d88",
  "#3da1d3",
  "#dc67a6",
  "#6c3f81",
  "#6c4430",
  "#ecece6",
  "#363636",
];
function MiiPortrait({ mii }: { mii: Mii }) {
  return (
    <svg
      className="mii-portrait"
      viewBox="0 0 180 230"
      aria-label={`Mii ${mii.name}`}
    >
      <ellipse cx="90" cy="218" rx="49" ry="6" fill="#65727a22" />
      <g
        transform={`translate(${(50 - mii.weight) * 0.08} ${(50 - mii.height) * 0.12}) scale(${0.94 + mii.weight * 0.0012} ${0.94 + mii.height * 0.0012})`}
      >
        <path
          d={
            mii.gender === "Female"
              ? "M65 141 Q48 155 44 190 L66 196 L69 219 H81 L84 199 H96 L101 219 H114 L117 196 L139 190 Q131 154 115 141"
              : "M65 141 Q47 150 46 190 L62 196 L66 220 H80 L84 193 H96 L101 220 H116 L121 192 L136 189 Q133 151 115 141"
          }
          fill={mii.colour}
        />
        <path d="M73 140 L90 157 L107 140" fill="#ffffff77" />
        <path
          d="M45 184 Q37 191 47 197 L60 197 L61 185 M122 184 L137 184 Q146 192 136 197 L121 195"
          fill={mii.skin}
        />
        <path
          d="M66 213 L66 224 H81 V215 M101 214 V224 H117 V212"
          fill="#333840"
        />
        <rect x="79" y="125" width="23" height="24" rx="9" fill={mii.skin} />
        <ellipse cx="39" cy="83" rx="9" ry="16" fill={mii.skin} />
        <ellipse cx="141" cy="83" rx="9" ry="16" fill={mii.skin} />
        <path
          d="M42 59 Q45 17 90 19 Q135 17 138 59 L132 110 Q121 141 90 143 Q58 140 48 110Z"
          fill={mii.skin}
        />
        <path
          d={
            [
              "M42 75 Q29 19 75 13 Q126 0 140 51 L137 82 L126 47 Q110 62 72 36 L50 65Z",
              "M42 82 Q25 25 75 14 Q132 3 140 65 L131 99 L125 49 L51 49 L48 95Z",
              "M41 67 Q30 18 86 13 Q133 12 139 64 L118 37 L102 54 L81 32 L64 54 L46 83Z",
              "M40 86 Q23 17 86 12 Q144 9 141 103 L132 118 L124 48 Q98 68 51 47 L49 115Z",
            ][mii.style % 4]
          }
          fill={mii.hair}
        />
        <g fill="#242429">
          <ellipse
            cx="65"
            cy="82"
            rx={mii.eyes % 2 ? 6 : 4}
            ry={mii.eyes % 3 ? 5 : 8}
          />
          <ellipse
            cx="115"
            cy="82"
            rx={mii.eyes % 2 ? 6 : 4}
            ry={mii.eyes % 3 ? 5 : 8}
          />
        </g>
        <path
          d="M56 67 L73 65 M107 65 L124 67"
          stroke={mii.hair}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M90 86 L84 101 L95 101"
          fill="none"
          stroke="#b67e63"
          strokeWidth="2"
        />
        <path
          d={
            mii.mouth % 3 === 0
              ? "M75 116 Q90 127 106 115"
              : mii.mouth % 3 === 1
                ? "M77 118 L104 118"
                : "M77 114 Q91 107 105 114 Q91 130 77 114"
          }
          fill={mii.mouth % 3 === 2 ? "#a64445" : "none"}
          stroke="#a65b51"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {mii.glasses && (
          <g fill="none" stroke="#30373e" strokeWidth="3">
            <rect x="47" y="72" width="34" height="24" rx="7" />
            <rect x="100" y="72" width="34" height="24" rx="7" />
            <path d="M81 80 Q91 75 100 80" />
          </g>
        )}
      </g>
    </svg>
  );
}
export function MiiApp(props: AppProps) {
  const { s } = props,
    miis = json<Mii[]>(s.prefs.miis, []),
    draft = json<Mii>(s.prefs["mii-draft"], DEFAULT_MII),
    mode = s.prefs["mii-mode"] || "menu",
    tab = s.prefs["mii-tab"] || "Face";
  const change = (delta: Partial<Mii>) =>
    pref(props, "mii-draft", { ...draft, ...delta });
  const begin = () => {
    pref(props, "mii-draft", { ...DEFAULT_MII, id: crypto.randomUUID() });
    pref(props, "mii-mode", "create");
  };
  const save = () => {
    if (!draft.name.trim()) {
      props.dispatch({ type: "dialog", text: "Enter a name for your Mii." });
      return;
    }
    pref(props, "miis", [...miis.filter((m) => m.id !== draft.id), draft]);
    pref(props, "mii-mode", "menu");
  };
  if (props.top)
    return (
      <div className="mii-stage">
        <h2>{mode === "edit" ? "Mii Maker" : "Mii Maker"}</h2>
        <MiiPortrait mii={mode === "edit" ? draft : miis[0] || DEFAULT_MII} />
        <p>
          {mode === "edit"
            ? draft.name
            : miis[0]?.name || "Create your own Mii."}
        </p>
      </div>
    );
  return (
    <AppChrome props={props} title="Mii Maker" theme="mii-app">
      {mode === "menu" ? (
        <div className="mii-menu">
          <div className="mii-catalog">
            {miis.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  pref(props, "mii-draft", m);
                  pref(props, "mii-mode", "edit");
                }}
              >
                <MiiPortrait mii={m} />
                <span>{m.name}</span>
              </button>
            ))}
          </div>
          <button onClick={begin}>Create New Mii</button>
          <button
            disabled={!miis.length}
            onClick={() => {
              pref(props, "mii-draft", miis[0]);
              pref(props, "mii-mode", "edit");
            }}
          >
            View Mii Characters
          </button>
        </div>
      ) : mode === "create" ? (
        <div className="mii-menu">
          <p>How would you like to create your Mii?</p>
          <button onClick={() => pref(props, "mii-mode", "edit")}>
            Start from Scratch
          </button>
          <button onClick={() => pref(props, "mii-mode", "gender")}>
            Create from Photo
          </button>
        </div>
      ) : mode === "gender" ? (
        <div className="mii-menu">
          <CameraPanel {...props} />
          <button onClick={() => pref(props, "mii-mode", "edit")}>
            Choose Features Manually
          </button>
        </div>
      ) : (
        <div className="mii-editor">
          <nav>
            {[
              "Face",
              "Hair",
              "Eyes",
              "Mouth",
              "Glasses",
              "Body",
              "Profile",
            ].map((t) => (
              <button
                className={tab === t ? "chosen" : ""}
                key={t}
                onClick={() => pref(props, "mii-tab", t)}
              >
                {t}
              </button>
            ))}
          </nav>
          {tab === "Face" ? (
            <div className="native-palette">
              {[
                "#f7dfc3",
                "#efc49b",
                "#e3aa7b",
                "#ca9264",
                "#a96f48",
                "#704a34",
              ].map((c) => (
                <button
                  key={c}
                  aria-label={`Skin ${c}`}
                  style={{ background: c }}
                  onClick={() => change({ skin: c })}
                />
              ))}
            </div>
          ) : tab === "Hair" ? (
            <>
              <div className="feature-options">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button key={n} onClick={() => change({ style: n })}>
                    {n + 1}
                  </button>
                ))}
              </div>
              <div className="native-palette">
                {[
                  "#201d1c",
                  "#3b2419",
                  "#65381f",
                  "#9b642f",
                  "#c79551",
                  "#d9c493",
                  "#88847e",
                  "#e6e2d9",
                ].map((c) => (
                  <button
                    key={c}
                    aria-label={`Hair ${c}`}
                    style={{ background: c }}
                    onClick={() => change({ hair: c })}
                  />
                ))}
              </div>
            </>
          ) : tab === "Eyes" || tab === "Mouth" ? (
            <div className="feature-options">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    change(tab === "Eyes" ? { eyes: n } : { mouth: n })
                  }
                >
                  {tab === "Eyes"
                    ? ["● ●", "◕ ◕", "◡ ◡"][n % 3]
                    : ["⌣", "─", "◡"][n % 3]}
                </button>
              ))}
            </div>
          ) : tab === "Glasses" ? (
            <div className="feature-options">
              <button onClick={() => change({ glasses: false })}>None</button>
              <button onClick={() => change({ glasses: true })}>◯—◯</button>
            </div>
          ) : tab === "Body" ? (
            <>
              <label>
                Height
                <input
                  aria-label="Mii Height"
                  type="range"
                  value={draft.height}
                  onChange={(e) => change({ height: +e.target.value })}
                />
              </label>
              <label>
                Build
                <input
                  aria-label="Mii Build"
                  type="range"
                  value={draft.weight}
                  onChange={(e) => change({ weight: +e.target.value })}
                />
              </label>
              <button
                onClick={() =>
                  change({
                    gender: draft.gender === "Male" ? "Female" : "Male",
                  })
                }
              >
                {draft.gender}
              </button>
            </>
          ) : (
            <>
              <label>
                Nickname
                <input
                  aria-label="Mii Nickname"
                  value={draft.name}
                  maxLength={10}
                  onChange={(e) => change({ name: e.target.value })}
                />
              </label>
              <div className="native-palette">
                {MII_COLOURS.map((c) => (
                  <button
                    key={c}
                    aria-label={`Favourite colour ${c}`}
                    style={{ background: c }}
                    onClick={() => change({ colour: c })}
                  />
                ))}
              </div>
            </>
          )}
          <div className="app-actions">
            <button onClick={() => pref(props, "mii-mode", "menu")}>
              Cancel
            </button>
            <button onClick={save}>Save</button>
          </div>
        </div>
      )}
    </AppChrome>
  );
}
export function PlazaApp(props: AppProps) {
  const miis = json<Mii[]>(props.s.prefs.miis, []);
  return props.top ? (
    <div className="plaza-stage">
      {miis.slice(0, 5).map((m) => (
        <MiiPortrait key={m.id} mii={m} />
      ))}
      <h2>StreetPass Mii Plaza</h2>
    </div>
  ) : (
    <AppChrome props={props} title="StreetPass Mii Plaza" theme="plaza-app">
      <div className="plaza-counter">
        <Users />
        <b>{miis.length ? 1 : 0}</b>
        <span>Plaza Population</span>
      </div>
      <div className="app-menu">
        <button
          onClick={() =>
            props.dispatch({
              type: "dialog",
              text: "There are no new arrivals.\nTake your system with you to meet other Mii characters.",
            })
          }
        >
          Plaza Gate
        </button>
        <button onClick={() => props.dispatch({ type: "open", app: "mii" })}>
          Your Mii
        </button>
        <button
          onClick={() =>
            props.dispatch({
              type: "dialog",
              text: "StreetPass wireless communication is unavailable in this browser.",
            })
          }
        >
          StreetPass Settings
        </button>
      </div>
    </AppChrome>
  );
}
function Thumbnail({ item }: { item: MediaItem }) {
  const url = useBlobUrl(item.blob);
  return (
    <div className="native-thumbnail">
      {item.kind === "image" ? (
        <img src={url} alt={item.name} />
      ) : item.kind === "video" ? (
        <Film />
      ) : (
        <Music />
      )}
    </div>
  );
}
export function MediaApp(
  props: AppProps & { kind: "image" | "audio" | "video" },
) {
  const { s, kind } = props,
    { items, error } = useMedia(s.device, kind),
    selected = items.find((m) => m.id === s.prefs[`media:${kind}`]),
    url = useBlobUrl(selected?.blob);
  const player = useRef<HTMLMediaElement | null>(null);
  const [playing, setPlaying] = useState(false),
    [position, setPosition] = useState(0),
    [duration, setDuration] = useState(0),
    [failure, setFailure] = useState("");
  useEffect(() => {
    setPlaying(false);
    setPosition(0);
    setDuration(0);
    setFailure("");
  }, [selected?.id]);
  useEffect(() => {
    if (player.current)
      player.current.volume = Math.min(
        props.volume ?? 0.6,
        s.prefs.avls === "On" ? 0.6 : 1,
      );
  }, [props.volume, s.prefs.avls, selected]);
  useEffect(() => {
    if (player.current && kind === "audio" && s.device === "psp" && !props.top)
      return audioManager.attachMedia(
        player.current,
        props.headphones
          ? ((s.prefs["sound-preset"] ?? "OFF") as SoundPreset)
          : "OFF",
      );
  }, [
    selected,
    kind,
    s.device,
    props.top,
    props.headphones,
    s.prefs["sound-preset"],
  ]);
  useEffect(() => {
    const el = player.current;
    return () => {
      el?.pause();
    };
  }, [selected?.id]);
  const name =
    kind === "image"
      ? "Photos"
      : kind === "audio"
        ? s.device === "3ds"
          ? "3DS Sound"
          : "Music"
        : "Videos";
  if (props.top && kind !== "image" && kind !== "video")
    return (
      <div className="sound-stage">
        <Music size={64} />
        <h2>{selected?.name || name}</h2>
        <div className="sound-bars">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ height: `${20 + ((i * 17) % 50)}%` }} />
          ))}
        </div>
      </div>
    );
  if (props.top)
    return (
      <div className="media-top-preview">
        {selected && kind === "image" ? (
          <img src={url} alt={selected.name} />
        ) : (
          <>
            <FileImage size={65} />
            <p>{selected?.name || name}</p>
          </>
        )}
      </div>
    );
  return (
    <AppChrome props={props} title={name} theme={`media-app media-${kind}`}>
      {!selected ? (
        <>
          <div className="media-library">
            {items.length ? (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => pref(props, `media:${kind}`, item.id)}
                >
                  <Thumbnail item={item} />
                  <span>{item.name}</span>
                  <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                </button>
              ))
            ) : (
              <div className="native-empty">
                <Folder size={39} />
                <p>
                  There are no{" "}
                  {kind === "image"
                    ? "images"
                    : kind === "audio"
                      ? "music files"
                      : "videos"}
                  .
                </p>
              </div>
            )}
          </div>
          {kind === "audio" && s.device === "3ds" && <Recorder {...props} />}
        </>
      ) : (
        <div className="media-detail">
          {kind === "image" ? (
            <img className="media-photo" src={url} alt={selected.name} />
          ) : (
            <>
              {kind === "video" ? (
                <video
                  ref={(el) => {
                    player.current = el;
                  }}
                  src={url}
                  playsInline
                  onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) =>
                    setDuration(e.currentTarget.duration)
                  }
                  onEnded={() => setPlaying(false)}
                  onPause={() => setPlaying(false)}
                  onError={() =>
                    setFailure("This file format cannot be played.")
                  }
                />
              ) : (
                <>
                  <Music className="audio-art" />
                  <audio
                    ref={(el) => {
                      player.current = el;
                    }}
                    src={url}
                    onTimeUpdate={(e) =>
                      setPosition(e.currentTarget.currentTime)
                    }
                    onLoadedMetadata={(e) =>
                      setDuration(e.currentTarget.duration)
                    }
                    onEnded={() => setPlaying(false)}
                    onPause={() => setPlaying(false)}
                    onError={() =>
                      setFailure("This file format cannot be played.")
                    }
                  />
                </>
              )}
              <input
                aria-label="Playback position"
                type="range"
                min="0"
                max={duration || 1}
                step=".1"
                value={Math.min(position, duration || 1)}
                onChange={(e) => {
                  if (player.current)
                    player.current.currentTime = +e.target.value;
                }}
              />
              <div className="media-play-controls">
                <button
                  aria-label="Rewind"
                  onClick={() => {
                    if (player.current)
                      player.current.currentTime = Math.max(
                        0,
                        player.current.currentTime - 10,
                      );
                  }}
                >
                  −10
                </button>
                <button
                  aria-label={playing ? "Pause media" : "Play media"}
                  onClick={() => {
                    if (!player.current) return;
                    if (playing) {
                      player.current.pause();
                      setPlaying(false);
                    } else
                      void player.current
                        .play()
                        .then(() => setPlaying(true))
                        .catch((e) => setFailure(String(e)));
                  }}
                >
                  {playing ? <Pause /> : <Play />}
                </button>
                <button
                  aria-label="Forward"
                  onClick={() => {
                    if (player.current)
                      player.current.currentTime = Math.min(
                        duration,
                        player.current.currentTime + 10,
                      );
                  }}
                >
                  +10
                </button>
              </div>
              <small>
                {Math.floor(position / 60)}:
                {String(Math.floor(position % 60)).padStart(2, "0")} /{" "}
                {Math.floor(duration / 60)}:
                {String(Math.floor(duration % 60)).padStart(2, "0")}
              </small>
            </>
          )}
          <div className="app-actions">
            <button onClick={() => pref(props, `media:${kind}`, "")}>
              Library
            </button>
            <button
              onClick={() => {
                props.dispatch({
                  type: "dialog",
                  text: "Delete this item?",
                  pending: `media:${selected.id}`,
                } as NativeAction);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
      <ErrorMessage error={error || failure} />
    </AppChrome>
  );
}
export function CameraPanel(props: AppProps) {
  const camera = useCamera(),
    [error, setError] = useState(""),
    [count, setCount] = useState(0);
  useEffect(() => () => stopCamera(), []);
  const { items } = useMedia(props.s.device, "image");
  if (props.top)
    return (
      <div className="camera-view">
        {camera.stream ? (
          <video ref={setCameraVideo} autoPlay muted playsInline />
        ) : (
          <>
            <Camera size={64} />
            <span>{camera.busy ? "Starting camera..." : "Camera"}</span>
          </>
        )}
        <div className="camera-reticle" />
      </div>
    );
  return (
    <div className="camera-controls">
      <div className="camera-lower-preview">
        {camera.stream && props.s.device !== "3ds" ? (
          <video ref={setCameraVideo} autoPlay muted playsInline />
        ) : (
          <Camera size={36} />
        )}
      </div>
      <div className="camera-info">
        Photos　{items.length}　{count > 0 ? "Saved" : ""}
      </div>
      <div className="app-actions">
        <button onClick={() => void startCamera()} disabled={camera.busy}>
          Start Camera
        </button>
        <button
          aria-label="Switch camera"
          onClick={() =>
            void startCamera(camera.facing === "user" ? "environment" : "user")
          }
        >
          <RefreshCw size={16} />
        </button>
        <button
          aria-label="Take photo"
          disabled={!camera.stream}
          onClick={() =>
            void takePhoto(props.s.device)
              .then(() => setCount((v) => v + 1))
              .catch((e) => setError(String(e)))
          }
        >
          <Camera size={20} />
        </button>
      </div>
      <ErrorMessage error={camera.error || error} />
    </div>
  );
}
export function CameraApp(props: AppProps) {
  return props.top ? (
    <CameraPanel {...props} />
  ) : (
    <AppChrome
      props={props}
      title={
        props.s.app === "ar"
          ? "AR Games"
          : props.s.app === "face"
            ? "Face Raiders"
            : "Camera"
      }
      theme="camera-app"
    >
      {props.s.app === "ar" && (
        <p>Place an AR Card on a flat surface and point the cameras at it.</p>
      )}
      {props.s.app === "face" && <p>Take a photo of a face.</p>}
      <CameraPanel {...props} />
    </AppChrome>
  );
}
export function Recorder(props: AppProps) {
  const [active, setActive] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [seconds, setSeconds] = useState(0);
  const generation = useRef(0);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    alive = useRef(true),
    timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    alive.current = true;
    const suspend = () => {
      generation.current++;
      if (alive.current) setBusy(false);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
    window.addEventListener("pocketsp:system-suspend", suspend);
    return () => {
      window.removeEventListener("pocketsp:system-suspend", suspend);
      alive.current = false;
      generation.current++;
      if (timer.current) clearInterval(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  const start = async () => {
    if (busy || active) return;
    const token = ++generation.current;
    setBusy(true);
    try {
      setError("");
      if (!navigator.mediaDevices?.getUserMedia)
        throw Error("Microphone access is unavailable.");
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      if (!alive.current || token !== generation.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const r = new MediaRecorder(media);
      recorder.current = r;
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = () => {
        media.getTracks().forEach((t) => t.stop());
        if (timer.current) clearInterval(timer.current);
        void addMedia(
          props.s.device,
          new Blob(chunks, { type: r.mimeType || "audio/webm" }),
          `Recording ${new Date().toLocaleTimeString()}.webm`,
        ).catch((e) => {
          if (alive.current) setError(String(e));
        });
        if (alive.current) setActive(false);
      };
      r.start();
      setSeconds(0);
      setActive(true);
      timer.current = setInterval(
        () =>
          setSeconds((n) => {
            if (n >= 29) {
              if (r.state === "recording") r.stop();
              return 30;
            }
            return n + 1;
          }),
        1000,
      );
    } catch (e) {
      if (token === generation.current) {
        stream.current?.getTracks().forEach((t) => t.stop());
        stream.current = null;
        recorder.current = null;
        if (timer.current) clearInterval(timer.current);
      }
      if (alive.current && token === generation.current)
        setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (alive.current && token === generation.current) setBusy(false);
    }
  };
  return (
    <div className="native-recorder">
      <button
        aria-label={active ? "Stop recording" : "Record sound"}
        disabled={busy}
        onClick={() => {
          if (active) recorder.current?.stop();
          else void start();
        }}
      >
        <Mic size={17} />
        {busy ? "Starting..." : active ? `Stop　${seconds}s` : "Record Sound"}
      </button>
      <ErrorMessage error={error} />
    </div>
  );
}
export function NotebookApp(props: AppProps) {
  const page = Number(props.s.prefs["note-page"] || 0),
    notes = json<{ text: string; strokes: InkStroke[] }[]>(
      props.s.prefs.notes,
      [],
    ),
    note = notes[page] || { text: "", strokes: [] };
  const change = (delta: Partial<typeof note>) => {
    const next = [...notes];
    next[page] = { ...note, ...delta };
    pref(props, "notes", next);
  };
  if (props.top)
    return (
      <div className="notes-top">
        <h2>Game Notes</h2>
        <div>
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className={i === page ? "chosen" : ""}>
              {i + 1}
              {notes[i]?.text ? " ✎" : ""}
            </span>
          ))}
        </div>
      </div>
    );
  return (
    <AppChrome
      props={props}
      title={`Game Notes　${page + 1}/16`}
      theme="notes-app"
    >
      <label className="notes-page-picker">
        Page{" "}
        <select
          aria-label="Game Notes page"
          value={page}
          onChange={(e) => pref(props, "note-page", e.target.value)}
        >
          {Array.from({ length: 16 }, (_, i) => (
            <option key={i} value={i}>
              {i + 1}
            </option>
          ))}
        </select>
      </label>
      <textarea
        aria-label="Game Notes text"
        value={note.text}
        onChange={(e) => change({ text: e.target.value })}
      />
      <InkPad
        strokes={note.strokes}
        onChange={(strokes) => change({ strokes })}
      />
      <div className="app-actions">
        <button
          onClick={() => pref(props, "note-page", String((page + 15) % 16))}
        >
          ◀
        </button>
        <button onClick={() => change({ text: "", strokes: [] })}>Clear</button>
        <button
          onClick={() => pref(props, "note-page", String((page + 1) % 16))}
        >
          ▶
        </button>
      </div>
    </AppChrome>
  );
}
export function BrowserApp(props: AppProps) {
  const [address, setAddress] = useState(props.s.prefs.browserURL || ""),
    [error, setError] = useState(""),
    bookmarks = json<string[]>(props.s.prefs.bookmarks, []);
  const url = props.s.prefs.browserURL || "";
  const go = (value = address) => {
    try {
      const parsed = new URL(
        value.includes("://") ? value : `https://${value}`,
      );
      if (!["https:", "http:"].includes(parsed.protocol))
        throw Error("Enter an HTTP or HTTPS address.");
      pref(props, "browserURL", parsed.href);
      setAddress(parsed.href);
      setError("");
    } catch (e) {
      setError("Enter a valid web address.");
    }
  };
  if (props.top)
    return (
      <div className="browser-top">
        <Globe size={62} />
        <p>{url || "Internet Browser"}</p>
      </div>
    );
  return (
    <AppChrome props={props} title="Internet Browser" theme="browser-app">
      <form
        className="browser-address"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <input
          aria-label="Address"
          value={address}
          placeholder="Enter URL"
          onChange={(e) => setAddress(e.target.value)}
        />
        <button type="submit">Go</button>
      </form>
      {url ? (
        <iframe
          title="System web browser"
          src={url}
          sandbox="allow-scripts allow-forms allow-popups"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="browser-bookmarks">
          <Globe />
          <h3>Bookmarks</h3>
          {bookmarks.length ? (
            bookmarks.map((b) => (
              <button key={b} onClick={() => go(b)}>
                {b}
              </button>
            ))
          ) : (
            <p>There are no bookmarks.</p>
          )}
        </div>
      )}
      <div className="app-actions">
        <button
          onClick={() => {
            pref(props, "browserURL", "");
            setAddress("");
          }}
        >
          Home
        </button>
        <button
          disabled={!url}
          onClick={() =>
            pref(props, "bookmarks", [...new Set([...bookmarks, url])])
          }
        >
          <Star size={13} /> Bookmark
        </button>
        <button
          disabled={!url}
          onClick={() => {
            if (url) window.open(url, "_blank", "noopener,noreferrer");
          }}
        >
          Open
        </button>
      </div>
      <ErrorMessage error={error} />
    </AppChrome>
  );
}
export function ActivityApp(props: AppProps) {
  const stats = json<Record<string, number>>(props.s.prefs.activity, {}),
    days = Object.keys(stats).sort().reverse(),
    day =
      props.s.prefs["activity-day"] ||
      days[0] ||
      new Date().toLocaleDateString("en-CA");
  if (props.top)
    return (
      <div className="activity-top">
        <h2>Activity Log</h2>
        <div className="activity-chart">
          {days.slice(0, 7).map((d) => (
            <div key={d}>
              <i
                style={{ height: `${Math.min(90, (stats[d] || 0) / 10 + 5)}%` }}
              />
              <small>{d.slice(-5)}</small>
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <AppChrome props={props} title="Daily Records" theme="activity-app">
      <label>
        Date
        <select
          aria-label="Activity date"
          value={day}
          onChange={(e) => pref(props, "activity-day", e.target.value)}
        >
          {[...new Set([day, ...days])].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <h3>{day}</h3>
      <p>
        Play Time　{Math.floor((stats[day] || 0) / 3600)}:
        {String(Math.floor(((stats[day] || 0) % 3600) / 60)).padStart(2, "0")}
      </p>
      <p>Today's steps　0</p>
      <p>
        Total Play Time　
        {Math.floor(Object.values(stats).reduce((a, b) => a + b, 0) / 60)} min
      </p>
    </AppChrome>
  );
}
export function FriendsApp(props: AppProps) {
  const [code, setCode] = useState(""),
    friends = json<string[]>(props.s.prefs.friends, []);
  if (props.top)
    return (
      <div className="friends-top">
        <Users size={70} />
        <h2>Friend List</h2>
      </div>
    );
  return (
    <AppChrome props={props} title="Friend List" theme="friends-app">
      <div className="friend-cards">
        {friends.map((f) => (
          <div key={f}>
            <Users />
            <span>{f.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3")}</span>
            <small>Provisionally registered</small>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const digits = code.replace(/\D/g, "");
          if (digits.length !== 12) {
            props.dispatch({
              type: "dialog",
              text: "Enter a twelve-digit friend code.",
            });
            return;
          }
          pref(props, "friends", [...new Set([...friends, digits])]);
          setCode("");
        }}
      >
        <input
          aria-label="Friend code"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="0000-0000-0000"
          maxLength={14}
        />
        <button type="submit">Register Friend</button>
      </form>
    </AppChrome>
  );
}
export function ContentApp(props: AppProps) {
  const { items, error } = useMedia(props.s.device);
  const [mode, setMode] = useState(""),
    [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  return (
    <AppChrome props={props} title="Content Manager" theme="content-app">
      {!mode ? (
        <div className="app-menu">
          <button onClick={() => setMode("PC")}>PC</button>
          <button onClick={() => setMode("PS3 System")}>PS3™ System</button>
        </div>
      ) : (
        <>
          <h3>{mode}</h3>
          <p>{items.length} content items</p>
          <div className="app-menu">
            <button onClick={() => input.current?.click()}>
              Copy Content　PC → PS Vita
            </button>
            <button
              onClick={() => {
                const blob = new Blob(
                    [
                      JSON.stringify(
                        {
                          type: "pocketsp-content-index",
                          items: items.map((m) => ({
                            name: m.name,
                            type: m.kind,
                            size: m.blob.size,
                          })),
                        },
                        null,
                        2,
                      ),
                    ],
                    { type: "application/json" },
                  ),
                  url = URL.createObjectURL(blob),
                  a = document.createElement("a");
                a.href = url;
                a.download = "pocket-museum-content-index.json";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                setMessage("Content list exported.");
              }}
            >
              Content List　PS Vita → PC
            </button>
          </div>
          <input
            hidden
            ref={input}
            aria-label="Copy media from PC"
            type="file"
            accept="image/*,audio/*,video/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              void Promise.all(
                files.map((file) => addMedia(props.s.device, file)),
              )
                .then(() => setMessage("Copy complete."))
                .catch((err) => setMessage(String(err)));
            }}
          />
          {message && <p role="status">{message}</p>}
        </>
      )}
      <ErrorMessage error={error} />
    </AppChrome>
  );
}
