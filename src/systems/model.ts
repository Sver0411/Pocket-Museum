import { commitPreference, editValue } from "./settingsBehavior";
import type { DeviceId } from "../devices";
import type { Button } from "../emulator/protocol";
import { manualTopics } from "./threeManualContent";
export interface AppIcon {
  id: string;
  name: string;
  icon: string;
  color: string;
}
export const APPS_3DS: AppIcon[] = [
  {
    id: "health",
    name: "Health and Safety Information",
    icon: "health",
    color: "#eebc00",
  },
  { id: "card", name: "Game Card", icon: "card", color: "#969da3" },
  { id: "camera", name: "3DS Camera", icon: "camera", color: "#ed9836" },
  { id: "sound", name: "3DS Sound", icon: "sound", color: "#638acb" },
  { id: "mii", name: "Mii Maker", icon: "mii", color: "#77b485" },
  {
    id: "plaza",
    name: "StreetPass Mii Plaza",
    icon: "people",
    color: "#5aad2d",
  },
  { id: "ar", name: "AR Games", icon: "ar", color: "#e9b321" },
  { id: "face", name: "Face Raiders", icon: "face", color: "#1776ac" },
  { id: "activity", name: "Activity Log", icon: "chart", color: "#42ad83" },
  { id: "download", name: "Download Play", icon: "download", color: "#ed8b30" },
  { id: "shop", name: "eShop", icon: "bag", color: "#ed9f17" },
  {
    id: "settings",
    name: "System Settings",
    icon: "settings",
    color: "#777f88",
  },
];
const THREE_HOME_SLOTS = [
  ...APPS_3DS,
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `empty-${i}`,
    name: "Empty slot",
    icon: "empty",
    color: "#a2afa8",
  })),
];
const THREE_APPLETS = new Set(["notes", "friends", "notifications", "browser"]);
export const THREE_DEFAULT_BRIGHTNESS = 5;

