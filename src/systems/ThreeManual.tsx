import { useEffect, useRef } from "react";
import type { Dispatch } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { APPS_3DS } from "./model";
import type { NativeAction, NativeState } from "./model";
import type { AppButtonEvent } from "./useAppButtons";
import { manualTopics } from "./threeManualContent";

export function ThreeManual({
  manual,
  top,
  selection,
  dispatch,
}: {
  manual: NonNullable<NativeState["threeManual"]>;
  top: boolean;
  selection: number;
  dispatch: Dispatch<NativeAction>;
}) {
  const { app, topic, large } = manual;
  const title = APPS_3DS.find((item) => item.id === app)?.name;
  const topics = manualTopics[app];
  const page = topics[topic];
  const content = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (page && content.current) content.current.scrollTop = 0;
  }, [page]);
  useEffect(() => {
    if (!page) content.current?.querySelector(".current")?.scrollIntoView({ block: "nearest" });
  }, [selection, page]);
  useEffect(() => {
    if (top || !page) return;
    const handle = (event: Event) => {
      const { device, button } = (event as AppButtonEvent).detail;
      if (device !== "3ds" || (button !== "Up" && button !== "Down")) return;
      content.current?.scrollBy({ top: button === "Down" ? 32 : -32 });
      event.preventDefault();
    };
    window.addEventListener("pocketsp:app-button", handle);
    return () => window.removeEventListener("pocketsp:app-button", handle);
  }, [top, page]);
  const turn = (index: number) => dispatch({ type: "manual-topic", index });
  if (top) return (
    <div className="three-manual-top">
      <BookOpen size={66} strokeWidth={1.3} />
      <h2>{title}</h2>
      <p>Electronic Manual</p>
    </div>
  );
  return (
    <section className={`three-manual ${large ? "large" : ""}`} aria-label={`${title} electronic manual`}>
      <header>{page ? page.title : "Contents"}</header>
      <div
        className="three-manual-content"
        ref={content}
        onPointerDown={(event) => {
          touch.current = page ? { x: event.clientX, y: event.clientY } : null;
        }}
        onPointerCancel={() => { touch.current = null; }}
        onPointerUp={(event) => {
          if (!touch.current) return;
          const { x, y } = touch.current;
          touch.current = null;
          const dx = event.clientX - x;
          if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(event.clientY - y))
            turn(topic + (dx < 0 ? 1 : -1));
        }}
      >
        {page ? (
          <article>{page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>
        ) : (
          <>
            <button type="button" className={selection === 0 ? "current" : ""} onClick={() => turn(0)}>
              <i>!</i> {topics[0].title}
            </button>
            <div className="three-manual-group">Basic Information</div>
            {topics.slice(1).map((entry, index) => (
              <button type="button" key={entry.title} className={selection === index + 1 ? "current" : ""} onClick={() => turn(index + 1)}>
                <i>{index + 1}</i> {entry.title}
              </button>
            ))}
          </>
        )}
      </div>
      {page && <nav className="three-manual-pages" aria-label="Manual pages">
        <button type="button" aria-label="Previous topic" disabled={topic === 0} onClick={() => turn(topic - 1)}><ChevronLeft size={16} /></button>
        <span>{topic + 1} / {topics.length}</span>
        <button type="button" aria-label="Next topic" disabled={topic + 1 === topics.length} onClick={() => turn(topic + 1)}><ChevronRight size={16} /></button>
      </nav>}
      <footer>
        <button type="button" onClick={() => dispatch({ type: "back" })}>Ⓑ {page ? "Back" : "Close"}</button>
        {page ? <button type="button" onClick={() => dispatch({ type: "manual-size" })}>Ⓨ {large ? "Reduce" : "Enlarge"}</button> : <span>English</span>}
      </footer>
    </section>
  );
}
