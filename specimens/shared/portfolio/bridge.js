/* Specimen Protocol v1 bridge. This file is inlined into every built item. */
(() => {
  const PROTOCOL_VERSION = 1;
  const contextNode = document.getElementById("specimen-context");
  const context = contextNode ? JSON.parse(contextNode.textContent || "{}") : {};
  const controls = new Map((context.controls || []).map((control) => [control.key, control]));
  let port = null;
  let paused = false;

  const transformValue = (value, transform) => {
    const number = Number(value);
    if (transform === "px") return `${number}px`;
    if (transform === "deg") return `${number}deg`;
    if (transform === "seconds") return `${number}s`;
    if (transform === "percent-scale") return String(number / 100);
    if (transform === "share-ratio") return String(number / (100 - number));
    return String(value);
  };

  const defaultValues = () => Object.fromEntries(
    [...controls.values()].map((control) => [control.key, control.default]),
  );

  const applyControls = (values = {}) => {
    for (const [key, value] of Object.entries(values)) {
      const control = controls.get(key);
      if (!control?.target) continue;
      if (control.target.kind === "css-variable") {
        document.documentElement.style.setProperty(
          control.target.name,
          transformValue(value, control.target.transform),
        );
      } else if (control.target.kind === "data-attribute") {
        document.documentElement.setAttribute(control.target.name, String(value));
      }
    }
    document.documentElement.dataset.specimenControls = JSON.stringify(values);
  };

  const send = (type, detail = {}) => {
    port?.postMessage({ type, protocolVersion: PROTOCOL_VERSION, specimenId: context.id, ...detail });
  };

  const setPaused = (next) => {
    paused = next;
    document.documentElement.dataset.specimenPaused = String(paused);
    document.documentElement.style.setProperty("--specimen-play-state", paused ? "paused" : "running");
    send(paused ? "specimen:paused" : "specimen:resumed");
  };

  const onMessage = (event) => {
    const message = event.data || {};
    switch (message.type) {
      case "specimen:set-controls":
        applyControls(message.values);
        send("specimen:controls-applied", { values: message.values });
        break;
      case "specimen:reset":
        applyControls(defaultValues());
        send("specimen:controls-applied", { values: defaultValues() });
        break;
      case "specimen:pause":
        setPaused(true);
        break;
      case "specimen:resume":
        setPaused(false);
        break;
      case "specimen:visibility":
        setPaused(message.visible === false);
        break;
    }
  };

  window.addEventListener("message", (event) => {
    if (event.data?.type !== "specimen:init" || !event.ports?.[0]) return;
    if (event.data.protocolVersion !== PROTOCOL_VERSION) {
      event.ports[0].postMessage({ type: "specimen:error", code: "UNSUPPORTED_PROTOCOL", protocolVersion: PROTOCOL_VERSION });
      return;
    }
    port?.close();
    port = event.ports[0];
    port.onmessage = onMessage;
    port.start?.();
    applyControls({ ...defaultValues(), ...(event.data.controls || {}) });
    document.documentElement.dataset.specimenReady = "true";
    send("specimen:ready", { capabilities: ["controls", "lifecycle"] });
  });

  document.addEventListener("visibilitychange", () => setPaused(document.hidden));
  applyControls(defaultValues());
  document.documentElement.dataset.specimenStandalone = "true";
})();
