import { useCallback, useEffect, useRef, useState } from "react";
import type { InkStroke } from "./InkPad";
export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  drawing: InkStroke[];
  time: number;
}
interface Peer {
  id: string;
  room: string;
  name: string;
  time: number;
}
interface Packet {
  channel: "pocketsp-chat-v1";
  type: "hello" | "message" | "leave";
  peer: Peer;
  message?: ChatMessage;
}
export function useLocalChat(
  room: string,
  name: string,
  onMessage: (message: ChatMessage) => void,
) {
  const channel = useRef<BroadcastChannel | null>(null),
    id = useRef(crypto.randomUUID()),
    receive = useRef(onMessage);
  receive.current = onMessage;
  const [peers, setPeers] = useState<Peer[]>([]);
  useEffect(() => {
    setPeers([]);
    if (!room || typeof BroadcastChannel === "undefined") return;
    const c = new BroadcastChannel("pocketsp-pictochat-v1");
    channel.current = c;
    const self = () => ({ id: id.current, room, name, time: Date.now() });
    const publish = () =>
      c.postMessage({
        channel: "pocketsp-chat-v1",
        type: "hello",
        peer: self(),
      } satisfies Packet);
    c.onmessage = ({ data: p }: { data: Packet }) => {
      if (
        p?.channel !== "pocketsp-chat-v1" ||
        !p.peer ||
        p.peer.id === id.current
      )
        return;
      if (p.peer.room !== room || p.type === "leave") {
        setPeers((list) => list.filter((x) => x.id !== p.peer.id));
        return;
      }
      if (typeof p.peer.name !== "string" || typeof p.peer.id !== "string")
        return;
      setPeers((list) =>
        [
          ...list.filter((x) => x.id !== p.peer.id),
          { ...p.peer, time: Date.now() },
        ].slice(0, 15),
      );
      if (
        p.type === "message" &&
        p.message &&
        typeof p.message.text === "string" &&
        Array.isArray(p.message.drawing)
      )
        receive.current(p.message);
    };
    publish();
    const timer = setInterval(() => {
      publish();
      setPeers((list) => list.filter((x) => Date.now() - x.time < 6500));
    }, 2000);
    return () => {
      clearInterval(timer);
      c.postMessage({
        channel: "pocketsp-chat-v1",
        type: "leave",
        peer: self(),
      } satisfies Packet);
      c.close();
      channel.current = null;
    };
  }, [room, name]);
  const send = useCallback(
    (message: ChatMessage) =>
      channel.current?.postMessage({
        channel: "pocketsp-chat-v1",
        type: "message",
        peer: { id: id.current, room, name, time: Date.now() },
        message,
      } satisfies Packet),
    [room, name],
  );
  return { peers, send };
}
