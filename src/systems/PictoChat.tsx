import { useEffect, useRef, useState } from "react";
import type { Dispatch } from "react";
import type { NativeAction, NativeState } from "./model";
import type { ChatMessage, useLocalChat } from "./wireless";
import { InkPad } from "./InkPad";
import type { InkStroke } from "./InkPad";
export type LocalChat = ReturnType<typeof useLocalChat>;
export function PictoChat({
  s,
  dispatch,
  top,
  chat,
}: {
  s: NativeState;
  dispatch: Dispatch<NativeAction>;
  top: boolean;
  chat?: LocalChat;
}) {
  const [text, setText] = useState(""),
    [drawing, setDrawing] = useState<InkStroke[]>([]),
    [shift, setShift] = useState(true),
    [numbers, setNumbers] = useState(false),
    [eraser, setEraser] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [s.messages]);
  const send = () => {
    if (!text.trim() && !drawing.length) return;
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sender: s.prefs.nickname || "Player",
      text: text.slice(0, 80),
      drawing,
      time: Date.now(),
    };
    dispatch({ type: "receive-chat", message });
    chat?.send(message);
    setText("");
    setDrawing([]);
  };
  if (top)
    return (
      <div className="picto-top" ref={log}>
        <header>PictoChat　{s.room ? `CHAT ROOM ${s.room}` : ""}</header>
        {s.messages.map((m) => (
          <article className="picto-message" key={m.id}>
            <b>{m.sender}</b>
            {m.text && <p>{m.text}</p>}
            {m.drawing.length > 0 && (
              <svg viewBox="0 0 256 110" preserveAspectRatio="none">
                {m.drawing.map((p, i) => (
                  <path
                    key={i}
                    d={p.d}
                    stroke={p.color}
                    strokeWidth={p.width}
                    strokeLinecap="round"
                    fill="none"
                  />
                ))}
              </svg>
            )}
          </article>
        ))}
      </div>
    );
  if (!s.room)
    return (
      <div className="picto-rooms">
        <h3>PictoChat</h3>
        {["A", "B", "C", "D"].map((r) => (
          <button key={r} onClick={() => dispatch({ type: "room", name: r })}>
            CHAT ROOM {r}
            <span>0 / 16</span>
          </button>
        ))}
        <button onClick={() => dispatch({ type: "back" })}>Exit</button>
      </div>
    );
  const keys = numbers
    ? "1234567890!?.,:;+-*/()@#%&"
    : "QWERTYUIOPASDFGHJKLZXCVBNM";
  return (
    <div className="picto-bottom">
      <header>
        CHAT ROOM {s.room}　{1 + (chat?.peers.length || 0)}/16
      </header>
      <div className="picto-composer">
        <InkPad strokes={drawing} onChange={setDrawing} eraser={eraser} />
        <div>
          <button
            aria-label="Pen"
            className={!eraser ? "chosen" : ""}
            onClick={() => setEraser(false)}
          >
            ✎
          </button>
          <button
            aria-label="Eraser"
            className={eraser ? "chosen" : ""}
            onClick={() => setEraser(true)}
          >
            ▱
          </button>
          <button
            aria-label="Undo stroke"
            onClick={() => setDrawing((v) => v.slice(0, -1))}
          >
            ↶
          </button>
        </div>
      </div>
      <input
        aria-label="PictoChat message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={80}
      />
      <div className="picto-keyboard">
        {keys.split("").map((c) => (
          <button
            key={c}
            onClick={() =>
              setText((v) => (v + (shift ? c : c.toLowerCase())).slice(0, 80))
            }
          >
            {shift ? c : c.toLowerCase()}
          </button>
        ))}
        <button onClick={() => setShift((v) => !v)}>⇧</button>
        <button onClick={() => setNumbers((v) => !v)}>
          {numbers ? "ABC" : "123"}
        </button>
        <button
          className="space-key"
          onClick={() => setText((v) => (v + " ").slice(0, 80))}
        >
          Space
        </button>
        <button
          aria-label="Backspace"
          onClick={() => setText((v) => v.slice(0, -1))}
        >
          ⌫
        </button>
      </div>
      <footer>
        <button
          onClick={() => {
            setText("");
            setDrawing([]);
          }}
        >
          Clear
        </button>
        <button onClick={send}>Send</button>
        <button onClick={() => dispatch({ type: "room", name: "" })}>
          Exit
        </button>
      </footer>
    </div>
  );
}
