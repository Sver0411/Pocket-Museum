import { useSystemResources } from "./resources";
import { ThreeApplet, VitaGlyph } from "./ReferenceIcons";
import {
  PSP_GEOMETRY,
  pspItemY,
  VITA_BUBBLES,
  VITA_GATE,
} from "./referenceGeometry";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, Dispatch, PointerEvent } from "react";
import {
  AlarmClock,
  BatteryFull,
  BookOpen,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Film,
  Folder,
  Gamepad2,
  Globe,
  Heart,
  House,
  Image,
  Mail,
  MessageCircle,
  Music,
  NotebookPen,
  Search,
  Settings,
  ShoppingBag,
  Smile,
  Star,
  Sun,
  Triangle,
  Trophy,
  Users,
  Volume2,
  Wifi,
  WifiOff,
  Wrench,
  BarChart3,
  MapPin,
} from "lucide-react";
import type { NativeAction, NativeState, AppIcon, Setting } from "./model";
import {
  APPS_3DS,
  APPS_VITA,
  THREE_DEFAULT_BRIGHTNESS,
  XMB,
  activeSettings,
  isThreeEmpty,
  settingGroupNames,
  settingValue,
  orderedApps,
} from "./model";
import { clockDate, displayedTime, inputKind } from "./settingsBehavior";
import { useIconReorder } from "./useIconReorder";
import { NativeAppIcon } from "./NativeAppIcon";
import { ThreeSoftwareBanner } from "./ThreeSoftwareBanner";
import { ThreeManual } from "./ThreeManual";
import { manualTopics } from "./threeManualContent";
import { PspWave } from "./PspWave";
import { Icon as XmbIcon } from "../third-party/xmdb/Icons";
import { PictoChat } from "./PictoChat";
import type { LocalChat } from "./PictoChat";
import {
  MiiApp,
  PlazaApp,
  MediaApp,
  CameraApp,
  NotebookApp,
  BrowserApp,
  ActivityApp,
  FriendsApp,
  ContentApp,
} from "./NativeApps";
import { WelcomePark } from "./WelcomePark";
import { ServiceApp } from "./ServiceApps";
import "./native.css";
type Props = {
  state: NativeState;
  dispatch: Dispatch<NativeAction>;
  screen: number;
  onPowerOff: () => void;
  chat?: LocalChat;
  volume?: number;
  headphones?: boolean;
};
const ICONS: Record<string, typeof Settings> = {
  settings: Settings,
  card: Gamepad2,
  health: Triangle,
  camera: Camera,
  sound: Music,
  mii: Smile,
  people: Users,
  ar: Star,
  face: Smile,
  chart: BarChart3,
  download: Download,
  bag: ShoppingBag,
  welcome: Star,
  near: MapPin,
  chat: MessageCircle,
  trophy: Trophy,
  globe: Globe,
  film: Film,
  folder: Folder,
  gamepad: Gamepad2,
  network: Globe,
};
export function SystemIcon({
  name,
  size = 28,
}: {
  name: string;
  size?: number;
}) {
  const Icon = ICONS[name] || Settings;
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}
function useTime(prefs: Record<string, string>) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return clockDate(prefs, time.getTime());
}
function timeString(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function IconTile({
  app,
  selected,
  onClick,
  bubble = false,
  style,
}: {
  app: AppIcon;
  selected: boolean;
  onClick: () => void;
  bubble?: boolean;
  style?: CSSProperties;
}) {
  const resources = useSystemResources(bubble ? "vita" : "3ds");
  return (
    <button
      type="button"
      className={`${bubble ? "vita-bubble" : "three-tile"} ${selected ? "selected" : ""}`}
      style={{ "--app-color": app.color, ...style } as CSSProperties}
      onClick={onClick}
      aria-label={app.name}
      data-app-id={app.id}
      data-empty-slot={!bubble && isThreeEmpty(app.id) ? "true" : undefined}
    >
      <span className="system-icon">
        {resources?.icons[app.id] ? (
          <img
            className="system-resource-icon"
            src={resources.icons[app.id]}
            alt=""
          />
        ) : bubble ? (
          <VitaGlyph name={app.id} />
        ) : isThreeEmpty(app.id) ? null : [
            "health",
            "camera",
            "sound",
            "mii",
            "card",
            "settings",
            "ar",
            "people",
            "chart",
            "download",
            "face",
            "bag",
          ].includes(app.icon) ? (
          <NativeAppIcon name={app.icon} size={32} />
        ) : (
          <SystemIcon name={app.icon} size={32} />
        )}
      </span>
      {bubble && <span className="bubble-label">{app.name}</span>}
    </button>
  );
}
function AnalogClock({ date }: { date: Date }) {
  const m = date.getMinutes(),
    h = date.getHours() % 12;
  return (
    <svg viewBox="0 0 100 100" className="ds-clock">
      <rect x="1" y="1" width="98" height="98" fill="#fff9" stroke="#767d83" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <circle
            key={i}
            cx={50 + Math.sin(a) * 42}
            cy={50 - Math.cos(a) * 42}
            r={i % 3 === 0 ? 2 : 1}
            fill="#7d858d"
          />
        );
      })}
      {[
        [12, 50, 17],
        [3, 84, 55],
        [6, 50, 89],
        [9, 17, 55],
      ].map(([n, x, y]) => (
        <text
          key={n}
          x={x}
          y={y}
          textAnchor="middle"
          fontSize="16"
          fill="#8d969e"
        >
          {n}
        </text>
      ))}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="25"
        stroke="#58606a"
        strokeWidth="3"
        transform={`rotate(${h * 30 + m / 2} 50 50)`}
      />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="10"
        stroke="#58606a"
        strokeWidth="2"
        transform={`rotate(${m * 6} 50 50)`}
      />
      <circle cx="50" cy="50" r="3" fill="#59616c" />
    </svg>
  );
}
function Calendar({ date }: { date: Date }) {
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
    offset = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return (
    <div className="ds-calendar">
      <b>
        {date.getFullYear()}/{String(date.getMonth() + 1).padStart(2, "0")}
      </b>
      <div>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <strong key={d}>{d}</strong>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => (
          <span key={i} className={i + 1 === date.getDate() ? "today" : ""}>
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
function Boot({ state: s }: { state: NativeState }) {
  if (s.device === "gb")
    return (
      <div className="gb-boot">
        <div className="gb-cart-block" aria-label="无卡开机标志块" />
      </div>
    );
  if (s.device === "gba" || s.device === "sp")
    return (
      <div className="gba-boot">
        <span>GAME BOY</span>
        <i />
      </div>
    );
  if (s.device === "ds")
    return (
      <div className="ds-boot">
        <span>DS</span>
      </div>
    );
  if (s.device === "3ds") return <div className="three-boot" />;
  return (
    <div className={`sony-boot ${s.device}`}>
      <span>{s.device === "vita" ? "PS Vita" : "PSP"}</span>
    </div>
  );
}
function SettingsPanel({
  s,
  dispatch,
  onPowerOff,
}: {
  s: NativeState;
  dispatch: Dispatch<NativeAction>;
  onPowerOff: () => void;
}) {
  const entries = activeSettings(s),
    groups = settingGroupNames(s);
  const isThreeRoot = s.device === "3ds" && !s.section;
  const isThreeData = s.device === "3ds" && s.section === "Data Management";
  const otherPage =
    s.device === "3ds" && s.section === "Other Settings"
      ? Math.floor(s.selection / 3)
      : 0;
  const visibleEntries =
    s.device === "3ds" && s.section === "Other Settings"
      ? entries.slice(otherPage * 3, otherPage * 3 + 3)
      : entries;
  const selectionOffset =
    s.device === "3ds" && s.section === "Other Settings" ? otherPage * 3 : 0;
  const editor = entries.find((item) => item.key === s.editor) || null;
  const draft = s.draft;
  const value = (item: Setting) => settingValue(s, item);
  const change = (item: Setting) => dispatch({ type: "edit", key: item.key });
  const setDraft = (value: string) => dispatch({ type: "draft", value });
  const save = () => dispatch({ type: "commit" });
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = list.current?.children[s.selection - selectionOffset] as
      | HTMLElement
      | undefined;
    if (el && list.current) {
      const parent = list.current;
      if (el.offsetTop < parent.scrollTop) parent.scrollTop = el.offsetTop;
      else if (
        el.offsetTop + el.offsetHeight >
        parent.scrollTop + parent.clientHeight
      )
        parent.scrollTop = el.offsetTop + el.offsetHeight - parent.clientHeight;
    }
  }, [s.selection, s.section]);
  const title = s.section || "System Settings";
  return (
    <div
      className={`native-settings ${s.device === "ds" && !s.section && !editor ? "ds-settings-root" : ""} ${s.device}-settings ${isThreeRoot ? "three-settings-root" : ""} ${isThreeData ? "three-data-management" : ""} ${s.device === "3ds" && s.section === "Other Settings" ? "three-other-settings" : ""}`}
    >
      <header>
        <Settings size={18} />
        <span>{s.device === "psp" ? "Settings" : title}</span>
      </header>
      {editor ? (
        <div className="native-editor">
          <b>{editor.label}</b>
          {inputKind(s, editor) !== "options" ? (
            <input
              aria-label={editor.label}
              maxLength={editor.key === "nickname" ? 10 : 40}
              type={inputKind(s, editor)}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          ) : (
            <div className="native-options">
              {editor.values.map((v) => (
                <button
                  key={v}
                  className={draft === v ? "chosen" : ""}
                  onClick={() => setDraft(v)}
                >
                  {draft === v ? "●" : "○"} {v}
                </button>
              ))}
            </div>
          )}
          <div className="native-edit-actions">
            <button onClick={() => dispatch({ type: "cancel-edit" })}>
              Cancel
            </button>
            <button onClick={save}>OK</button>
          </div>
        </div>
      ) : (
        <div className="native-setting-list" ref={list}>
          {entries.length
            ? visibleEntries.map((item, i) => (
                <button
                  key={item.key}
                  style={
                    s.device === "psp"
                      ? { top: pspItemY(i, s.selection, true) - 24 }
                      : undefined
                  }
                  className={
                    s.selection === i + selectionOffset ? "chosen" : ""
                  }
                  onClick={() => {
                    dispatch({ type: "select", index: i + selectionOffset });
                    change(item);
                  }}
                >
                  <span>{item.label}</span>
                  <small>{value(item)}</small>
                  <ChevronRight size={13} />
                </button>
              ))
            : groups.map((name, i) => (
                <button
                  className={s.selection === i ? "chosen" : ""}
                  key={name}
                  onClick={() => dispatch({ type: "section", name })}
                >
                  {s.device === "ds" && !s.section && (
                    <span className={`ds-setting-symbol symbol-${i}`}>
                      {i === 0 ? (
                        <Wrench size={22} />
                      ) : i === 1 ? (
                        <Clock size={22} />
                      ) : (
                        <Users size={22} />
                      )}
                    </span>
                  )}
                  {isThreeRoot && (
                    <span className={`three-setting-art setting-${i}`}>
                      <ThreeApplet
                        name={
                          ["browser", "friends", "notifications", "notes"][i]
                        }
                        size={42}
                      />
                      {i === 0 && <Wrench size={23} />}
                    </span>
                  )}
                  <span>{name}</span>
                  <ChevronRight size={15} />
                </button>
              ))}
          {s.device === "ds" && !s.section && (
            <button
              onClick={() =>
                dispatch({ type: "section", name: "Touch Screen" })
              }
            >
              <span className="ds-setting-symbol symbol-3">＋</span>
              <span>Touch Screen</span>
            </button>
          )}
        </div>
      )}
      {s.device === "3ds" && s.section === "Other Settings" && !editor && (
        <div className="three-settings-pages">
          <button
            aria-label="Previous settings page"
            disabled={otherPage === 0}
            onClick={() =>
              dispatch({ type: "select", index: (otherPage - 1) * 3 })
            }
          >
            ‹
          </button>
          <span>{otherPage + 1}</span>
          <button
            aria-label="Next settings page"
            disabled={(otherPage + 1) * 3 >= entries.length}
            onClick={() =>
              dispatch({ type: "select", index: (otherPage + 1) * 3 })
            }
          >
            ›
          </button>
        </div>
      )}
      {s.section === "Touch Screen" && (
        <Calibration
          onComplete={() =>
            dispatch({
              type: "dialog",
              text: "Touch response test complete.\nBrowser pointer coordinates need no hardware calibration.",
            })
          }
        />
      )}
      {!editor && (
        <footer>
          <button onClick={() => dispatch({ type: "back" })}>
            {s.device === "3ds" && !s.section ? "Close" : "Back"}
          </button>
          {s.device === "ds" && (
            <button
              onClick={() =>
                dispatch({
                  type: "dialog",
                  text: "The system will now shut down.\nOK?",
                })
              }
            >
              Quit
            </button>
          )}
        </footer>
      )}
      {s.dialog && (
        <NativeDialog s={s} dispatch={dispatch} onPowerOff={onPowerOff} />
      )}
    </div>
  );
}
function Calibration({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const points = [
    [20, 20],
    [128, 96],
    [235, 171],
  ];
  return (
    <div className="calibration">
      <p>Touch the centre of the cross.</p>
      <button
        aria-label="校准触摸点"
        style={{
          left: `${(points[step][0] / 256) * 100}%`,
          top: `${(points[step][1] / 192) * 100}%`,
        }}
        onClick={() => {
          if (step === 2) {
            onComplete();
            setStep(0);
          } else setStep(step + 1);
        }}
      >
        +
      </button>
    </div>
  );
}
function NativeDialog({
  s,
  dispatch,
  onPowerOff,
}: {
  s: NativeState;
  dispatch: Dispatch<NativeAction>;
  onPowerOff: () => void;
}) {
  return (
    <div className="native-dialog-shade">
      <div className="native-dialog">
        <p>{s.dialog}</p>
        <div>
          {(s.pending || s.dialog.startsWith("Suspend")) && (
            <button onClick={() => dispatch({ type: "dismiss" })}>
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (s.dialog.startsWith("The system will now shut down"))
                onPowerOff();
              else if (s.pending || s.dialog.startsWith("Suspend"))
                dispatch({ type: "button", button: "A" });
              dispatch({ type: "dismiss" });
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
function DsScreen({ state: s, dispatch, screen, onPowerOff, chat }: Props) {
  const time = useTime(s.prefs);
  const top = screen === 0;
  const clock = (
    <div className="ds-home-top">
      <div className="ds-status">
        <span>{s.prefs.nickname || "Player"}</span>
        <span>
          {displayedTime(time, s.prefs)}　{time.getMonth() + 1}/{time.getDate()}
          　M ▰
        </span>
      </div>
      <div className="ds-clock-calendar">
        <AnalogClock date={time} />
        <Calendar date={time} />
      </div>
      {s.app === "settings" && (
        <div className="ds-settings-summary">
          <Settings size={22} />
          <div>
            <b>{s.section || "Settings"}</b>
            <p>
              {s.editor
                ? activeSettings(s).find((e) => e.key === s.editor)?.label
                : "Change the system settings here. Select the setting you would like to change."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
  if (s.phase === "health")
    return (
      <div className="ds-health">
        {top ? (
          <>
            <h3>⚠ WARNING - HEALTH AND SAFETY</h3>
            <p>
              Before playing, read the health and safety precautions booklet for
              important information about your health and safety.
            </p>
          </>
        ) : (
          <button
            aria-label="Touch Screen to continue"
            onClick={() => dispatch({ type: "button", button: "A" })}
          >
            Touch the Touch Screen to continue.
          </button>
        )}
      </div>
    );
  if (s.phase === "app") {
    if (s.app === "pictochat")
      return <PictoChat s={s} dispatch={dispatch} top={top} chat={chat} />;
    if (s.app === "settings")
      return top ? (
        clock
      ) : (
        <SettingsPanel s={s} dispatch={dispatch} onPowerOff={onPowerOff} />
      );
    if (s.app === "download")
      return (
        <div className="ds-download">
          {top ? (
            <>
              <Download size={44} />
              <h3>DS Download Play</h3>
            </>
          ) : (
            <>
              <p>Looking for software available for download...</p>
              <div className="native-search">
                <Search size={22} />
              </div>
              <button onClick={() => dispatch({ type: "back" })}>Cancel</button>
            </>
          )}
        </div>
      );
  }
  if (top) return clock;
  const card = (
    app: string,
    i: number,
    children: React.ReactNode,
    className = "",
  ) => (
    <button
      className={`ds-menu-panel ${className} ${s.selection === i ? "chosen" : ""}`}
      onClick={() => dispatch({ type: "open", app })}
    >
      {children}
    </button>
  );
  return (
    <div className="ds-home-bottom">
      <div className="ds-menu-panels">
        {card(
          "card",
          0,
          <>
            <Gamepad2 size={25} />
            <span>There is no DS Card inserted.</span>
          </>,
          "ds-card",
        )}
        <div className="ds-middle">
          {card(
            "pictochat",
            1,
            <>
              <b className="picto-word">PICTOCHAT</b>
              <MessageCircle size={23} />
            </>,
          )}
          {card(
            "download",
            2,
            <>
              <span>DS Download Play</span>
              <Download size={23} />
            </>,
          )}
        </div>
        {card(
          "gba",
          3,
          <>
            <span className="gba-cart-icon">GBA</span>
            <span>There is no Game Pak inserted.</span>
          </>,
          "ds-gba",
        )}
      </div>
      <footer>
        <button
          aria-label="DS Brightness"
          onClick={() =>
            dispatch({
              type: "set",
              key: "brightness",
              value: String((+(s.prefs.brightness || "3") % 4) + 1),
            })
          }
        >
          <Sun size={17} />
        </button>
        <button
          aria-label="DS Settings"
          className={s.selection === 4 ? "chosen" : ""}
          onClick={() => dispatch({ type: "open", app: "settings" })}
        >
          <Settings size={21} />
        </button>
        <button
          aria-label="DS Alarm"
          onClick={() =>
            dispatch({
              type: "set",
              key: "alarm",
              value: s.prefs.alarm === "On" ? "Off" : "On",
            })
          }
        >
          <AlarmClock
            size={17}
            fill={s.prefs.alarm === "On" ? "#e26e76" : "none"}
          />
        </button>
      </footer>
      {s.dialog && (
        <NativeDialog s={s} dispatch={dispatch} onPowerOff={onPowerOff} />
      )}
    </div>
  );
}
function ThreeScreen({
  state: s,
  dispatch,
  screen,
  onPowerOff,
  volume,
}: Props) {
  const resources = useSystemResources("3ds");
  const apps = orderedApps(s),
    reorder = useIconReorder(s, dispatch, apps, "three-order");
  const homeGrid = useRef<HTMLDivElement>(null),
    swipeGrid = useRef<{ x: number; scroll: number } | null>(null);
  useLayoutEffect(() => {
    const el = homeGrid.current;
    if (!el) return;
    const rows = +(s.prefs.rows || "1"),
      col = Math.floor(s.selection / rows),
      step = rows === 3 ? 56 : 82;
    const left = col * step;
    if (left < el.scrollLeft + step)
      el.scrollTo({ left: Math.max(0, left - step), behavior: "smooth" });
    else if (left + step > el.scrollLeft + el.clientWidth - 20)
      el.scrollTo({
        left: left + step - el.clientWidth + 35,
        behavior: "smooth",
      });
  }, [s.selection, s.prefs.rows, s.phase]);
  const time = useTime(s.prefs);
  const top = screen === 0;
  const app = apps[s.selection] || apps[0];
  const suspendedApp = APPS_3DS.find((item) => item.id === s.suspended);
  const empty = isThreeEmpty(app.id);
  const noSoftware = empty || app.id === "card";
  if (s.threeManual)
    return <ThreeManual manual={s.threeManual} top={top} selection={s.selection} dispatch={dispatch} />;
  if (s.phase === "app") {
    if (s.app === "settings")
      return top ? (
        <div className="three-settings-top">
          <Wrench size={92} />
          <h2>System Settings</h2>
          <span>Ver. 3.0.0-6E</span>
        </div>
      ) : (
        <SettingsPanel s={s} dispatch={dispatch} onPowerOff={onPowerOff} />
      );
    return (
      <SystemApplication
        s={s}
        dispatch={dispatch}
        top={top}
        volume={volume}
        onPowerOff={onPowerOff}
      />
    );
  }
  if (top)
    return (
      <div className="three-home-top">
        <div className="three-status">
          <span className="three-mode">
            <i className="three-signal" />
            Disabled
          </span>
          <span className="three-pedometer">♧ 0</span>
          <span className="three-clock">
            {time.getMonth() + 1}/{time.getDate()} (
            {time.toLocaleDateString("en-US", { weekday: "short" })}){" "}
            {displayedTime(time, s.prefs)}
          </span>
          <span className="three-battery">
            <i />
            <i />
            <i />
          </span>
        </div>
        {resources?.banners[app.id] ? (
          <img
            className="three-resource-banner"
            src={resources.banners[app.id]}
            alt=""
          />
        ) : noSoftware ? (
          <div className="three-home-applets">
            {[
              ["browser", 94],
              ["notifications", 140],
              ["home", 200],
              ["friends", 249],
              ["notes", 309],
            ].map(([name, x]) => (
              <span key={name} style={{ left: Number(x) - 24 }}>
                <ThreeApplet name={String(name)} size={42} />
              </span>
            ))}
          </div>
        ) : <ThreeSoftwareBanner app={app} />}
        <div className="three-camera-hint">
          <span>
            L <Camera size={14} />
          </span>
          <span>
            <Camera size={14} /> R
          </span>
        </div>
        {s.suspended && (
          <div className="three-suspended-shade">
            <div className="three-suspended">
              <header>Suspended software</header>
              <NativeAppIcon name={suspendedApp?.icon ?? "card"} size={49} />
              <strong>{suspendedApp?.name ?? "Software"}</strong>
              <footer>⌂ HOME　Resume suspended software</footer>
            </div>
          </div>
        )}
      </div>
    );
  const rows = +(s.prefs.rows || "1"),
    cols = Math.ceil(apps.length / rows);
  return (
    <div
      className={`three-home-bottom layout-${rows} ${noSoftware && !s.suspended ? "no-card" : ""}`}
    >
      <div className="three-toolbar">
        <button
          aria-label="Screen brightness"
          onClick={() =>
            dispatch({ type: "dialog", text: "Screen Brightness" })
          }
        >
          <Sun size={16} />
        </button>
        <button
          aria-label="Decrease icon rows"
          onClick={() =>
            dispatch({
              type: "set",
              key: "rows",
              value: String(Math.max(1, rows - 1)),
            })
          }
        >
          ▢
        </button>
        <button
          aria-label="Increase icon rows"
          onClick={() =>
            dispatch({
              type: "set",
              key: "rows",
              value: String(Math.min(3, rows + 1)),
            })
          }
        >
          ▦
        </button>
        <button
          aria-label="Game Notes"
          onClick={() => dispatch({ type: "open", app: "notes" })}
        >
          <ThreeApplet name="notes" size={25} />
        </button>
        <button
          aria-label="Friend List"
          onClick={() => dispatch({ type: "open", app: "friends" })}
        >
          <ThreeApplet name="friends" size={25} />
        </button>
        <button
          aria-label="Notifications"
          onClick={() => dispatch({ type: "open", app: "notifications" })}
        >
          <ThreeApplet name="notifications" size={25} />
        </button>
        <button
          aria-label="Internet Browser"
          onClick={() => dispatch({ type: "open", app: "browser" })}
        >
          <ThreeApplet name="browser" size={25} />
        </button>
      </div>
      {rows === 1 && !empty && (
        <div className="three-title">
          {app.id === "card" ? (
            <span>
              There is nothing inserted into
              <br />
              the Game Card slot.
            </span>
          ) : (
            <span>
              {app.name}
              <small>Nintendo</small>
            </span>
          )}
        </div>
      )}
      <div
        ref={homeGrid}
        className={`three-grid-viewport rows-${rows}`}
        onPointerDown={(e) => {
          if (!homeGrid.current) return;
          swipeGrid.current = {
            x: e.clientX,
            scroll: homeGrid.current.scrollLeft,
          };
        }}
        onPointerMove={(e) => {
          if (
            !reorder.dragging &&
            e.buttons &&
            swipeGrid.current &&
            homeGrid.current
          ) {
            const scale =
              e.currentTarget.getBoundingClientRect().width /
              e.currentTarget.offsetWidth;
            homeGrid.current.scrollLeft =
              swipeGrid.current.scroll +
              (swipeGrid.current.x - e.clientX) / scale;
          }
        }}
        onPointerUp={() => (swipeGrid.current = null)}
        onPointerCancel={() => (swipeGrid.current = null)}
      >
        <div
          className={`three-icon-grid ${reorder.dragging ? "reordering" : ""}`}
          {...reorder.bind}
          style={{
            gridTemplateRows: `repeat(${rows},1fr)`,
            gridTemplateColumns: `repeat(${cols},${rows === 3 ? 50 : 72}px)`,
          }}
        >
          {apps.map((a, i) => (
            <IconTile
              key={a.id}
              app={a}
              selected={s.selection === i}
              onClick={() => {
                if (s.selection === i) dispatch({ type: "open", app: a.id });
                else dispatch({ type: "select", index: i });
              }}
            />
          ))}
        </div>
      </div>
      {s.selection >= rows && <button
        className="three-scroll-left"
        aria-label="Scroll software left"
        onClick={() =>
          dispatch({ type: "select", index: Math.max(0, s.selection - rows) })
        }
      >
        ‹
      </button>}
      {s.selection + rows < apps.length && <button
        className="three-scroll-right"
        aria-label="Scroll software right"
        onClick={() =>
          dispatch({
            type: "select",
            index: s.selection + rows,
          })
        }
      >
        ›
      </button>}
      <footer>
        {manualTopics[app.id] && (
          <button
            onClick={() =>
              dispatch({ type: "manual-open", app: app.id })
            }
          >
            Manual
          </button>
        )}
        {s.suspended ? (
          <>
            <button
              onClick={() => dispatch({ type: "close", app: s.suspended })}
            >
              Close
            </button>
            <button onClick={() => dispatch({ type: "home" })}>Resume</button>
          </>
        ) : !noSoftware ? (
          <button onClick={() => dispatch({ type: "open", app: app.id })}>
            Open
          </button>
        ) : null}
      </footer>
      {s.dialog && s.dialog === "Screen Brightness" ? (
        <div className="three-brightness">
          <b>Screen Brightness</b>
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={`Brightness ${n}`}
                className={Number(s.prefs.brightness ?? THREE_DEFAULT_BRIGHTNESS) === n ? "chosen" : ""}
                onClick={() =>
                  dispatch({ type: "set", key: "brightness", value: String(n) })
                }
              >
                {n}
              </button>
            ))}
          </div>
          <b className="three-power-saving-title">Power-Saving Mode</b>
          <div className="three-power-saving">
            {["Off", "On"].map((v) => (
              <button
                key={v}
                className={
                  (s.prefs["power-saving"] ?? "Off") === v ? "chosen" : ""
                }
                onClick={() =>
                  dispatch({ type: "set", key: "power-saving", value: v })
                }
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            className="three-brightness-ok"
            onClick={() => dispatch({ type: "dismiss" })}
          >
            Ⓐ OK
          </button>
        </div>
      ) : (
        s.dialog && (
          <NativeDialog s={s} dispatch={dispatch} onPowerOff={onPowerOff} />
        )
      )}
    </div>
  );
}
function PspScreen({
  state: s,
  dispatch,
  onPowerOff,
  volume,
  headphones,
}: Props) {
  const resources = useSystemResources("psp");
  const time = useTime(s.prefs);
  const cat = XMB[s.category];
  const colour = s.prefs.colour || "Blue";
  return (
    <div className={`psp-xmb psp-colour-${colour.toLowerCase()}`}>
      <PspWave
        month={
          (
            {
              Blue: 5,
              Purple: 10,
              Pink: 1,
              Green: 2,
              Orange: 8,
              Silver: 0,
            } as Record<string, number>
          )[colour] ?? 5
        }
      />
      <div className="psp-info">
        {time.getMonth() + 1}/{time.getDate()}　{displayedTime(time, s.prefs)}　
        <BatteryFull size={17} />
      </div>
      {s.phase === "home" ? (
        <>
          <div className="xmb-categories">
            {XMB.map((c, i) => (
              <button
                key={c.name}
                className={i === s.category ? "selected" : ""}
                style={{
                  left:
                    109 +
                    80 * (i - s.category) +
                    Math.max(-1, Math.min(1, i - s.category)) * 5 -
                    32,
                }}
                onClick={() => dispatch({ type: "category", index: i })}
              >
                {resources?.icons[`category:${c.name}`] ? (
                  <img
                    className="psp-resource-category"
                    src={resources.icons[`category:${c.name}`]}
                    alt=""
                  />
                ) : (
                  <XmbIcon
                    name={c.icon === "sound" ? "music" : c.icon}
                    size={i === s.category ? 44 : 36}
                  />
                )}
                <span>{c.name}</span>
              </button>
            ))}
          </div>
          <div className="xmb-items">
            {cat.items.map((item, i) => (
              <button
                className={i === s.selection ? "selected" : ""}
                style={{ top: pspItemY(i, s.selection) - 24 }}
                key={item}
                onClick={() => {
                  dispatch({ type: "select", index: i });
                  if (s.category === 0) {
                    dispatch({ type: "open", app: "settings" });
                    dispatch({ type: "section", name: item });
                  } else dispatch({ type: "open", app: item });
                }}
              >
                {resources?.icons[`item:${item}`] ? (
                  <img
                    className="psp-resource-item"
                    src={resources.icons[`item:${item}`]}
                    alt=""
                  />
                ) : (
                  <SystemIcon
                    name={s.category === 0 ? "settings" : cat.icon}
                    size={i === s.selection ? 29 : 18}
                  />
                )}
                <span>{item}</span>
              </button>
            ))}
          </div>
          <div className="xmb-selection-glow" />
          {s.pspOptions && (
            <div className="psp-options-shade" onClick={() => dispatch({ type: "psp-options" })}>
              <div className="psp-options" role="dialog" aria-label="Options" onClick={(event) => event.stopPropagation()}>
                <header>{cat.items[s.selection]}</header>
                <button type="button" onClick={() => dispatch({ type: "psp-information" })}>Information</button>
                <footer>× Enter　○ Back</footer>
              </div>
            </div>
          )}
        </>
      ) : s.app.includes("Memory Stick") &&
        s.category >= 1 &&
        s.category <= 3 ? (
        <MediaApp
          s={s}
          dispatch={dispatch}
          top={false}
          volume={volume}
          headphones={headphones}
          kind={
            s.category === 1 ? "image" : s.category === 2 ? "audio" : "video"
          }
        />
      ) : ["Camera", "Internet Browser", "Internet Search"].includes(s.app) ? (
        <SystemApplication
          s={{ ...s, app: s.app === "Camera" ? "camera" : "browser" }}
          dispatch={dispatch}
          top={false}
          volume={volume}
          onPowerOff={onPowerOff}
        />
      ) : s.app === "settings" && activeSettings(s).length ? (
        <SettingsPanel s={s} dispatch={dispatch} onPowerOff={onPowerOff} />
      ) : (
        <div className="psp-empty">
          <SystemIcon name={cat.icon} size={35} />
          <h3>{s.section || s.app}</h3>
          <p>
            {s.section === "USB Connection"
              ? "Connect this system to a PC using a USB cable."
              : s.section === "System Update"
                ? "Connect to a wireless network to perform a system update."
                : s.app === "UMD™"
                  ? "There is no UMD™ inserted."
                  : s.app.includes("Memory Stick")
                    ? "There are no items."
                    : s.app === "Saved Data Utility"
                      ? "There are no saved data."
                      : "The WLAN switch is turned off."}
          </p>
          <button onClick={() => dispatch({ type: "back" })}>○ Back</button>
        </div>
      )}
      {s.phase !== "home" && (
        <div className="psp-nav-help">× Enter　○ Back</div>
      )}
      {s.dialog && (
        <NativeDialog s={s} dispatch={dispatch} onPowerOff={onPowerOff} />
      )}
    </div>
  );
}
function VitaScreen({ state: s, dispatch, onPowerOff, volume }: Props) {
  const apps = orderedApps(s),
    reorder = useIconReorder(s, dispatch, apps, "vita-order");
  const time = useTime(s.prefs);
  const app = APPS_VITA.find((a) => a.id === s.app) || APPS_VITA[0];
  const resources = useSystemResources("vita");
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const cancelTap = useRef(false);
  const pageGesture = {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (!event.isPrimary || event.button !== 0) return;
      cancelTap.current = false;
      swipe.current = { x: event.clientX, y: event.clientY };
      if (!(event.target as HTMLElement).closest("button,a"))
        event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      if (!event.isPrimary || !swipe.current) return;
      const dx = event.clientX - swipe.current.x;
      const dy = event.clientY - swipe.current.y;
      swipe.current = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) <= 36) return;
      cancelTap.current = true;
      if (Math.abs(dx) > Math.abs(dy)) dispatch({ type: "vita-shift", delta: dx < 0 ? 1 : -1 });
      else if (s.phase === "home") dispatch({ type: "page", delta: dy < 0 ? 1 : -1 });
    },
    onPointerCancel: () => { swipe.current = null; },
    onClickCapture: (event: React.MouseEvent<HTMLDivElement>) => {
      if (!cancelTap.current || event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
      cancelTap.current = false;
    },
  };
  const info = (
    <div className="vita-info">
      <span>
        <WifiOff size={20} /> <span className="vita-bt">ᛒ</span>
      </span>
      <span className="vita-open-icons" aria-hidden="true">
        {s.open.slice(-6).map((id) => {
          const a = APPS_VITA.find((a) => a.id === id);
          return a && <i key={id} style={{ background: a.color }} />;
        })}
      </span>
      <span>
        <Volume2 size={18} /> {displayedTime(time, s.prefs)}{" "}
        <BatteryFull size={31} /> <i>0</i>
      </span>
    </div>
  );
  if (s.phase === "lock")
    return (
      <div
        className="vita-lock"
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, y: e.clientY };
          if (!(e.target as HTMLElement).closest("button"))
            e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          if (
            swipe.current &&
            Math.hypot(
              e.clientX - swipe.current.x,
              e.clientY - swipe.current.y,
            ) > 30
          )
            dispatch({ type: "home" });
          swipe.current = null;
        }}
      >
        {info}
        <div className="vita-lock-date">
          <span>
            {time.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </span>
          <strong>{displayedTime(time, s.prefs)}</strong>
        </div>
        <button
          className="vita-peel"
          aria-label="Unlock PS Vita"
          onClick={() => dispatch({ type: "home" })}
        >
          <ChevronLeft size={32} />
        </button>
      </div>
    );
  if (s.phase === "index")
    return (
      <div className="vita-index">
        {info}
        <button
          className="vita-index-home"
          onClick={() => dispatch({ type: "home" })}
        >
          <House size={35} />
        </button>
        <div>
          {s.open.map((id, i) => {
            const a = APPS_VITA.find((a) => a.id === id)!;
            return (
              <button
                key={id}
                className={s.selection === i ? "chosen" : ""}
                onClick={() => dispatch({ type: "open", app: id })}
              >
                <SystemIcon name={a.icon} size={55} />
                <span>{a.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  if (s.phase === "live")
    return (
      <div
        className="vita-live"
        style={{ "--app-color": app.color } as CSSProperties}
        {...pageGesture}
      >
        {info}
        <header>
          <h2>{app.name}</h2>
        </header>
        <button
          className="vita-live-close"
          aria-label="Close LiveArea"
          onClick={() => dispatch({ type: "close", app: app.id })}
        >
          ×
        </button>
        <div
          className={`vita-live-board live-${app.id}`}
          style={
            resources?.backgrounds[`live:${app.id}`]
              ? {
                  backgroundImage: `url(${resources.backgrounds[`live:${app.id}`]})`,
                  backgroundSize: "100% 100%",
                }
              : undefined
          }
        >
          <a
            className="vita-live-guide"
            aria-label="User's Guide"
            href="https://manuals.playstation.net/document/en/psvita/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>?</span>
          </a>
          {app.id === "settings" && (
            <div className="vita-settings-guide">
              <span>?</span>
              <b>User's Guide</b>
            </div>
          )}
          <button
            className="vita-start-gate"
            style={{
              left: app.id === "browser" ? 579 : VITA_GATE.x,
              top: app.id === "browser" ? 149 : VITA_GATE.y,
            }}
            onClick={() => dispatch({ type: "start" })}
          >
            <span>
              <VitaGlyph name={app.id} size={108} />
            </span>
            <b>{s.started.includes(app.id) ? "Continue" : "Start"}</b>
          </button>
        </div>
        <button
          className="vita-back-home"
          onClick={() => dispatch({ type: "back" })}
        >
          <House size={24} />
        </button>
      </div>
    );
  if (s.phase === "app")
    return (
      <div className="vita-application">
        {info}
        {s.app === "settings" ? (
          <SettingsPanel s={s} dispatch={dispatch} onPowerOff={onPowerOff} />
        ) : (
          <SystemApplication
            s={s}
            dispatch={dispatch}
            top={false}
            volume={volume}
            onPowerOff={onPowerOff}
          />
        )}
      </div>
    );
  return (
    <div
      className="vita-home"
      {...pageGesture}
    >
      {info}
      <div className="vita-page-dots">
        {[0, 1].map((p) => (
          <button
            key={p}
            aria-label={`Home page ${p + 1}`}
            className={s.page === p ? "active" : ""}
            onClick={() => dispatch({ type: "page", delta: p - s.page })}
          />
        ))}
      </div>
      <div
        className={`vita-bubbles ${reorder.dragging ? "reordering" : ""}`}
        {...reorder.bind}
      >
        {apps.slice(s.page * 10, s.page * 10 + 10).map((a, i) => (
          <IconTile
            key={a.id}
            bubble
            app={a}
            style={{
              left: VITA_BUBBLES[i][0] - 76,
              top: VITA_BUBBLES[i][1] - 67,
            }}
            selected={s.selection === i}
            onClick={() => dispatch({ type: "open", app: a.id })}
          />
        ))}
      </div>
    </div>
  );
}
function SystemApplication({
  s,
  dispatch,
  top,
  onPowerOff,
  volume,
}: {
  s: NativeState;
  dispatch: Dispatch<NativeAction>;
  top: boolean;
  onPowerOff: () => void;
  volume?: number;
}) {
  const props = { s, dispatch, top, volume };
  const view = s.app;
  if (view === "mii") return <MiiApp {...props} />;
  if (view === "plaza") return <PlazaApp {...props} />;
  if (view === "camera" || view === "ar" || view === "face")
    return <CameraApp {...props} />;
  if (view === "photos") return <MediaApp {...props} kind="image" />;
  if (view === "sound" || view === "music")
    return <MediaApp {...props} kind="audio" />;
  if (view === "videos") return <MediaApp {...props} kind="video" />;
  if (view === "notes") return <NotebookApp {...props} />;
  if (view === "browser") return <BrowserApp {...props} />;
  if (view === "activity") return <ActivityApp {...props} />;
  if (view === "friends" && s.device === "3ds")
    return <FriendsApp {...props} />;
  if (view === "content") return <ContentApp {...props} />;
  if (view === "welcome") return <WelcomePark {...props} />;
  if (view === "download")
    return top ? (
      <div className="three-app-top">
        <Download size={70} />
        <h2>Download Play</h2>
      </div>
    ) : (
      <div className="system-application">
        <header>Download Play</header>
        <div className="application-content">
          <p>
            {s.section
              ? "Looking for software available for download..."
              : "Select a system."}
          </p>
          {!s.section && (
            <div className="download-systems">
              <button
                onClick={() => dispatch({ type: "section", name: "3DS" })}
              >
                3DS
              </button>
              <button onClick={() => dispatch({ type: "section", name: "DS" })}>
                DS
              </button>
            </div>
          )}
          <Search />
        </div>
        <footer>
          <button onClick={() => dispatch({ type: "back" })}>Back</button>
        </footer>
      </div>
    );
  return <ServiceApp {...props} />;
}
export function NativeScreen(props: Props) {
  const { state: s, screen } = props;
  const resources = useSystemResources(s.device);
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const resolution =
    s.device === "gb"
      ? [160, 144]
      : s.device === "gba" || s.device === "sp"
        ? [240, 160]
        : s.device === "ds"
          ? [256, 192]
          : s.device === "3ds"
            ? screen === 0
              ? [400, 240]
              : [320, 240]
            : s.device === "psp"
              ? [480, 272]
              : [960, 544];
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      className={`native-screen native-${s.device} ${s.prefs.large === "On" ? "large-text" : ""}`}
      data-testid={`native-screen-${screen}`}
      data-system-phase={s.phase}
      data-custom-home={resources?.backgrounds.home ? "true" : undefined}
      data-custom-lock={resources?.backgrounds.lock ? "true" : undefined}
      ref={ref}
    >
      <div
        className="native-pixels"
        style={
          {
            width: resolution[0],
            height: resolution[1],
            left:
              (size.w -
                resolution[0] *
                  Math.min(size.w / resolution[0], size.h / resolution[1])) /
              2,
            top:
              (size.h -
                resolution[1] *
                  Math.min(size.w / resolution[0], size.h / resolution[1])) /
              2,
            transform: `scale(${Math.min(size.w / resolution[0], size.h / resolution[1])})`,
            filter: `brightness(${s.prefs.brightness?.match(/^[1-5]$/) ? 0.6 + Number(s.prefs.brightness) * 0.08 : 1}) ${s.prefs.invert === "On" ? "invert(1)" : ""} ${s.prefs.contrast === "On" ? "contrast(1.5)" : ""}`,
            fontFamily: resources?.font
              ? `"PocketMuseum-${s.device}"`
              : undefined,
            fontWeight: s.prefs.bold === "On" ? "bold" : undefined,
            "--resource-home": resources?.backgrounds.home
              ? `url(${resources.backgrounds.home})`
              : undefined,
            "--resource-lock": resources?.backgrounds.lock
              ? `url(${resources.backgrounds.lock})`
              : undefined,
            "--system-accent":
              (
                {
                  Blue: "#6da6cc",
                  Red: "#d36873",
                  Green: "#6f9f76",
                  Purple: "#aa85b4",
                  Orange: "#dca269",
                  Pink: "#d5a0bb",
                } as Record<string, string>
              )[s.prefs.colour] || "#93abc5",
          } as CSSProperties
        }
      >
        {s.phase === "boot" ? (
          <Boot state={s} />
        ) : s.device === "ds" ? (
          <DsScreen {...props} />
        ) : s.device === "3ds" ? (
          <ThreeScreen {...props} />
        ) : s.device === "psp" ? (
          <PspScreen {...props} />
        ) : s.device === "vita" ? (
          <VitaScreen {...props} />
        ) : null}
        {s.phase === "app" &&
          s.app !== "settings" &&
          s.device !== "psp" &&
          s.dialog &&
          (s.device !== "3ds" || screen === 1) && (
            <NativeDialog
              s={s}
              dispatch={props.dispatch}
              onPowerOff={props.onPowerOff}
            />
          )}
      </div>
    </div>
  );
}
