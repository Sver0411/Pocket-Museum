import type { DeviceId } from "../devices";

/** Original vector scenery. The handheld remains the interactive foreground. */
export function ThemeBackdrop({ device }: { device: DeviceId | "museum" }) {
  const pixels = ["gb", "gba", "sp"].includes(device);
  const portable = device === "psp" || device === "vita";
  return (
    <div
      className={`theme-backdrop ${pixels ? "pixel-scene" : ""} ${portable ? "wave-scene" : ""}`}
      aria-hidden="true"
    >
      <div className="scene-light" />
      {device === "gba" && (
        <svg
          className="scene-y2k"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          stroke="currentColor"
        >
          <ellipse
            cx="800"
            cy="500"
            rx="650"
            ry="330"
            transform="rotate(-16 800 500)"
          />
          <ellipse
            cx="800"
            cy="500"
            rx="730"
            ry="370"
            transform="rotate(-16 800 500)"
          />
          <path d="M120 500h30m-15-15v30M1450 720h30m-15-15v30" />
        </svg>
      )}
      {device === "ds" && (
        <div className="scene-ds-panels">
          <i />
          <i />
        </div>
      )}
      {device === "3ds" && (
        <svg className="scene-home-tiles" viewBox="0 0 1600 1000" fill="none">
          <rect x="60" y="160" width="100" height="100" rx="26" />
          <rect x="1330" y="730" width="140" height="140" rx="36" />
          <rect x="1310" y="190" width="65" height="65" rx="17" />
          <rect x="120" y="780" width="55" height="55" rx="14" />
        </svg>
      )}
      {device === "vita" && (
        <div className="scene-vita-bubbles">
          <i />
          <i />
          <i />
        </div>
      )}
      <svg
        className="scene-curves"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
      >
        <path
          className="scene-curve-back"
          d="M-100 935C170 724 262 1040 560 948S970 806 1210 896S1530 1050 1710 704V1100H-100Z"
        />
        <path
          className="scene-curve-front"
          d="M-80 1020C190 816 350 1070 666 1005S1080 1080 1350 913S1580 852 1700 790V1100H-80Z"
        />
        <path
          className="scene-ribbon"
          d="M850-80C1060 150 1210-105 1690 178L1660 225C1230-58 1055 180 805-80Z"
        />
      </svg>
      {pixels ? (
        <svg
          className="scene-pixels"
          viewBox="0 0 1600 200"
          preserveAspectRatio="xMidYMax meet"
        >
          <g className="pixel-hills">
            <path d="M0 160H28V130H55V102H82V75H110V102H138V130H165V146H194V160H340V190H0ZM1310 172H1340V145H1370V116H1400V87H1430V116H1460V145H1490V160H1600V190H1310Z" />
            <path d="M0 190H450V197H0ZM1160 190H1600V197H1160Z" />
          </g>
          <g className="pixel-clouds" fill="none" strokeWidth="5">
            <path d="M88 55H65V40H77V27H90V16H116V27H129V40H143V55ZM1414 36H1388V22H1401V9H1427V22H1453V36Z" />
            <path d="M293 115H352V155H293ZM322 115V155M293 135H352" />
          </g>
        </svg>
      ) : portable ? (
        <svg
          className="scene-symbols"
          viewBox="0 0 240 60"
          fill="none"
          strokeWidth="4"
        >
          <path d="M15 48L36 10L57 48Z" />
          <circle cx="96" cy="30" r="20" />
          <path d="M137 12L174 49M174 12L137 49" />
          <rect x="199" y="12" width="37" height="37" rx="2" />
        </svg>
      ) : device === "museum" ? (
        <svg className="scene-leaves" viewBox="0 0 260 330">
          <g fill="currentColor">
            <path
              d="M10 0C90 60 126 118 143 260"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
            <ellipse
              cx="40"
              cy="55"
              rx="20"
              ry="45"
              transform="rotate(-38 40 55)"
            />
            <ellipse
              cx="90"
              cy="75"
              rx="20"
              ry="45"
              transform="rotate(42 90 75)"
            />
            <ellipse
              cx="88"
              cy="143"
              rx="20"
              ry="45"
              transform="rotate(-44 88 143)"
            />
            <ellipse
              cx="132"
              cy="173"
              rx="20"
              ry="45"
              transform="rotate(42 132 173)"
            />
            <ellipse
              cx="130"
              cy="240"
              rx="17"
              ry="39"
              transform="rotate(-40 130 240)"
            />
          </g>
        </svg>
      ) : (
        <svg
          className="scene-star"
          viewBox="0 0 100 100"
          fill="none"
          strokeWidth="4"
        >
          <path d="M50 7L63 34L93 38L71 59L76 90L50 76L23 90L28 59L7 38L37 34Z" />
        </svg>
      )}
    </div>
  );
}
