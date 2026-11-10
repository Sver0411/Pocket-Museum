import { useId } from "react";

/** Vector constructions from the cited official menu frames (not firmware image files).
 * They are tracked as reconstructions, not as pixel-identical original assets.
 * See THREEDS_VISUAL_SPEC and VITA_VISUAL_SPEC for the reference frames.
 */
export function ThreeApplet({
  name,
  size = 28,
}: {
  name: string;
  size?: number;
}) {
  const color =
    (
      {
        notes: "#b6d830",
        friends: "#e2a13d",
        notifications: "#57cd59",
        browser: "#34bfce",
        home: "#83a8ab",
      } as Record<string, string>
    )[name] ?? "#bdcccf";
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      className="three-reference-glyph"
    >
      <g stroke={color} strokeWidth="3" strokeLinejoin="round" fill="#fffff4">
        {name === "browser" ? (
          <>
            <circle cx="24" cy="24" r="19" />
            <ellipse cx="24" cy="24" rx="9" ry="19" />
            <path d="M6 18H42M6 30H42M24 5V43" fill="none" />
          </>
        ) : name === "notifications" ? (
          <>
            <path d="M8 7H39Q43 7 43 12V33Q43 37 39 37H22L14 44V37H8Q4 37 4 33V12Q4 7 8 7Z" />
            <path d="M11 16H36M11 23H36M11 30H32" fill="none" strokeWidth="2" />
          </>
        ) : name === "friends" ? (
          <>
            <rect x="7" y="7" width="34" height="34" rx="4" />
            <path d="M15 27Q24 40 33 27" fill="none" />
            <path d="M16 16V22M32 16V22" strokeWidth="4" />
          </>
        ) : name === "notes" ? (
          <g transform="rotate(40 24 24)">
            <rect x="10" y="5" width="27" height="38" rx="2" />
            <path d="M15 12H27M15 19H25M15 26H22" fill="none" strokeWidth="2" />
            <path d="M29 13L33 13V35L31 40L29 35Z" fill={color} />
          </g>
        ) : (
          <path d="M3 23L24 4L45 23H38V43H11V23Z M20 43V29H29V43" />
        )}
      </g>
    </svg>
  );
}

