import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Specimen } from "../../app/types";
import { itemAsset, itemRoot, publicUrl } from "../../app/urls";

interface Props {
  item: Specimen;
  values: Record<string, unknown>;
  onReset: () => void;
}

type ViewerStatus = "loading" | "ready" | "error";

function entryUrl(item: Specimen): string {
  if (!item.entry || item.entry === "index.html") return itemRoot(item.id, item.url);
  if (item.entry.startsWith("items/") || item.entry.startsWith("/items/")) return publicUrl(item.entry);
  return itemAsset(item, item.entry);
}

function sandbox(runtime: Specimen["runtime"]): string {
  const permissions = new Set<string>();
  if (runtime?.scripts === true) permissions.add("allow-scripts");
  if (runtime?.forms) permissions.add("allow-forms");
  if (runtime?.downloads) permissions.add("allow-downloads");
  if (runtime?.pointerLock) permissions.add("allow-pointer-lock");
  return [...permissions].join(" ");
}

export function SpecimenViewer({ item, values, onReset }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const portRef = useRef<MessagePort | null>(null);
  const handshakeTimerRef = useRef<number | null>(null);
  const [reload, setReload] = useState(0);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [message, setMessage] = useState("正在载入独立展品…");
  const src = useMemo(() => entryUrl(item), [item]);

  const send = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    portRef.current?.postMessage({ type, ...payload });
  }, []);

  const connect = useCallback(() => {
    if (handshakeTimerRef.current !== null) window.clearTimeout(handshakeTimerRef.current);
    portRef.current?.close();
    portRef.current = null;
    setStatus("loading");
    setMessage("正在与展品建立连接…");
    const target = frameRef.current?.contentWindow;
    if (!target) return;
    const channel = new MessageChannel();
    portRef.current = channel.port1;
    channel.port1.onmessage = (event: MessageEvent<{ type?: string; message?: string }>) => {
      if (event.data?.type === "specimen:ready") {
        if (handshakeTimerRef.current !== null) window.clearTimeout(handshakeTimerRef.current);
        handshakeTimerRef.current = null;
        setStatus("ready");
        setMessage("展品已就绪");
        send("specimen:set-controls", { values });
      } else if (event.data?.type === "specimen:error") {
        if (handshakeTimerRef.current !== null) window.clearTimeout(handshakeTimerRef.current);
        handshakeTimerRef.current = null;
        setStatus("error");
        setMessage(event.data.message || "展品报告了运行错误");
      } else if (event.data?.type === "specimen:request-fullscreen" && item.runtime?.fullscreen === true) {
        frameRef.current?.requestFullscreen().catch(() => undefined);
      }
    };
    channel.port1.start();
    target.postMessage({ type: "specimen:init", protocolVersion: 1, controls: values }, "*", [channel.port2]);
    handshakeTimerRef.current = window.setTimeout(() => {
      setStatus("error");
      setMessage("展品未响应 Specimen Protocol 握手");
      channel.port1.close();
      if (portRef.current === channel.port1) portRef.current = null;
    }, 5000);
  }, [send, values]);

  useEffect(() => {
    if (status === "ready") send("specimen:set-controls", { values });
  }, [send, status, values]);

  useEffect(() => {
    const onVisibility = () => send(document.hidden ? "specimen:pause" : "specimen:resume");
    document.addEventListener("visibilitychange", onVisibility);
    const observer = new IntersectionObserver(([entry]) => send(entry.isIntersecting ? "specimen:resume" : "specimen:pause"), { threshold: 0.05 });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      if (handshakeTimerRef.current !== null) window.clearTimeout(handshakeTimerRef.current);
      portRef.current?.close();
    };
  }, [send, item.id, reload]);

  const fullscreen = () => containerRef.current?.requestFullscreen().catch(() => undefined);
  const reset = () => { onReset(); send("specimen:reset"); };

  return (
    <section className="viewer" ref={containerRef} data-testid="specimen-viewer" aria-label={`${item.id} 展品播放器`}>
      <div className="viewer-toolbar">
        <div className={`viewer-status status-${status}`} role="status"><i />{message}</div>
        <div className="viewer-actions">
          <button type="button" onClick={reset}>重置</button>
          <button type="button" onClick={() => setReload((value) => value + 1)}>刷新</button>
          <button type="button" onClick={fullscreen}>全屏</button>
        </div>
      </div>
      <div className="frame-wrap">
        <iframe
          key={`${item.id}-${reload}`}
          ref={frameRef}
          data-testid="specimen-frame"
          src={src}
          title={typeof item.title === "string" ? item.title : item.title.zh || item.title.en || item.id}
          sandbox={sandbox(item.runtime)}
          allow={item.runtime?.fullscreen ? "fullscreen" : undefined}
          allowFullScreen={item.runtime?.fullscreen}
          onLoad={connect}
          onError={() => { setStatus("error"); setMessage("展品文档载入失败"); }}
        />
      </div>
    </section>
  );
}
