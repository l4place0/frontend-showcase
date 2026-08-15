import { useLayoutEffect, useRef } from "react";

export function useSlidingIndicator<T extends HTMLElement>(dependency: unknown) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    const update = () => {
      const active = container.querySelector<HTMLElement>(".active");
      if (!active) {
        container.style.setProperty("--indicator-opacity", "0");
        return;
      }
      container.style.setProperty("--indicator-x", `${active.offsetLeft}px`);
      container.style.setProperty("--indicator-width", `${active.offsetWidth}px`);
      container.style.setProperty("--indicator-opacity", "1");
    };

    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(container);
    container.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener("scroll", update);
    };
  }, [dependency]);

  return ref;
}
