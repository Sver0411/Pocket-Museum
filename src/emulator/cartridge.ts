import type { GameSystem } from "./systems";
const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.slice(start, start + length))
    .replace(/\0.*$/, "")
    .trim();
/** Header metadata only. ROM bytes and the SHA-256 save identity remain untouched. */
export function cartridgeTitle(
  bytes: Uint8Array,
  system: GameSystem,
): string | undefined {
  if (system === "gba" || system === "nds") {
    const code = ascii(bytes, system === "gba" ? 0xac : 0x0c, 4);
    if (!/^[A-Z0-9]{4}$/.test(code)) return;
    const titles: Record<string, string> =
      system === "gba"
        ? {
            AXV: "红宝石",
            AXP: "蓝宝石",
            BPE: "绿宝石",
            BPR: "火红",
            BPG: "叶绿",
          }
        : {
            ADA: "钻石",
            APA: "珍珠",
            CPU: "白金",
            IPK: "心金",
            IPG: "魂银",
            IRB: "黑",
            IRA: "白",
            IRE: "黑 2",
            IRD: "白 2",
          };
    const title = titles[code.slice(0, 3)];
    return title ? `宝可梦 ${title}` : undefined;
  }
  const header = ascii(bytes, 0x134, 15);
  const titles: Record<string, string> = {
    "POKEMON RED": "红",
    "POKEMON BLUE": "蓝",
    "POKEMON GREEN": "绿",
    "POKEMON YELLOW": "皮卡丘",
    "POKEMON GLD": "金",
    "POKEMON SLV": "银",
    PM_CRYSTAL: "水晶",
  };
  const entry = Object.entries(titles).find(([prefix]) =>
    header.startsWith(prefix),
  );
  return entry ? `宝可梦 ${entry[1]}` : undefined;
}
