import type { DeviceId } from "../devices";
/** Code-native outer shells: no printed manufacturer marks or grain overlay. */
export function LidCover({
  device,
  flat = false,
}: {
  device: DeviceId;
  flat?: boolean;
}) {
  const teal = device === "3ds",
    white = device === "ds";
  const id = `shell-${device}`;
  const taper = flat ? 0 : device === "sp" ? 59 : device === "ds" ? 43 : 50;
  const shell = (inset: number) =>
    `M${taper + inset + 24} ${inset + 4} H${1000 - taper - inset - 24} Q${1000 - taper - inset} ${inset + 4} ${1000 - taper - inset + 3} ${inset + 27} L${1000 - inset - 3} ${623 - inset} Q${1000 - inset} ${646 - inset} ${973 - inset} ${646 - inset} H${27 + inset} Q${inset} ${646 - inset} ${inset + 3} ${623 - inset} L${taper + inset - 3} ${inset + 27} Q${taper + inset} ${inset + 4} ${taper + inset + 24} ${inset + 4}Z`;
  return (
    <svg
      viewBox="0 0 1000 650"
      preserveAspectRatio="none"
      className={`outer-cover outer-${device}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor={teal ? "#95e4e8" : white ? "#fff" : "#eef0f1"} />
          <stop
            offset=".2"
            stopColor={teal ? "#137e89" : white ? "#e1e0df" : "#85888e"}
          />
          <stop
            offset=".55"
            stopColor={teal ? "#2cb6c0" : white ? "#fbfbfa" : "#d6d8dc"}
          />
          <stop
            offset="1"
            stopColor={teal ? "#075263" : white ? "#b5b5b6" : "#72777d"}
          />
        </linearGradient>
        <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={teal ? "#208b97" : white ? "#f5f5f2" : "#b3b6bc"} />
          <stop
            offset=".24"
            stopColor={teal ? "#33acb8" : white ? "#fff" : "#e1e2e5"}
          />
          <stop
            offset=".63"
            stopColor={teal ? "#137984" : white ? "#f6f5f3" : "#bfc2c9"}
          />
          <stop
            offset="1"
            stopColor={teal ? "#0d616c" : white ? "#dfdedc" : "#9a9ea6"}
          />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffffff75" />
          <stop offset=".3" stopColor="#ffffff08" />
          <stop offset="1" stopColor="#0000000a" />
        </linearGradient>
      </defs>
      <path d={shell(0)} fill={`url(#${id}-rim)`} />
      <path
        d={shell(7)}
        fill={`url(#${id}-paint)`}
        stroke={teal ? "#3aafba" : "#f6f6f6"}
        strokeWidth="2"
      />
      <path d={shell(10)} fill={`url(#${id}-shine)`} />
      <path
        d={`M${taper + 30} 16 H${970 - taper}`}
        fill="none"
        stroke="#ffffff77"
        strokeWidth="2"
      />
      {white && (
        <g fill="none" stroke="#b3b4b3" strokeWidth="3.5" opacity=".65">
          <rect x="431" y="242" width="138" height="69" rx="9" />
          <rect x="431" y="325" width="138" height="69" rx="9" />
        </g>
      )}
      {teal && (
        <g>
          {[425, 575].map((x) => (
            <g key={x}>
              <ellipse
                cx={x}
                cy="56"
                rx="21"
                ry="18"
                fill="#083b45"
                stroke="#41b9c0"
                strokeWidth="3"
              />
              <ellipse cx={x} cy="56" rx="11" ry="10" fill="#08191e" />
              <ellipse
                cx={x - 3}
                cy="52"
                rx="4"
                ry="3"
                fill="#8ac6d1"
                opacity=".55"
              />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
