import { useEffect, useRef, useState } from "react";

const QUOTE = "“人类看到效果，AI 读到意图。”";

export function TypewriterQuote() {
  const rootRef = useRef<HTMLQuoteElement>(null);
  const [started, setStarted] = useState(false);
  const [length, setLength] = useState(0);
  const [phase, setPhase] = useState<"typing" | "deleting" | "waiting">("typing");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLength(QUOTE.length);
      return;
    }

    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    let delay = 72;
    let next = () => setLength((current) => current + 1);
    if (phase === "typing" && length >= QUOTE.length) {
      delay = 3_000;
      next = () => setPhase("deleting");
    } else if (phase === "deleting" && length > 0) {
      delay = 42;
      next = () => setLength((current) => current - 1);
    } else if (phase === "deleting") {
      delay = 0;
      next = () => setPhase("waiting");
    } else if (phase === "waiting") {
      delay = 1_000;
      next = () => setPhase("typing");
    } else if (phase === "typing" && length === 0) {
      delay = 180;
    }

    const timer = window.setTimeout(next, delay);
    return () => window.clearTimeout(timer);
  }, [length, phase, started]);

  return (
    <blockquote ref={rootRef} aria-label={QUOTE}>
      <span aria-hidden="true">{QUOTE.slice(0, length)}</span>
      <i className="typewriter-cursor" aria-hidden="true" />
    </blockquote>
  );
}
