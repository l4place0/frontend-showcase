(() => {
  const root = document.documentElement;
  const modeToggle = document.querySelector(".mode-switch");
  const motionToggle = document.querySelector(".motion-switch");
  const motionLabel = document.querySelector(".motion-state-label");
  const machine = {
    idle: { toggle: "active", activate: "active" },
    active: { toggle: "idle", deactivate: "idle" },
  };
  const isNight = () => root.getAttribute("data-night-mode") === "true";
  const animationState = () => root.getAttribute("data-animation-state") === "active" ? "active" : "idle";
  const render = () => {
    const night = isNight();
    const active = animationState() === "active";
    modeToggle?.setAttribute("aria-pressed", String(night));
    modeToggle?.setAttribute("aria-label", night ? "关闭黑夜模式，切换到日间" : "开启黑夜模式，切换到夜间");
    motionToggle?.setAttribute("aria-pressed", String(active));
    motionToggle?.setAttribute("aria-label", active ? "切换到闲置动画状态" : "切换到激活动画状态");
    if (motionLabel) motionLabel.textContent = active ? "激活" : "闲置";
  };
  const send = (event) => {
    const state = animationState();
    const next = machine[state]?.[event];
    if (next) root.setAttribute("data-animation-state", next);
  };
  modeToggle?.addEventListener("click", () => root.setAttribute("data-night-mode", String(!isNight())));
  motionToggle?.addEventListener("click", () => send("toggle"));
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ["data-night-mode", "data-animation-state"] });
  render();
})();