export function isThreeEmpty(id: string) {
  return id.startsWith("empty-");
}
export const APPS_VITA: AppIcon[] = [
  { id: "welcome", name: "Welcome Park", icon: "welcome", color: "#e9a327" },
  { id: "party", name: "Party", icon: "people", color: "#915ad8" },
  { id: "store", name: "PS Store", icon: "bag", color: "#077dc4" },
  { id: "near", name: "near", icon: "near", color: "#15a143" },
  { id: "friends", name: "Friends", icon: "people", color: "#e58912" },
  { id: "messages", name: "Messages", icon: "chat", color: "#4399d9" },
  { id: "trophies", name: "Trophies", icon: "trophy", color: "#eabc1c" },
  { id: "browser", name: "Browser", icon: "globe", color: "#1989da" },
  { id: "music", name: "Music", icon: "sound", color: "#dd3d9a" },
  { id: "videos", name: "Videos", icon: "film", color: "#64ac36" },
  { id: "photos", name: "Photos", icon: "camera", color: "#5a80d1" },
  { id: "settings", name: "Settings", icon: "settings", color: "#2b9a55" },
  { id: "content", name: "Content Manager", icon: "folder", color: "#497cbd" },
  { id: "remote", name: "PS3 Remote Play", icon: "gamepad", color: "#ee7733" },
];
export const XMB = [
  {
    name: "Settings",
    icon: "settings",
    items: [
      "System Update",
      "USB Connection",
      "Video Settings",
      "Photo Settings",
      "System Settings",
      "Theme Settings",
      "Date & Time Settings",
      "Power Save Settings",
      "Sound Settings",
      "Security Settings",
      "RSS Channel Settings",
      "Network Settings",
    ],
  },
  { name: "Photo", icon: "camera", items: ["Camera", "Memory Stick™"] },
  {
    name: "Music",
    icon: "sound",
    items: ["SensMe™ channels", "Memory Stick™"],
  },
  { name: "Video", icon: "film", items: ["Memory Stick™"] },
  {
    name: "Game",
    icon: "gamepad",
    items: ["Game Sharing", "Saved Data Utility", "UMD™", "Memory Stick™"],
  },
  {
    name: "Network",
    icon: "globe",
    items: [
      "Online Instruction Manuals",
      "LocationFree™ Player",
      "Remote Play",
      "Internet Radio",
      "RSS Channel",
      "Internet Browser",
      "Internet Search",
    ],
  },
  {
    name: "PlayStation Network",
    icon: "network",
    items: [
      "Sign Up for PlayStation Network",
      "Account Management",
      "PlayStation Store",
    ],
  },
];
export function orderedApps(s: NativeState) {
  const list = s.device === "vita" ? APPS_VITA : THREE_HOME_SLOTS,
    key = s.device === "vita" ? "vita-order" : "three-order";
  try {
    const order = JSON.parse(s.prefs[key] || "[]") as string[];
    if (!Array.isArray(order)) return list;
    return [...list].sort((a, b) => {
      const i = order.indexOf(a.id),
        j = order.indexOf(b.id);
      return (
        (i < 0 ? 1000 + list.indexOf(a) : i) -
        (j < 0 ? 1000 + list.indexOf(b) : j)
      );
    });
  } catch {
    return list;
  }
}
export interface Setting {
  key: string;
  label: string;
  values: string[];
}
export const SETTINGS: Record<string, Setting[]> = {
  "System Settings": [
    { key: "format", label: "Format Memory Stick™", values: ["Format"] },
    { key: "wma", label: "Enable WMA Playback", values: ["Off", "On"] },
    { key: "flash", label: "Enable Flash® Player", values: ["Off", "On"] },
    { key: "nickname", label: "Nickname", values: ["Player", "Pocket"] },
    {
      key: "language",
      label: "System Language",
      values: [
        "English",
        "Deutsch",
        "Español",
        "Français",
        "Italiano",
        "日本語",
      ],
    },
    {
      key: "battery",
      label: "Battery Information",
      values: ["Charge Level 100% · Power Source Battery"],
    },
    {
      key: "character",
      label: "Character Set",
      values: ["Multilingual Latin 1 (850)", "US (437)"],
    },
    { key: "umd", label: "UMD™ Auto-Start", values: ["On", "Off"] },
    { key: "usbauto", label: "USB Auto Connect", values: ["On", "Off"] },
    { key: "restore", label: "Restore Default Settings", values: ["Restore"] },
    {
      key: "systeminfo",
      label: "System Information",
      values: ["System Software 6.61 · Nickname Player"],
    },
  ],
  "Theme Settings": [
    { key: "theme", label: "Theme", values: ["Original", "Classic"] },
    {
      key: "colour",
      label: "Colour",
      values: ["Blue", "Purple", "Pink", "Green", "Orange", "Silver"],
    },
    { key: "background", label: "Background", values: ["Original", "None"] },
  ],
  "Date & Time Settings": [
    { key: "date", label: "Date and Time", values: ["Set Manually"] },
    {
      key: "dateformat",
      label: "Date Format",
      values: ["YYYY/MM/DD", "DD/MM/YYYY", "MM/DD/YYYY"],
    },
    {
      key: "timeformat",
      label: "Time Format",
      values: ["24-Hour Clock", "12-Hour Clock"],
    },
    {
      key: "timezone",
      label: "Time Zone",
      values: ["GMT+08:00", "GMT+00:00", "GMT+09:00"],
    },
    {
      key: "dst",
      label: "Daylight Saving",
      values: ["Standard", "Daylight Saving"],
    },
  ],
  "Power Save Settings": [
    {
      key: "backlight",
      label: "Backlight Auto-Off",
      values: ["2 minutes", "5 minutes", "10 minutes", "Off"],
    },
    {
      key: "sleep",
      label: "Auto Sleep",
      values: ["10 minutes", "5 minutes", "15 minutes", "Off"],
    },
    { key: "wlan", label: "WLAN Power Save", values: ["On", "Off"] },
  ],
  "Sound Settings": [
    { key: "avls", label: "AVLS", values: ["Off", "On"] },
    { key: "keytone", label: "Key Tone", values: ["On", "Off"] },
  ],
  "Video Settings": [
    {
      key: "menulang",
      label: "Menu Language",
      values: ["English", "Japanese", "French"],
    },
    {
      key: "audiolang",
      label: "Audio Language",
      values: ["English", "Japanese", "French"],
    },
    {
      key: "subtitles",
      label: "Subtitle Language",
      values: ["English", "Japanese", "Off"],
    },
    {
      key: "umdvolume",
      label: "UMD™ Video Volume",
      values: ["Normal", "+1", "+2"],
    },
  ],
  "Photo Settings": [
    {
      key: "slideshow",
      label: "Slideshow Speed",
      values: ["Normal", "Fast", "Slow"],
    },
  ],
  "Security Settings": [
    { key: "password", label: "Change Password", values: ["0000"] },
    {
      key: "parental",
      label: "Parental Control Level",
      values: ["Off", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
    },
    {
      key: "browserlock",
      label: "Internet Browser Start Control",
      values: ["Off", "On"],
    },
  ],
  "RSS Channel Settings": [
    {
      key: "rss",
      label: "Item Save Options",
      values: ["Latest Item", "Last 2 Items", "Last 5 Items", "All Items"],
    },
  ],
  "Network Settings": [
    {
      key: "network",
      label: "Infrastructure Mode",
      values: ["New Connection"],
    },
    {
      key: "adhoc",
      label: "Ad Hoc Mode",
      values: ["Automatic", "1", "6", "11"],
    },
  ],
};
export const VITA_SETTINGS: Record<string, Setting[]> = {
  "Flight Mode": [
    { key: "flight", label: "Flight Mode", values: ["Off", "On"] },
  ],
  Network: [
    { key: "wifi", label: "Wi-Fi", values: ["On", "Off"] },
    { key: "wifi-settings", label: "Wi-Fi Settings", values: ["Scan"] },
    { key: "bluetooth", label: "Bluetooth® Feature", values: ["Off", "On"] },
  ],
  "System Update": [
    {
      key: "update",
      label: "Update Using Wi-Fi",
      values: ["Check for Update"],
    },
    {
      key: "update-pc",
      label: "Update by Connecting to a PC",
      values: ["Connect"],
    },
  ],
  "PlayStation Network": [
    { key: "psn", label: "Sign In", values: ["Sign In"] },
    {
      key: "privacy",
      label: "Privacy Settings",
      values: ["Friends Only", "No One", "Anyone"],
    },
  ],
  Devices: [
    { key: "bluetooth", label: "Bluetooth® Devices", values: ["Off", "On"] },
    {
      key: "keyboard",
      label: "External Keyboard",
      values: ["English (United States)", "日本語"],
    },
  ],
  "Theme & Background": [
    {
      key: "colour",
      label: "Background Colour",
      values: ["Blue", "Purple", "Pink", "Green", "Orange"],
    },
  ],
  "Location Data": [
    { key: "location", label: "Use Location Data", values: ["Off", "On"] },
  ],
  Security: [
    { key: "screen-lock", label: "Screen Lock", values: ["Off", "On"] },
    { key: "pin", label: "Passcode", values: ["0000"] },
  ],
  Accessibility: [
    { key: "invert", label: "Invert Colours", values: ["Off", "On"] },
    { key: "large", label: "Larger Text", values: ["Off", "On"] },
    { key: "bold", label: "Bold Text", values: ["Off", "On"] },
    { key: "contrast", label: "High Contrast", values: ["Off", "On"] },
  ],
  Notifications: [
    {
      key: "notifications",
      label: "Allow Notifications",
      values: ["On", "Off"],
    },
    {
      key: "notify-sound",
      label: "Play Notification Sound",
      values: ["On", "Off"],
    },
  ],
  "Sound & Display": [
    {
      key: "brightness",
      label: "Brightness",
      values: ["1", "2", "3", "4", "5"],
    },
    { key: "music", label: "System Music", values: ["On", "Off"] },
    { key: "keytone", label: "Key Tone", values: ["On", "Off"] },
    { key: "avls", label: "AVLS", values: ["Off", "On"] },
    { key: "mute-auto", label: "Mute Automatically", values: ["On", "Off"] },
  ],
  "Date & Time": [
    { key: "date", label: "Date & Time", values: ["Set Manually"] },
    {
      key: "dateformat",
      label: "Date Format",
      values: ["YYYY/MM/DD", "DD/MM/YYYY", "MM/DD/YYYY"],
    },
    {
      key: "timeformat",
      label: "Time Format",
      values: ["24-Hour Clock", "12-Hour Clock"],
    },
    {
      key: "timezone",
      label: "Time Zone",
      values: ["GMT+08:00", "GMT+00:00", "GMT+09:00"],
    },
  ],
  Language: [
    {
      key: "language",
      label: "System Language",
      values: [
        "English (United States)",
        "日本語",
        "Deutsch",
        "Français",
        "简体中文",
        "繁體中文",
      ],
    },
  ],
  "Power Save Settings": [
    {
      key: "sleep",
      label: "Enter Standby Mode Automatically",
      values: ["1 minute", "3 minutes", "5 minutes", "10 minutes"],
    },
    {
      key: "wifi-power",
      label: "Use Wi-Fi in Power Save Mode",
      values: ["On", "Off"],
    },
  ],
  System: [
    {
      key: "systeminfo",
      label: "System Information",
      values: ["System Software 3.74 · PS Vita PCH-1000"],
    },
    { key: "name", label: "System Name", values: ["PS Vita", "Player"] },
    {
      key: "control",
      label: "Control with Buttons on This System",
      values: ["On", "Off"],
    },
  ],
  Format: [
    {
      key: "dictionary",
      label: "Clear Learning Dictionary",
      values: ["Clear"],
    },
    { key: "format", label: "Format Memory Card", values: ["Format"] },
    { key: "restore", label: "Restore Settings", values: ["Restore"] },
    { key: "erase", label: "Restore This System", values: ["Restore"] },
  ],
};
export const DS_SETTINGS: Record<string, Setting[]> = {
  Options: [
    {
      key: "startup",
      label: "Start-up Mode",
      values: ["Auto Mode", "Manual Mode"],
    },
    {
      key: "language",
      label: "Language",
      values: [
        "English",
        "Deutsch",
        "Français",
        "Español",
        "Italiano",
        "日本語",
      ],
    },
    {
      key: "gba-screen",
      label: "GBA Mode",
      values: ["Top Screen", "Touch Screen"],
    },
  ],
  Clock: [
    { key: "date", label: "Date", values: ["Set Date"] },
    { key: "alarm", label: "Alarm", values: ["Off", "On"] },
    { key: "alarm-time", label: "Alarm Time", values: ["07:00"] },
    { key: "time", label: "Time", values: ["Set Time"] },
  ],
  User: [
    {
      key: "colour",
      label: "Colour",
      values: [
        "Blue",
        "Red",
        "Orange",
        "Green",
        "Pink",
        "Purple",
        "Black",
        "White",
      ],
    },
    { key: "birthday", label: "Birthday", values: ["01/01", "06/15", "12/25"] },
    { key: "nickname", label: "User Name", values: ["Player", "Pocket"] },
    { key: "message", label: "Message", values: ["Hello!", "Let’s play!"] },
  ],
};
export const THREE_SETTINGS: Record<string, Setting[]> = {
  "Internet Settings": [
    {
      key: "connections",
      label: "Connection Settings",
      values: ["New Connection"],
    },
    { key: "spotpass", label: "SpotPass", values: ["Off", "On"] },
    {
      key: "dsconnections",
      label: "DS Connections",
      values: ["Search for an Access Point"],
    },
  ],
  "Parental Controls": [
    {
      key: "parental",
      label: "Parental Controls",
      values: ["Not Set", "Set Restrictions"],
    },
  ],
  "Data Management": [
    {
      key: "software",
      label: "3DS",
      values: ["No 3DS software is installed in this browser."],
    },
    { key: "dsiware", label: "DSiWare", values: ["No software data."] },
    {
      key: "streetpass-manage",
      label: "StreetPass Management",
      values: [
        "StreetPass hardware communication is not available in this browser.",
      ],
    },
    {
      key: "blocked-users",
      label: "Reset blocked-user settings",
      values: [
        "Original blocked-user settings are not available in this browser.",
      ],
    },
  ],
  "Other Settings": [
    { key: "profile", label: "Profile", values: [] },
    { key: "date", label: "Date & Time", values: ["Set Date and Time"] },
    { key: "calibrate", label: "Touch Screen", values: ["Calibrate"] },
    { key: "3d", label: "3D Calibration", values: ["Calibrate"] },
    { key: "sound", label: "Sound", values: ["Surround", "Stereo", "Mono"] },
    { key: "mic-test", label: "Mic Test", values: ["Test"] },
    { key: "outer-camera", label: "Outer Cameras", values: ["Calibrate"] },
    { key: "circle-pad", label: "Circle Pad", values: ["Calibrate"] },
    {
      key: "transfer",
      label: "System Transfer",
      values: ["Transfer from a 3DS System", "Transfer from a DSi System"],
    },
    {
      key: "language",
      label: "Language",
      values: [
        "English",
        "Deutsch",
        "Français",
        "Español",
        "Italiano",
        "Nederlands",
        "Português",
        "Русский",
      ],
    },
    { key: "update", label: "System Update", values: ["Check for Update"] },
    { key: "erase", label: "Format System Memory", values: ["Format"] },
  ],
  Profile: [
    { key: "nickname", label: "User Name", values: ["Player"] },
    { key: "birthday", label: "Birthday", values: ["2000-01-01"] },
    {
      key: "region",
      label: "Region Settings",
      values: ["Region settings are not implemented in this browser."],
    },
    {
      key: "ds-profile",
      label: "DS Profile",
      values: ["The original DS profile page has not yet been reconstructed."],
    },
  ],
};
export interface NativeState {
  device: DeviceId;
  phase: "off" | "boot" | "health" | "lock" | "home" | "live" | "index" | "app";
  app: string;
  section: string;
  selection: number;
  category: number;
  page: number;
  dialog: string;
  prefs: Record<string, string>;
  open: string[];
  started: string[];
  room: string;
  editor: string;
  draft: string;
  shutdown: boolean;
  suspended: string;
  pending: string;
  threeHomeIndex: number;
  threeResumeView: Pick<NativeState, "section" | "selection" | "editor" | "draft"> | null;
  threeManual: { app: string; homeIndex: number; topic: number; large: boolean } | null;
  pspOptions: boolean;
  messages: import("./wireless").ChatMessage[];
}
export type NativeAction =
  | { type: "edit"; key: string }
  | { type: "draft"; value: string }
  | { type: "commit"; now?: number }
  | { type: "cancel-edit" }
  | { type: "power"; on: boolean; device: DeviceId }
  | { type: "ready" }
  | { type: "button"; button: Button }
  | { type: "home" }
  | { type: "open"; app: string }
  | { type: "select"; index: number }
  | { type: "category"; index: number }
  | { type: "section"; name: string }
  | { type: "back" }
  | { type: "start" }
  | { type: "page"; delta: number }
  | { type: "vita-shift"; delta: -1 | 1 }
  | { type: "manual-open"; app: string }
  | { type: "manual-topic"; index: number }
  | { type: "manual-size" }
  | { type: "psp-options" }
  | { type: "psp-information" }
  | { type: "set"; key: string; value: string }
  | { type: "hydrate"; prefs: Record<string, string> }
  | { type: "dialog"; text: string; pending?: string }
  | { type: "dismiss" }
  | { type: "close"; app: string }
  | { type: "message"; text: string; drawing?: import("./InkPad").InkStroke[] }
  | { type: "receive-chat"; message: import("./wireless").ChatMessage }
  | { type: "room"; name: string };
export function initialSystem(
  device: DeviceId,
  prefs: Record<string, string> = {},
): NativeState {
  return {
    device,
    phase: "off",
    app: "",
    section: "",
    selection: 0,
    category: 0,
    page: 0,
    dialog: "",
    prefs,
    open: [],
    started: [],
    room: "",
    editor: "",
    draft: "",
    shutdown: false,
    suspended: "",
    pending: "",
    threeHomeIndex: 0,
    threeResumeView: null,
    threeManual: null,
    pspOptions: false,
    messages: [],
  };
}
export function settingGroups(s: NativeState) {
  return s.device === "ds"
    ? DS_SETTINGS
    : s.device === "3ds"
      ? THREE_SETTINGS
      : s.device === "vita"
        ? VITA_SETTINGS
        : SETTINGS;
}
export function activeSettings(s: NativeState) {
  return settingGroups(s)[s.section] || [];
}
export function settingGroupNames(s: NativeState) {
  return Object.keys(settingGroups(s)).filter(
    (name) => s.device !== "3ds" || name !== "Profile",
  );
}
export function settingValue(s: NativeState, item: Setting) {
  return s.prefs[item.key] ?? item.values[0];
}
export function systemBack(s: NativeState): NativeState {
  if (s.dialog) return { ...s, dialog: "", pending: "" };
  if (s.pspOptions) return { ...s, pspOptions: false };
  if (s.threeManual)
    return s.threeManual.topic < 0
      ? closeThreeManual(s)
      : { ...s, selection: s.threeManual.topic, threeManual: { ...s.threeManual, topic: -1 } };
  if (s.editor) return { ...s, editor: "", draft: "" };
  if (s.device === "psp" && s.phase === "app")
    return {
      ...s,
      phase: "home",
      app: "",
      section: "",
      selection: Math.max(0, XMB[s.category].items.indexOf(s.section || s.app)),
    };
  if (s.section)
    return {
      ...s,
      section:
        s.device === "3ds" && s.section === "Profile" ? "Other Settings" : "",
      selection: 0,
    };
  if (s.device === "vita" && s.phase === "app") return { ...s, phase: "live" };
  if (s.device === "vita" && s.phase === "live")
    return { ...s, phase: "home", selection: 0 };
  if (s.device === "ds" && s.app === "settings")
    return { ...s, dialog: "The system will now shut down.\nOK?" };
  if (s.device === "3ds" && s.phase === "app") return returnThreeHome(s);
  return { ...s, phase: "home", app: "", section: "", selection: 0 };
}

function returnThreeHome(s: NativeState): NativeState {
  return {
    ...s, phase: "home", app: "", section: "", dialog: "", editor: "", draft: "",
    selection: s.threeHomeIndex,
  };
}

function resumeThreeSoftware(s: NativeState): NativeState {
  return {
    ...s, ...s.threeResumeView, phase: "app", app: s.suspended,
    suspended: "", threeResumeView: null, dialog: "",
  };
}

function closeThreeManual(s: NativeState): NativeState {
  return { ...s, phase: "home", app: "", threeManual: null, selection: s.threeManual?.homeIndex ?? 0, dialog: "" };
}

function open(s: NativeState, app: string): NativeState {
  if (!app) return s;
  if (["gb", "gba", "sp"].includes(s.device)) return s;
  if (s.device === "3ds" && isThreeEmpty(app)) return s;
  if (app === "card") return s.device === "3ds" ? s : { ...s, dialog: "There is no DS Card inserted." };
  if (app === "gba") return { ...s, dialog: "There is no Game Pak inserted." };
  if (s.device === "3ds" && app === s.suspended) return resumeThreeSoftware(s);
  if (s.device === "3ds" && s.suspended && app !== s.suspended && !THREE_APPLETS.has(app))
    return {
      ...s,
      pending: app,
      dialog: "Close the suspended software?\nAny unsaved data will be lost.",
    };
  const live = s.device === "vita";
  return {
    ...s,
    app,
    phase: live ? "live" : "app",
    section: "",
    selection: 0,
    threeHomeIndex: s.device === "3ds" && s.phase === "home" ? s.selection : s.threeHomeIndex,
    dialog: "",
    open: live
      ? s.open.includes(app)
        ? s.open
        : [...s.open, app].slice(-6)
      : s.open,
  };
}
export function systemReducer(s: NativeState, a: NativeAction): NativeState {
  switch (a.type) {
    case "manual-open":
      if (s.device !== "3ds" || s.phase !== "home" || !manualTopics[a.app]) return s;
      return {
        ...s, app: "manual", phase: "app", selection: 0, dialog: "",
        threeManual: { app: a.app, homeIndex: s.selection, topic: -1, large: false },
      };
    case "manual-topic": {
      if (!s.threeManual) return s;
      const last = manualTopics[s.threeManual.app].length - 1;
      const topic = Math.max(0, Math.min(last, a.index));
      return { ...s, selection: topic, threeManual: { ...s.threeManual, topic } };
    }
    case "manual-size":
      return s.threeManual ? { ...s, threeManual: { ...s.threeManual, large: !s.threeManual.large } } : s;
    case "vita-shift": {
      if (s.device !== "vita" || (s.phase !== "live" && s.phase !== "home")) return s;
      const index = s.phase === "live" ? s.open.indexOf(s.app) : -1;
      const next = index + a.delta;
      if (next < -1 || next >= s.open.length) return s;
      return next < 0
        ? { ...s, phase: "home", app: "", selection: 0, section: "" }
        : { ...s, phase: "live", app: s.open[next], selection: next, section: "" };
    }
    case "psp-options": {
      const item = XMB[s.category]?.items[s.selection];
      return s.device === "psp" && s.phase === "home" && ["Memory Stick™", "UMD™", "Saved Data Utility"].includes(item)
        ? { ...s, pspOptions: !s.pspOptions }
        : s;
    }
    case "psp-information": {
      if (!s.pspOptions) return s;
      const item = XMB[s.category].items[s.selection];
      return {
        ...s, pspOptions: false,
        dialog: `${item}\n${item === "Memory Stick™" ? "Media is stored in the browser library." : item === "UMD™" ? "There is no UMD™ inserted." : "There are no saved data."}`,
      };
    }
    case "edit": {
      const item = activeSettings(s).find((e) => e.key === a.key);
      if (!item) return s;
      if (s.device === "3ds" && item.key === "profile")
        return { ...s, section: "Profile", selection: 0 };
      if (item.key === "calibrate")
        return { ...s, section: "Touch Screen", editor: "" };
      if (item.key === "language")
        return {
          ...s,
          dialog:
            "This recreation currently displays English. Other system languages are not implemented.",
        };
      if (
        [
          "language",
          "wifi-settings",
          "bluetooth",
          "keyboard",
          "connections",
          "dsconnections",
          "outer-camera",
          "3d",
          "circle-pad",
          "transfer",
          "update",
          "update-pc",
          "psn",
          "wma",
          "flash",
          "network",
          "adhoc",
        ].includes(item.key)
      )
        return {
          ...s,
          dialog:
            "This hardware or service feature is not available in this browser. No connection or system change was made.",
        };
      if (
        [
          "systeminfo",
          "battery",
          "usage",
          "errorhistory",
          "software",
          "extra",
          "dsiware",
          "streetpass-manage",
          "blocked-users",
          "region",
          "ds-profile",
          "legal",
        ].includes(item.key)
      )
        return { ...s, dialog: item.values.join("\n") };
      if (["restore", "format", "erase", "dictionary"].includes(item.key))
        return {
          ...s,
          dialog:
            item.key === "restore"
              ? "Restore the default settings?"
              : item.key === "dictionary"
                ? "Clear the learning dictionary?"
                : "Delete all data on the memory card?",
          pending: `setting:${item.key}`,
        };
      return { ...s, editor: a.key, draft: editValue(s, item) };
    }
    case "draft":
      return { ...s, draft: a.value };
    case "cancel-edit":
      return { ...s, editor: "", draft: "" };
    case "commit":
      return commitPreference(s, a.now);
    case "power":
      return {
        ...initialSystem(a.device, s.prefs),
        phase: a.on ? "boot" : "off",
      };
    case "hydrate":
      return { ...s, prefs: a.prefs };
    case "ready":
      return {
        ...s,
        selection:
          s.device === "3ds"
            ? Math.max(
                0,
                orderedApps(s).findIndex((a) => a.id === "card"),
              )
            : s.selection,
        phase: ["gb", "gba", "sp"].includes(s.device)
          ? "boot"
          : s.device === "ds"
            ? "health"
            : s.device === "vita"
              ? "lock"
              : "home",
      };
    case "select":
      return { ...s, selection: a.index };
    case "category":
      return {
        ...s,
        category: (a.index + XMB.length) % XMB.length,
        selection: 0,
        section: "",
      };
    case "section":
      return { ...s, section: a.name, selection: 0, editor: "", draft: "" };
    case "dialog":
      return { ...s, dialog: a.text, pending: a.pending || "" };
    case "dismiss":
      return { ...s, dialog: "", pending: "" };
    case "set":
      return { ...s, prefs: { ...s.prefs, [a.key]: a.value } };
    case "back":
      return systemBack(s);
    case "open":
      return open(s, a.app);
    case "page":
      return {
        ...s,
        page: Math.max(0, Math.min(1, s.page + a.delta)),
        selection: 0,
      };
    case "start":
      return s.device === "vita"
        ? {
            ...s,
            phase: "app",
            section: "",
            selection: 0,
            started: [...new Set([...s.started, s.app])],
          }
        : s;
    case "close":
      return {
        ...s,
        suspended: "",
        threeResumeView: null,
        pending: "",
        open: s.open.filter((x) => x !== a.app),
        started: s.started.filter((x) => x !== a.app),
        phase: "home",
        app: "",
      };
    case "room":
      return { ...s, room: a.name, messages: [] };
    case "message":
      return {
        ...s,
        messages: [
          ...s.messages,
          {
            id: crypto.randomUUID(),
            sender: s.prefs.nickname || "Player",
            text: a.text,
            drawing: a.drawing || [],
            time: Date.now(),
          },
        ].slice(-40),
      };
    case "receive-chat":
      return s.messages.some((m) => m.id === a.message.id)
        ? s
        : { ...s, messages: [...s.messages, a.message].slice(-40) };
    case "home":
      if (s.phase === "off" || s.phase === "boot") return s;
      if (s.threeManual) return closeThreeManual(s);
      if (s.device === "vita")
        return {
          ...s,
          phase:
            s.phase === "lock"
              ? "home"
              : s.phase === "app"
                ? "live"
                : s.phase === "index"
                  ? "home"
                  : "index",
          section: "",
          dialog: "",
        };
      if (s.device === "3ds") {
        if (s.phase === "app") {
          if (s.app === "settings") return s;
          if (THREE_APPLETS.has(s.app)) return returnThreeHome(s);
          const tile = orderedApps(s).findIndex((item) => item.id === s.app);
          return {
            ...returnThreeHome(s),
            suspended: s.app,
            threeResumeView: { section: s.section, selection: s.selection, editor: s.editor, draft: s.draft },
            selection: tile < 0 ? s.threeHomeIndex : tile,
          };
        }
        if (s.phase === "home" && s.suspended)
          return resumeThreeSoftware(s);
      }
      return {
        ...s,
        phase: "home",
        app: "",
        section: "",
        dialog: "",
        pspOptions: false,
        selection: 0,
      };
    case "button": {
      const b = a.button;
      if (s.phase === "off" || s.phase === "boot") return s;
      if (s.phase === "health") return b === "A" ? { ...s, phase: "home" } : s;
      if (s.phase === "lock") return b === "A" ? { ...s, phase: "home" } : s;
      if (s.dialog) {
        if (s.device === "3ds" && s.dialog === "Screen Brightness" && (b === "Left" || b === "Right")) {
          const brightness = Number(s.prefs.brightness) || THREE_DEFAULT_BRIGHTNESS;
          const next = Math.max(1, Math.min(5, brightness + (b === "Right" ? 1 : -1)));
          return systemReducer(s, { type: "set", key: "brightness", value: String(next) });
        }
        if (b === "A" && s.pending.startsWith("setting:"))
          return {
            ...s,
            prefs:
              s.pending === "setting:dictionary"
                ? { ...s.prefs, dictionary: "" }
                : s.pending === "setting:restore"
                  ? Object.fromEntries(
                      Object.entries(s.prefs).filter(
                        ([key]) =>
                          [
                            "miis",
                            "notes",
                            "bookmarks",
                            "friends",
                            "activity",
                            "browserURL",
                          ].includes(key) || key.startsWith("park:"),
                      ),
                    )
                  : s.pending === "setting:erase"
                    ? { eraseMedia: String(Date.now()) }
                    : { ...s.prefs, eraseMedia: String(Date.now()) },
            pending: "",
            dialog: "",
            editor: "",
            draft: "",
          };
        if (b === "A" && s.pending.startsWith("media:"))
          return {
            ...s,
            prefs: { ...s.prefs, deleteMedia: s.pending.slice(6) },
            pending: "",
            dialog: "",
          };
        if (b === "A" && s.pending)
          return open(
            { ...s, suspended: "", threeResumeView: null, pending: "", dialog: "" },
            s.pending,
          );
        if (b === "B") return { ...s, dialog: "", pending: "" };
        if (b === "A" && s.dialog.startsWith("The system will now shut down"))
          return { ...s, shutdown: true, dialog: "" };
        if (b === "A")
          return {
            ...s,
            dialog: "",
            ...(s.dialog.startsWith("Suspend")
              ? { phase: "home" as const, app: "" }
              : {}),
          };
        return s;
      }
      if (s.editor) {
        if (b === "B") return { ...s, editor: "", draft: "" };
        if (b === "A") return systemReducer(s, { type: "commit" });
        const e = activeSettings(s).find((e) => e.key === s.editor);
        if (e && ["Up", "Down", "Left", "Right"].includes(b)) {
          const n = e.values.indexOf(s.draft),
            delta = b === "Up" || b === "Left" ? -1 : 1;
          return {
            ...s,
            draft: e.values[(n + delta + e.values.length) % e.values.length],
          };
        }
        return s;
      }
      if (s.pspOptions) {
        if (b === "A") return systemReducer(s, { type: "psp-information" });
        if (b === "B" || b === "X") return { ...s, pspOptions: false };
        return s;
      }
      if (b === "B") return systemBack(s);
      if (s.threeManual) {
        if (b === "Y") return systemReducer(s, { type: "manual-size" });
        const { app, topic } = s.threeManual;
        if (topic < 0) {
          if (b === "A") return systemReducer(s, { type: "manual-topic", index: s.selection });
          if (b === "Up" || b === "Down")
            return { ...s, selection: Math.max(0, Math.min(manualTopics[app].length - 1, s.selection + (b === "Down" ? 1 : -1))) };
        } else if (b === "Left" || b === "Right" || b === "L" || b === "R") {
          return systemReducer(s, { type: "manual-topic", index: topic + (b === "Right" || b === "R" ? 1 : -1) });
        }
        return s;
      }
      if (s.phase === "live")
        return b === "A" ? systemReducer(s, { type: "start" })
          : b === "L" || b === "R" ? systemReducer(s, { type: "vita-shift", delta: b === "R" ? 1 : -1 }) : s;
      if (s.phase === "index")
        return b === "A" && s.open.length
          ? { ...s, phase: "live", app: s.open[s.selection % s.open.length] }
          : b === "Left" || b === "Right"
            ? {
                ...s,
                selection: Math.max(
                  0,
                  Math.min(
                    s.open.length - 1,
                    s.selection + (b === "Right" ? 1 : -1),
                  ),
                ),
              }
            : s;
      if (s.phase === "home") {
        if (s.device === "psp") {
          if (b === "X") return systemReducer(s, { type: "psp-options" });
          if (b === "Left" || b === "Right")
            return systemReducer(s, {
              type: "category",
              index: s.category + (b === "Right" ? 1 : -1),
            });
          const list = XMB[s.category].items;
          if (b === "Up" || b === "Down")
            return {
              ...s,
              selection: Math.max(
                0,
                Math.min(
                  list.length - 1,
                  s.selection + (b === "Down" ? 1 : -1),
                ),
              ),
            };
          if (b === "A")
            return s.category === 0
              ? {
                  ...s,
                  phase: "app",
                  app: "settings",
                  section: list[s.selection],
                  selection: 0,
                }
              : open(s, list[s.selection]);
        } else {
          const names =
            s.device === "ds"
              ? ["card", "pictochat", "download", "gba", "settings"]
              : s.device === "3ds"
                ? orderedApps(s).map((x) => x.id)
                : orderedApps(s)
                    .slice(s.page * 10, s.page * 10 + 10)
                    .map((x) => x.id);
          if (["Up", "Down", "Left", "Right"].includes(b)) {
            const rows = Number(s.prefs.rows || 1);
            if (s.device === "3ds") {
              const row = s.selection % rows;
              const step = b === "Right" ? rows : b === "Left" ? -rows
                : b === "Down" && row + 1 < rows ? 1 : b === "Up" && row > 0 ? -1 : 0;
              const selection = s.selection + step;
              return selection >= 0 && selection < names.length ? { ...s, selection } : s;
            }
            const step =
              b === "Right"
                  ? 1
                  : b === "Left"
                    ? -1
                    : b === "Down"
                      ? s.device === "vita"
                        ? 4
                        : 1
                      : -(s.device === "vita" ? 4 : 1);
            return {
              ...s,
              selection: (s.selection + step + names.length) % names.length,
            };
          }
          if (b === "A") return open(s, names[s.selection]);
          if (b === "R" || b === "L")
            return s.device === "3ds"
              ? open(s, "camera")
              : { ...s, page: b === "R" ? 1 : 0, selection: 0 };
        }
      }
      if (s.phase === "app") {
        const entries = activeSettings(s);
        if (entries.length) {
          if (b === "Down" || b === "Up")
            return {
              ...s,
              selection:
                (s.selection + (b === "Down" ? 1 : -1) + entries.length) %
                entries.length,
            };
          if (b === "A")
            return systemReducer(s, {
              type: "edit",
              key: entries[s.selection].key,
            });
        } else if (s.app === "settings") {
          const groups = settingGroupNames(s);
          if (b === "Down" || b === "Up")
            return {
              ...s,
              selection:
                (s.selection + (b === "Down" ? 1 : -1) + groups.length) %
                groups.length,
            };
          if (b === "A")
            return { ...s, section: groups[s.selection], selection: 0 };
        }
      }
      return s;
    }
  }
}
