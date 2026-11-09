import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronLeft,
  Hand,
  Mic,
  Move,
  Play,
  Shapes,
} from "lucide-react";
import { AppChrome, CameraPanel, Recorder } from "./NativeApps";
import type { AppProps } from "./NativeApps";
import { useMedia, useBlobUrl } from "./media";
const choices = [
  ["digits", "Digit Chase", Hand],
  ["puzzle", "Snap + Slide", Shapes],
  ["skate", "Skate Axis", Move],
  ["sound", "Sound Loop", Mic],
  ["face", "Hello Face", Camera],
] as const;
function shuffled(size: number) {
  return Array.from({ length: size }, (_, i) => i + 1).sort(
    () => Math.random() - 0.5,
  );
}
function DigitChase({ onComplete }: { onComplete: () => void }) {
  const [numbers, setNumbers] = useState(() => shuffled(16)),
    [next, setNext] = useState(1),
    [seconds, setSeconds] = useState(0),
    [started, setStarted] = useState(false);
  const start = useRef(0);
  useEffect(() => {
    if (!started || next > 16) return;
    const t = setInterval(
      () => setSeconds((performance.now() - start.current) / 1000),
      50,
    );
    return () => clearInterval(t);
  }, [started, next]);
  return (
    <div className="digit-chase">
      <div className="park-score">
        {seconds.toFixed(2)} sec　{next > 16 ? "Complete!" : `Touch ${next}`}
      </div>
      <div>
        {numbers.map((n) => (
          <button
            key={n}
            className={n < next ? "cleared" : ""}
            disabled={n < next || next > 16}
            onClick={() => {
              if (n !== next) return;
              if (!started) {
                setStarted(true);
                start.current = performance.now();
              }
              if (next === 16) onComplete();
              setNext((v) => v + 1);
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          setNumbers(shuffled(16));
          setStarted(false);
          setNext(1);
          setSeconds(0);
        }}
      >
        Retry
      </button>
    </div>
  );
}
function Puzzle({
  device,
  onComplete,
}: {
  device: string;
  onComplete: () => void;
}) {
  const { items } = useMedia(device, "image");
  const [image, setImage] = useState(0),
    [tiles, setTiles] = useState<number[]>(
      Array.from({ length: 16 }, (_, i) => i),
    ),
    [moves, setMoves] = useState(0);
  const url = useBlobUrl(items[image]?.blob);
  const move = (index: number) => {
    const empty = tiles.indexOf(15);
    if (
      Math.abs((index % 4) - (empty % 4)) +
        Math.abs(Math.floor(index / 4) - Math.floor(empty / 4)) !==
      1
    )
      return;
    const t = [...tiles];
    [t[index], t[empty]] = [t[empty], t[index]];
    setTiles(t);
    setMoves((m) => m + 1);
    if (t.every((v, i) => v === i)) onComplete();
  };
  const shuffle = () => {
    const t = Array.from({ length: 16 }, (_, i) => i);
    let blank = 15;
    for (let n = 0; n < 100; n++) {
      const possible = [
          blank - 4,
          blank + 4,
          blank % 4 ? blank - 1 : -1,
          blank % 4 < 3 ? blank + 1 : -1,
        ].filter((v) => v >= 0 && v < 16),
        from = possible[Math.floor(Math.random() * possible.length)];
      [t[blank], t[from]] = [t[from], t[blank]];
      blank = from;
    }
    setTiles(t);
    setMoves(0);
  };
  return (
    <div className="snap-puzzle">
      <div className="park-score">Moves　{moves}</div>
      <div className="puzzle-grid">
        {tiles.map((n, i) => (
          <button
            aria-label={`Puzzle tile ${n + 1}`}
            className={n === 15 ? "empty" : ""}
            key={i}
            onClick={() => move(i)}
            style={
              url
                ? {
                    backgroundImage: `url(${url})`,
                    backgroundSize: "400% 400%",
                    backgroundPosition: `${((n % 4) / 3) * 100}% ${(Math.floor(n / 4) / 3) * 100}%`,
                  }
                : undefined
            }
          >
            {!url && n !== 15 ? n + 1 : ""}
          </button>
        ))}
      </div>
      <div className="app-actions">
        <button onClick={shuffle}>Shuffle</button>
        <button
          disabled={!items.length}
          onClick={() => setImage((n) => (n + 1) % items.length)}
        >
          Photo
        </button>
      </div>
    </div>
  );
}
function Skate({ onComplete }: { onComplete: () => void }) {
  const [running, setRunning] = useState(false),
    [time, setTime] = useState(0),
    [position, setPosition] = useState(50),
    [score, setScore] = useState(0);
  const pos = useRef(position),
    last = useRef(0),
    raf = useRef(0);
  pos.current = position;
  useEffect(() => {
    const suspend = () => setRunning(false);
    window.addEventListener("pocketsp:system-suspend", suspend);
    return () => window.removeEventListener("pocketsp:system-suspend", suspend);
  }, []);
  useEffect(() => {
    if (!running) return;
    let elapsed = 0;
    last.current = performance.now();
    const frame = (now: number) => {
      elapsed += (now - last.current) / 1000;
      last.current = now;
      setTime(elapsed);
      const y = (elapsed * 55) % 300,
        x = 15 + ((Math.floor((elapsed * 55) / 300) * 37) % 70);
      if (y > 250 && y < 280 && Math.abs(pos.current - x) < 9) {
        setRunning(false);
        return;
      }
      const points = Math.floor(elapsed * 20);
      setScore(points);
      if (points >= 500) {
        onComplete();
        setRunning(false);
        return;
      }
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf.current);
  }, [running]);
  return (
    <div className="skate-axis">
      <div className="park-score">{score} points</div>
      <svg
        viewBox="0 0 100 300"
        preserveAspectRatio="none"
        onPointerMove={(e) => {
          if (e.buttons) {
            const r = e.currentTarget.getBoundingClientRect();
            setPosition(
              Math.max(8, Math.min(92, ((e.clientX - r.x) / r.width) * 100)),
            );
          }
        }}
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      >
        <path
          d="M25 0 L0 300 M75 0 L100 300"
          fill="none"
          stroke="#bdc6ca"
          strokeWidth="1"
        />
        <circle
          cx={15 + ((Math.floor((time * 55) / 300) * 37) % 70)}
          cy={(time * 55) % 300}
          r="7"
          fill="#e2ba34"
        />
        <g transform={`translate(${position} 264)`}>
          <ellipse cx="0" cy="15" rx="9" ry="3" fill="#63a6d3" />
          <circle cy="-9" r="5" fill="#e0b295" />
          <path
            d="M0 -4 V8 L-5 13 M0 8 L5 13 M0 1 L-7 5 M0 1 L7 5"
            stroke="#45526a"
            strokeWidth="3"
            fill="none"
          />
        </g>
      </svg>
      <input
        aria-label="Skate steering"
        type="range"
        min="8"
        max="92"
        value={position}
        onChange={(e) => setPosition(+e.target.value)}
      />
      <button
        onClick={() => {
          setTime(0);
          setScore(0);
          setRunning((v) => !v);
        }}
      >
        {running ? "Stop" : "Start"}
      </button>
    </div>
  );
}
function LoopBall({
  blob,
  name,
  volume,
}: {
  blob: Blob;
  name: string;
  volume: number;
}) {
  const url = useBlobUrl(blob),
    audio = useRef<HTMLAudioElement>(null),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);
  return (
    <button
      className={`loop-ball ${playing ? "playing" : ""}`}
      onClick={() => {
        if (playing) {
          audio.current?.pause();
          setPlaying(false);
        } else void audio.current?.play().then(() => setPlaying(true));
      }}
    >
      <Mic />
      <span>{name}</span>
      <audio ref={audio} src={url} loop onPause={() => setPlaying(false)} />
    </button>
  );
}
export function WelcomePark(props: AppProps) {
  const [mode, setMode] = useState("menu"),
    { items } = useMedia(props.s.device, "audio");
  const complete = (id: string) =>
    props.dispatch({ type: "set", key: `park:${id}`, value: "complete" });
  return (
    <AppChrome props={props} title="Welcome Park" theme="welcome-park">
      {mode === "menu" ? (
        <div className="park-map">
          {choices.map(([id, name, Icon], i) => (
            <button
              style={
                {
                  "--park-colour": [
                    "#e8b72c",
                    "#64bd72",
                    "#4b9dd2",
                    "#e58c44",
                    "#d25c86",
                  ][i],
                } as React.CSSProperties
              }
              key={id}
              onClick={() => setMode(id)}
            >
              <Icon />
              <span>{name}</span>
              {props.s.prefs[`park:${id}`] && <b>✓</b>}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="park-heading">
            <button onClick={() => setMode("menu")}>
              <ChevronLeft />
              Welcome Park
            </button>
            <h3>{choices.find((x) => x[0] === mode)?.[1]}</h3>
          </div>
          {mode === "digits" ? (
            <DigitChase onComplete={() => complete("digits")} />
          ) : mode === "puzzle" ? (
            <Puzzle
              device={props.s.device}
              onComplete={() => complete("puzzle")}
            />
          ) : mode === "skate" ? (
            <Skate onComplete={() => complete("skate")} />
          ) : mode === "sound" ? (
            <div className="sound-loop">
              <Recorder {...props} />
              <div>
                {items.map((item) => (
                  <LoopBall
                    key={item.id}
                    blob={item.blob}
                    name={item.name}
                    volume={props.volume ?? 0.6}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="hello-face">
              <p>Point the camera at a face.</p>
              <CameraPanel {...props} />
            </div>
          )}
        </>
      )}
    </AppChrome>
  );
}