export function VitaGlyph({
  name,
  size = 108,
}: {
  name: string;
  size?: number;
}) {
  const id = useId().replaceAll(":", "");
  const colors: Record<string, [string, string]> = {
    welcome: ["#fff9e2", "#e5e8e9"],
    store: ["#20b6e8", "#0076b0"],
    browser: ["#42d8ec", "#0392c7"],
    trophies: ["#fff03b", "#e2a90b"],
    friends: ["#1276dc", "#16418a"],
    messages: ["#ae49de", "#641ca1"],
    party: ["#ee2b36", "#be0615"],
    settings: ["#8cba20", "#547611"],
    music: ["#ffad18", "#e17c00"],
    videos: ["#5f9fe6", "#225ca1"],
    photos: ["#b6dc3f", "#65a331"],
    content: ["#4bbfe6", "#2686bb"],
    remote: ["#569ae5", "#1e4b9b"],
    near: ["#8cbb31", "#4a8c13"],
  };
  const [a, b] = colors[name] ?? colors.content;
  let shape;
  if (name === "welcome")
    shape = (
      <>
        <text x="26" y="32" fill="#e89e16" fontSize="24" fontFamily="Arial">
          1²3
        </text>
        <path
          d="M38 86C29 82 23 68 25 65Q28 60 33 69L37 73V45Q40 39 44 45V64L45 37Q49 33 52 39V63L55 42Q59 38 62 44V66L65 51Q69 47 72 53V78Q70 92 58 95H46Z"
          fill="#e7931b"
        />
      </>
    );
  else if (name === "browser")
    shape = (
      <>
        <g stroke="#d5ffff" strokeWidth="2" fill="none" opacity=".75">
          <circle cx="54" cy="54" r="42" />
          <ellipse cx="54" cy="54" rx="21" ry="42" />
          <path d="M13 40H95M13 68H95M54 12V96" />
        </g>
        <text
          x="13"
          y="66"
          fill="white"
          fontFamily="Arial"
          fontSize="26"
          fontWeight="bold"
        >
          WWW
        </text>
      </>
    );
  else if (name === "store")
    shape = (
      <>
        <path d="M24 34L84 34L91 90H17Z" fill="#e1f7ff" />
        <path
          d="M39 35V25Q54 7 69 25V35"
          fill="none"
          stroke="white"
          strokeWidth="6"
        />
        <g stroke="#1085bf" strokeWidth="3" fill="none">
          <path d="M30 56L39 44L48 56Z M57 44H69V56H57Z M29 72L40 83M40 72L29 83" />
          <circle cx="66" cy="77" r="8" />
        </g>
      </>
    );
  else if (name === "party")
    shape = (
      <>
        <path
          d="M22 65V45C22 5 87 5 87 45V65"
          fill="none"
          stroke="#fff5ec"
          strokeWidth="11"
        />
        <rect x="16" y="46" width="19" height="33" rx="9" fill="white" />
        <rect x="74" y="46" width="19" height="33" rx="9" fill="white" />
        <path
          d="M83 75Q80 91 59 91"
          stroke="white"
          strokeWidth="5"
          fill="none"
        />
        <rect x="48" y="85" width="17" height="10" rx="5" fill="white" />
      </>
    );
  else if (name === "messages")
    shape = (
      <>
        <path
          d="M16 26H65Q73 26 73 34V59Q73 67 65 67H42L29 81V67H16Q9 67 9 59V34Q9 26 16 26Z"
          fill="#f8f7fd"
        />
        <path
          d="M49 45H89Q97 45 97 52V75Q97 82 89 82H79L87 94L66 82H49Q42 82 42 75V52Q42 45 49 45Z"
          fill="#d9d1f1"
        />
        <path d="M20 40H60M20 49H51" stroke="#b98ad0" strokeWidth="3" />
      </>
    );
  else if (name === "friends")
    shape = (
      <>
        <path d="M9 92V76Q9 60 28 60Q47 60 47 76V92Z" fill="#fbcd21" />
        <ellipse cx="28" cy="41" rx="17" ry="21" fill="#fbcd21" />
        <path d="M61 92V76Q61 60 80 60Q99 60 99 76V92Z" fill="#f6f1e7" />
        <ellipse cx="80" cy="41" rx="17" ry="21" fill="#f6f1e7" />
        <path
          d="M19 46Q28 55 37 46M71 46Q80 55 89 46"
          stroke="#2867a8"
          strokeWidth="3"
          fill="none"
        />
      </>
    );
  else if (name === "settings")
    shape = (
      <>
        <path d="M20 44H88V87H20Z" fill="#eef6ce" />
        <path
          d="M39 44V31Q54 22 69 31V44"
          fill="none"
          stroke="#eef6ce"
          strokeWidth="8"
        />
        <path d="M20 58H88" stroke="#60840e" strokeWidth="5" />
        <path d="M37 50V66M72 50V66" stroke="#60840e" strokeWidth="8" />
      </>
    );
  else if (name === "music")
    shape = (
      <>
        <path
          d="M45 28V77Q31 70 25 80Q17 94 36 96Q51 96 55 82V48L83 39V66Q66 62 63 76Q63 88 79 85Q93 82 93 70V16Z"
          fill="#fff9e6"
        />
      </>
    );
  else if (name === "videos")
    shape = (
      <>
        <path d="M13 30L91 12L97 36L19 54Z" fill="#fafbfe" />
        <path d="M20 49H95V93H20Z" fill="#f6faff" />
        <path
          d="M23 27L35 24L46 39L34 42M51 20L63 17L74 32L62 35M22 58H93"
          stroke="#3472b6"
          strokeWidth="6"
        />
      </>
    );
  else if (name === "photos")
    shape = (
      <>
        <g fill="#f0f8db">
          <ellipse cx="54" cy="34" rx="16" ry="27" />
          <ellipse cx="54" cy="74" rx="16" ry="27" />
          <ellipse cx="34" cy="54" rx="27" ry="16" />
          <ellipse cx="74" cy="54" rx="27" ry="16" />
        </g>
        <circle cx="54" cy="54" r="14" fill="#fbda28" />
      </>
    );
  else if (name === "trophies")
    shape = (
      <>
        <path
          d="M34 25H75V47Q74 66 57 70V81H76V92H31V81H50V70Q34 65 34 47Z"
          fill="#665510"
        />
        <path
          d="M34 33H17Q14 60 39 61M75 33H92Q94 60 70 61"
          fill="none"
          stroke="#665510"
          strokeWidth="8"
        />
      </>
    );
  else if (name === "remote")
    shape = (
      <>
        <path
          d="M24 41Q14 40 11 62L8 85Q12 96 25 80L38 69H72L87 83Q100 95 101 81L96 55Q92 39 80 41Z"
          fill="#172231"
          stroke="#c6def3"
          strokeWidth="2"
        />
        <path d="M25 48V68M15 58H35" stroke="#c1d3df" strokeWidth="5" />
        <circle cx="79" cy="53" r="4" fill="#e96378" />
        <circle cx="89" cy="63" r="4" fill="#75afba" />
      </>
    );
  else
    shape = (
      <>
        <rect x="15" y="27" width="43" height="54" rx="5" fill="#f4fbff" />
        <rect x="51" y="44" width="43" height="48" rx="5" fill="#c3e5f6" />
        <path
          d="M33 20H80L70 10M80 20L70 30M74 92H27L37 103M27 92L37 82"
          stroke="white"
          strokeWidth="5"
          fill="none"
        />
      </>
    );
  return (
    <svg
      viewBox="0 0 108 108"
      width={size}
      height={size}
      aria-hidden="true"
      className="vita-reference-glyph"
    >
      <defs>
        <radialGradient id={id} cx=".35" cy=".2" r=".95">
          <stop stopColor={a} />
          <stop offset="1" stopColor={b} />
        </radialGradient>
      </defs>
      <circle cx="54" cy="54" r="53" fill={`url(#${id})`} />
      {shape}
    </svg>
  );
}
