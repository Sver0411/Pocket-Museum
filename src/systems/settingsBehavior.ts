import type { NativeState, Setting } from "./model";
export function clockDate(prefs: Record<string, string>, now = Date.now()) {
  const offset = Number(prefs.clockOffset || 0);
  const zone = prefs.timezone?.match(/GMT([+-])(\d{2}):(\d{2})/);
  const zoneMinutes = zone
    ? (Number(zone[2]) * 60 + Number(zone[3])) * (zone[1] === "-" ? -1 : 1)
    : -new Date(now).getTimezoneOffset();
  const dst = prefs.dst === "Daylight Saving" ? 60 : 0;
  return new Date(
    now +
      offset +
      (zoneMinutes + dst + new Date(now).getTimezoneOffset()) * 60000,
  );
}
const pad = (n: number) => String(n).padStart(2, "0");
export function inputKind(s: NativeState, item: Setting) {
  if (item.key === "date") return s.device === "ds" ? "date" : "datetime-local";
  if (item.key === "time" || item.key === "alarm-time") return "time";
  if (item.key === "birthday") return "date";
  if (item.key === "password" || item.key === "pin") return "password";
  if (["nickname", "name", "message", "owner", "greeting"].includes(item.key))
    return "text";
  return "options";
}
export function editValue(s: NativeState, item: Setting, now = Date.now()) {
  const d = clockDate(s.prefs, now),
    date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const kind = inputKind(s, item);
  if (item.key === "date") return kind === "date" ? date : `${date}T${time}`;
  if (item.key === "time") return time;
  if (item.key === "birthday") return s.prefs.birthday || "2000-01-01";
  if (item.key === "alarm-time") return s.prefs["alarm-time"] || "07:00";
  return s.prefs[item.key] ?? item.values[0];
}
export function commitPreference(
  s: NativeState,
  now = Date.now(),
): NativeState {
  if (!s.editor) return s;
  const prefs = { ...s.prefs };
  const key = s.editor,
    value = s.draft.trim();
  if ((key === "password" || key === "pin") && !/^\d{4}$/.test(value))
    return { ...s, dialog: "Enter a four-digit PIN." };
  if ((key === "nickname" || key === "name") && !value)
    return { ...s, dialog: "Enter a name." };
  if (key === "date" || key === "time") {
    const current = clockDate(prefs, now),
      target = new Date(current);
    if (key === "time") {
      if (!/^\d{2}:\d{2}$/.test(value))
        return { ...s, dialog: "Enter a valid time." };
      const [h, m] = value.split(":").map(Number);
      if (h > 23 || m > 59) return { ...s, dialog: "Enter a valid time." };
      target.setHours(h, m, 0, 0);
    } else {
      const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
      if (!m) return { ...s, dialog: "Enter a valid date." };
      const y = +m[1],
        month = +m[2],
        day = +m[3];
      if (
        y < 2000 ||
        y > 2099 ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > new Date(y, month, 0).getDate()
      )
        return { ...s, dialog: "Enter a valid date." };
      target.setFullYear(y, month - 1, day);
      if (m[4]) target.setHours(+m[4], +m[5], 0, 0);
    }
    prefs.clockOffset = String(
      Number(prefs.clockOffset || 0) + target.getTime() - current.getTime(),
    );
  }
  prefs[key] = value;
  return { ...s, prefs, editor: "", draft: "" };
}
export function displayedTime(date: Date, prefs: Record<string, string>) {
  let h = date.getHours(),
    suffix = "";
  if (prefs.timeformat === "12-Hour Clock") {
    suffix = h >= 12 ? " PM" : " AM";
    h = h % 12 || 12;
  }
  return `${pad(h)}:${pad(date.getMinutes())}${suffix}`;
}
export function displayedDate(date: Date, prefs: Record<string, string>) {
  const y = date.getFullYear(),
    m = pad(date.getMonth() + 1),
    d = pad(date.getDate());
  return prefs.dateformat === "DD/MM/YYYY"
    ? `${d}/${m}/${y}`
    : prefs.dateformat === "MM/DD/YYYY"
      ? `${m}/${d}/${y}`
      : `${y}/${m}/${d}`;
}
