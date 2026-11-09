/** Modelled UI glyphs, drawn as vectors so no firmware icon images or manufacturer marks are bundled. */
export function NativeAppIcon({
  name,
  size = 32,
}: {
  name: string;
  size?: number;
}) {
  let art: React.ReactNode;
  switch (name) {
    case "health":
      art = (
        <>
          <path
            d="M32 7 L60 55 Q61 58 57 58 H7 Q3 58 5 54 L29 8 Q31 4 32 7"
            fill="#f8d22c"
            stroke="#fff"
            strokeWidth="3"
          />
          <path d="M29 24 H35 L34 42 H30Z" fill="#273441" />
          <circle cx="32" cy="49" r="3" fill="#273441" />
        </>
      );
      break;
    case "camera":
      art = (
        <>
          <path d="M10 21 H22 L26 14 H40 L44 21 H54 V51 H10Z" fill="white" />
          <circle cx="33" cy="35" r="12" fill="currentColor" />
          <circle cx="33" cy="35" r="8" fill="white" />
          <rect x="46" y="25" width="5" height="4" rx="1" fill="currentColor" />
        </>
      );
      break;
    case "sound":
      art = (
        <>
          <path
            d="M25 14 V43 Q21 40 16 43 Q8 48 14 53 Q23 59 30 49 V24 L48 19 V37 Q41 36 37 41 Q31 48 38 51 Q47 54 53 44 V8Z"
            fill="white"
          />
        </>
      );
      break;
    case "mii":
      art = (
        <>
          <g fill="white">
            <path d="M8 24 H14 L20 36 L26 24 H32 V48 H26 V33 L21 43 H18 L14 33 V48 H8Z" />
            <rect x="37" y="30" width="6" height="18" rx="1" />
            <rect x="49" y="30" width="6" height="18" rx="1" />
            <circle cx="40" cy="23" r="3.5" />
            <circle cx="52" cy="23" r="3.5" />
          </g>
        </>
      );
      break;
    case "card":
      art = (
        <>
          <rect
            x="11"
            y="10"
            width="43"
            height="45"
            rx="4"
            fill="#cbd0d3"
            stroke="#fff"
            strokeWidth="3"
          />
          <rect x="17" y="15" width="30" height="26" rx="2" fill="#f5f6f4" />
          <path d="M19 48 H45" stroke="#a8afb3" strokeWidth="4" />
        </>
      );
      break;
    case "settings":
      art = (
        <>
          <path
            d="M49 7 Q39 4 34 12 Q29 20 34 27 L12 49 Q8 54 13 58 Q17 61 21 56 L43 33 Q53 37 59 27 Q62 22 59 16 L48 24 L41 20 L40 14Z"
            fill="white"
          />
          <circle cx="16" cy="54" r="2" fill="currentColor" />
        </>
      );
      break;
    case "ar":
      art = (
        <>
          <rect x="11" y="9" width="43" height="47" rx="4" fill="#fff" />
          <rect x="16" y="14" width="33" height="37" rx="2" fill="#e0ba31" />
          <text
            x="32"
            y="43"
            textAnchor="middle"
            fontFamily="Arial"
            fontWeight="bold"
            fontSize="36"
            fill="#fff"
          >
            ?
          </text>
        </>
      );
      break;
    case "people":
      art = (
        <>
          <path
            d="M13 48 Q12 35 23 34 Q34 34 34 48Z M31 50 Q31 33 43 33 Q55 33 56 50Z"
            fill="white"
          />
          <circle cx="23" cy="24" r="8" fill="white" />
          <circle cx="43" cy="22" r="9" fill="white" />
        </>
      );
      break;
    case "chart":
      art = (
        <>
          <path d="M11 12 V53 H56" stroke="white" strokeWidth="4" fill="none" />
          <path
            d="M19 43 V33 H26 V43Z M32 43 V24 H39 V43Z M45 43 V16 H52 V43Z"
            fill="white"
          />
        </>
      );
      break;
    case "download":
      art = (
        <>
          <rect x="11" y="10" width="41" height="19" rx="3" fill="white" />
          <rect x="11" y="36" width="41" height="19" rx="3" fill="white" />
          <path
            d="M31 17 V45 M24 37 L31 45 L38 37"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
        </>
      );
      break;
    default:
      return null;
  }
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className="native-app-glyph"
    >
      {art}
    </svg>
  );
}
