import * as THREE from "three";

const canvas = document.querySelector("#organism");
const progressLine = document.querySelector("#progress-line");
const progressNumber = document.querySelector("#progress-number");
const energyReadout = document.querySelector("#energy-readout");
const vitalCopy = document.querySelector("#vital-copy");
const cursorOrbit = document.querySelector("#cursor-orbit");
const soundButton = document.querySelector("#sound-toggle");
const spectrumButton = document.querySelector("#spectrum-toggle");
const spectrumState = document.querySelector("#spectrum-state");
const frequencyLow = document.querySelector("#frequency-low");
const frequencyMid = document.querySelector("#frequency-mid");
const frequencyHigh = document.querySelector("#frequency-high");
const frequencyMeterBars = [...document.querySelectorAll(".frequency-meter i")];
const impactInstruction = document.querySelector("#impact-instruction");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = { x: .5, y: .5, tx: .5, ty: .5, speed: 0 };
const audioBands = { low: 0, mid: 0, high: 0 };
const activeImpacts = [];
const impactWaveSpeed = 1.55;
const impactShellThickness = .022;
let renderer;
let material;
let scene;
let camera;
let particleGeometry;
let particlePositions;
let particleVelocities;
let particleAngles;
let particleRadii;
let particleSeeds;
let particleLayers;
let particleCount = 0;
let viewportAspect = 1;
let frame = 0;
let lastTime = performance.now();
let audio;
let controlSignature = "";
let impactEnergy = 0;

const vertexShader = `
  attribute float aSeed;
  attribute float aLayer;
  uniform float uPixelRatio;
  uniform float uAudioHigh;
  uniform float uScroll;
  varying float vSeed;
  varying float vLayer;
  void main() {
    vSeed=aSeed;
    vLayer=aLayer;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
    float baseSize=mix(1.35,2.75,aLayer);
    gl_PointSize=baseSize*uPixelRatio*(1.0+uAudioHigh+sin(aSeed*31.0+uScroll*8.0)*.12);
  }
`;

const fragmentShader = `
  precision highp float;
  varying float vSeed;
  varying float vLayer;
  uniform float uScroll;
  vec3 palette(float t){
    vec3 acid=vec3(.72,1.0,.24), cyan=vec3(.18,.93,.82), violet=vec3(.57,.31,1.0);
    return mix(mix(acid,cyan,smoothstep(0.0,.48,t)),violet,smoothstep(.45,1.0,t));
  }
  void main(){
    float distanceToCenter=length(gl_PointCoord-.5);
    if(distanceToCenter>.5) discard;
    float core=1.0-smoothstep(.08,.5,distanceToCenter);
    float halo=1.0-smoothstep(.22,.5,distanceToCenter);
    vec3 color=palette(fract(vSeed*.42+uScroll*.72));
    color=mix(color,vec3(.94,1.0,.78),vLayer*.42+core*.28);
    float alpha=(core*.82+halo*.34)*mix(.36,.94,vLayer);
    gl_FragColor=vec4(color*mix(.7,1.55,core),alpha);
  }
`;

function deterministicRandom(seed = 0x5f3759df) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function mix(from, to, amount) {
  return from + (to - from) * amount;
}

function cssNumber(name, fallback) {
  const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function scrollProgress() {
  const height = document.documentElement.scrollHeight - innerHeight;
  return height > 0 ? Math.min(1, Math.max(0, scrollY / height)) : 0;
}

function createOrganismParticles() {
  particleCount = navigator.webdriver ? 7200 : innerWidth <= 720 ? 9000 : 15000;
  particlePositions = new Float32Array(particleCount * 3);
  particleVelocities = new Float32Array(particleCount * 2);
  particleAngles = new Float32Array(particleCount);
  particleRadii = new Float32Array(particleCount);
  particleSeeds = new Float32Array(particleCount);
  particleLayers = new Float32Array(particleCount);
  const random = deterministicRandom();

  for (let index = 0; index < particleCount; index += 1) {
    const angle = random() * Math.PI * 2;
    const membrane = random() < .38;
    const radial = membrane ? .82 + random() * .18 : Math.sqrt(random()) * .91;
    const seed = random();
    particleAngles[index] = angle;
    particleRadii[index] = radial;
    particleSeeds[index] = seed;
    particleLayers[index] = membrane ? 1 : 0;
  }

  particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
  particleGeometry.setAttribute("aSeed", new THREE.BufferAttribute(particleSeeds, 1));
  particleGeometry.setAttribute("aLayer", new THREE.BufferAttribute(particleLayers, 1));
  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uPixelRatio: { value: renderer.getPixelRatio() },
      uAudioHigh: { value: 0 },
      uScroll: { value: 0 },
    },
  });
  scene.add(new THREE.Points(particleGeometry, material));
  updateParticlePhysics(0, 0, 1, .72, true);
  canvas.dataset.particleCount = String(particleCount);
}

function pointerWorld() {
  return {
    x: (pointer.x * 2 - 1) * viewportAspect,
    y: 1 - pointer.y * 2,
  };
}

function advanceImpactWaves(dt) {
  activeImpacts.forEach((impact) => {
    impact.previousRadius = impact.radius;
    impact.radius += impactWaveSpeed * dt;
  });
}

function collideParticleWithImpacts(index, positionOffset, velocityOffset, intensity) {
  let collided = false;
  const particleX = particlePositions[positionOffset];
  const particleY = particlePositions[positionOffset + 1];
  const collisionRadius = .006 + particleLayers[index] * .004;

  activeImpacts.forEach((impact) => {
    if (impact.hits[index]) return;
    const deltaX = particleX - impact.x;
    const deltaY = particleY - impact.y;
    const distance = Math.hypot(deltaX, deltaY);
    const sweptInner = Math.max(0, impact.previousRadius - impactShellThickness - collisionRadius);
    const sweptOuter = impact.radius + impactShellThickness + collisionRadius;
    if (distance < sweptInner || distance > sweptOuter) return;

    impact.hits[index] = 1;
    const directionX = distance > .0001 ? deltaX / distance : Math.cos(particleAngles[index]);
    const directionY = distance > .0001 ? deltaY / distance : Math.sin(particleAngles[index]);
    const travelFalloff = Math.max(.45, 1 - distance / impact.maxRadius * .48);
    const impulse = 1.34 * intensity * travelFalloff * (.82 + particleSeeds[index] * .36);
    particleVelocities[velocityOffset] += directionX * impulse;
    particleVelocities[velocityOffset + 1] += directionY * impulse;
    if (impact.scattered === 0) canvas.dataset.firstCollisionDelay = (performance.now() - impact.startedAt).toFixed(1);
    impact.scattered += 1;
    canvas.dataset.lastScattered = String(impact.scattered);
    collided = true;
  });

  return collided;
}

function retireImpactWaves() {
  for (let index = activeImpacts.length - 1; index >= 0; index -= 1) {
    if (activeImpacts[index].radius <= activeImpacts[index].maxRadius) continue;
    activeImpacts.splice(index, 1);
  }
  canvas.dataset.activeImpacts = String(activeImpacts.length);
}

function updateParticlePhysics(dt, elapsed, intensity, turbulence, initialize = false) {
  if (!particlePositions) return;
  const scroll = material.uniforms.uScroll.value;
  const age = scroll * 3;
  const lobes = 3 + Math.floor(age + .2) * 2;
  const cycle = Math.min(1, Math.max(0, (scroll - .2) / .6));
  const centerX = mix(.17, -.12, cycle);
  const centerY = mix(-.02, .03, cycle);
  const pointerPosition = pointerWorld();
  impactEnergy = Math.max(0, impactEnergy - dt * .78);
  const spring = 5.4 * intensity * (1 - impactEnergy * .82);
  const damping = Math.exp(-dt * mix(1.35, 2.45, 1 - impactEnergy));
  const audioLowGain = cssNumber("--organism-audio-low-gain", .075);
  const audioMidGain = cssNumber("--organism-audio-mid-gain", .5);
  const breath = 1 + Math.sin(elapsed * (.72 + audioBands.mid * audioMidGain)) * (.035 + audioBands.low * audioLowGain);
  canvas.dataset.audioLowGain = audioLowGain.toFixed(3);
  canvas.dataset.audioMidGain = audioMidGain.toFixed(3);
  let kinetic = 0;
  advanceImpactWaves(dt);

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const velocityOffset = index * 2;
    const baseAngle = particleAngles[index];
    const seed = particleSeeds[index];
    const layer = particleLayers[index];
    const organicDrift = Math.sin(elapsed * (.18 + seed * .17) + seed * 19) * .028 * turbulence;
    const angle = baseAngle + organicDrift + scroll * .08 * (seed - .5);
    const edge = .43
      + Math.sin(angle * lobes + elapsed * .23) * .061
      + Math.sin(angle * (lobes + 4) - elapsed * .17 + seed * 4) * .024 * turbulence;
    const radialPulse = 1 + Math.sin(elapsed * (1.05 + seed * .32) + seed * 12) * .018 * turbulence;
    const radius = edge * particleRadii[index] * breath * radialPulse;
    const targetX = centerX + Math.cos(angle) * radius * (1.04 + scroll * .08);
    const targetY = centerY + Math.sin(angle) * radius * (1 - scroll * .05);

    if (initialize) {
      particlePositions[offset] = targetX;
      particlePositions[offset + 1] = targetY;
      particlePositions[offset + 2] = (seed - .5) * .08;
      continue;
    }

    let velocityX = particleVelocities[velocityOffset];
    let velocityY = particleVelocities[velocityOffset + 1];
    particleVelocities[velocityOffset] = velocityX;
    particleVelocities[velocityOffset + 1] = velocityY;
    if (collideParticleWithImpacts(index, offset, velocityOffset, intensity)) impactEnergy = 1;
    velocityX = particleVelocities[velocityOffset];
    velocityY = particleVelocities[velocityOffset + 1];
    velocityX += (targetX - particlePositions[offset]) * spring * dt;
    velocityY += (targetY - particlePositions[offset + 1]) * spring * dt;

    const pointerDeltaX = pointerPosition.x - particlePositions[offset];
    const pointerDeltaY = pointerPosition.y - particlePositions[offset + 1];
    const pointerDistance = Math.hypot(pointerDeltaX, pointerDeltaY) + .0001;
    const pointerForce = Math.exp(-pointerDistance * 6.2) * (.3 + Math.min(pointer.speed, 1) * .75) * intensity;
    velocityX += pointerDeltaX / pointerDistance * pointerForce * dt;
    velocityY += pointerDeltaY / pointerDistance * pointerForce * dt;

    velocityX *= damping;
    velocityY *= damping;
    particleVelocities[velocityOffset] = velocityX;
    particleVelocities[velocityOffset + 1] = velocityY;
    particlePositions[offset] += velocityX * dt;
    particlePositions[offset + 1] += velocityY * dt;
    particlePositions[offset + 2] = (seed - .5) * .08 + Math.sin(elapsed + seed * 20) * .012 * layer;
    kinetic += velocityX * velocityX + velocityY * velocityY;
  }

  particleGeometry.attributes.position.needsUpdate = true;
  if (!initialize && Number(canvas.dataset.renderCount || 0) % 6 === 0) {
    canvas.dataset.particleKinetic = (kinetic / particleCount).toFixed(5);
  }
  retireImpactWaves();
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(navigator.webdriver ? .55 : Math.min(devicePixelRatio, 1.35));
  renderer.setClearColor(0x05070b, 0);
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .01, 10);
  camera.position.z = 2;
  resize();
  createOrganismParticles();

  const render = (now) => {
    frame = requestAnimationFrame(render);
    const paused = document.documentElement.dataset.specimenPaused === "true";
    const nextControlSignature = document.documentElement.dataset.specimenControls || "";
    if (nextControlSignature !== controlSignature) {
      controlSignature = nextControlSignature;
      material.userData.rendered = false;
    }
    if (paused || (reducedMotion && material.userData.rendered)) return;
    const dt = Math.min(.04, (now - lastTime) / 1000);
    lastTime = now;
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 7);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 7);
    pointer.speed *= .94;
    const scroll = scrollProgress();
    const intensity = cssNumber("--organism-intensity", 1);
    const turbulence = cssNumber("--organism-turbulence", .72);
    updateAudio(scroll, pointer.speed, dt);
    material.uniforms.uScroll.value = reducedMotion
      ? scroll
      : material.uniforms.uScroll.value + (scroll - material.uniforms.uScroll.value) * Math.min(1, dt * 3.5);
    const audioHighGain = cssNumber("--organism-audio-high-gain", .85);
    material.uniforms.uAudioHigh.value = audioBands.high * audioHighGain;
    canvas.dataset.audioHighGain = audioHighGain.toFixed(3);
    updateParticlePhysics(dt, now / 1000, intensity, turbulence);
    renderer.render(scene, camera);
    material.userData.rendered = true;
    canvas.dataset.renderCount = String((Number(canvas.dataset.renderCount) || 0) + 1);
  };
  frame = requestAnimationFrame(render);
}

function resize() {
  if (!renderer || !camera) return;
  viewportAspect = innerWidth / Math.max(1, innerHeight);
  camera.left = -viewportAspect;
  camera.right = viewportAspect;
  camera.top = 1;
  camera.bottom = -1;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
  if (material) material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
}

function updateInterface() {
  const progress = scrollProgress();
  progressLine.style.transform = `scaleY(${progress})`;
  const chapter = Math.min(3, Math.floor(progress * 3.35));
  progressNumber.textContent = String(chapter).padStart(2, "0");
  energyReadout.textContent = `${(38 + progress * 61).toFixed(1)}%`;
  vitalCopy.textContent = ["感知中", "连接中", "记忆中", "共生中"][chapter];
  document.body.dataset.chapter = String(chapter);
}

function initAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const analyser = context.createAnalyser();
  const low = context.createOscillator();
  const mid = context.createOscillator();
  const high = context.createOscillator();
  const lowGain = context.createGain();
  const midGain = context.createGain();
  const highGain = context.createGain();
  low.type = "sine"; mid.type = "sawtooth"; high.type = "triangle";
  low.frequency.value = 48; mid.frequency.value = 176; high.frequency.value = 620;
  master.gain.value = 0; lowGain.gain.value = .07; midGain.gain.value = .025; highGain.gain.value = .018;
  filter.type = "lowpass"; filter.frequency.value = 240; filter.Q.value = 4;
  analyser.fftSize = 256; analyser.smoothingTimeConstant = .72;
  low.connect(lowGain).connect(analyser); mid.connect(midGain).connect(analyser); high.connect(highGain).connect(analyser);
  analyser.connect(filter).connect(master).connect(context.destination);
  low.start(); mid.start(); high.start();
  audio = { context, master, filter, analyser, frequencyData: new Uint8Array(analyser.frequencyBinCount), low, mid, high, lowGain, midGain, highGain, mocking: false };
}

function setSound(enabled) {
  if (!audio) initAudio();
  if (!audio) return;
  audio.context.resume();
  audio.master.gain.cancelScheduledValues(audio.context.currentTime);
  audio.master.gain.linearRampToValueAtTime(enabled ? .075 : 0, audio.context.currentTime + .35);
  soundButton.setAttribute("aria-pressed", String(enabled));
  soundButton.setAttribute("aria-label", enabled ? "关闭环境声音" : "开启环境声音");
  soundButton.querySelector(".sound-label").textContent = enabled ? "声音开启" : "声音关闭";
}

function setMockSpectrum(enabled) {
  if (!audio) initAudio();
  if (!audio) return;
  audio.context.resume();
  audio.mocking = enabled;
  spectrumButton.setAttribute("aria-pressed", String(enabled));
  spectrumButton.setAttribute("aria-label", enabled ? "停止虚拟音频频谱" : "启动虚拟音频频谱");
  spectrumState.textContent = enabled ? "采样中" : "待机";
  canvas.dataset.spectrumActive = String(enabled);
  requestReducedFrame();
}

function averageFrequency(data, from, to) {
  let total = 0;
  for (let index = from; index < to; index += 1) total += data[index] || 0;
  return total / Math.max(1, to - from);
}

function updateAudio(scroll, speed, dt) {
  if (!audio) {
    audioBands.low *= .9; audioBands.mid *= .9; audioBands.high *= .9;
    return;
  }
  const t = audio.context.currentTime;
  audio.filter.frequency.setTargetAtTime(180 + scroll * 820 + Math.min(speed, 1) * 400, t, .18);
  audio.low.frequency.setTargetAtTime(43 + scroll * 19 + (audio.mocking ? Math.sin(t * 2.2) * 8 : 0), t, .08);
  audio.mid.frequency.setTargetAtTime(150 + scroll * 120 + (audio.mocking ? Math.sin(t * 3.7) * 46 : 0), t, .08);
  audio.high.frequency.setTargetAtTime(520 + scroll * 360 + (audio.mocking ? Math.sin(t * 6.1) * 150 : 0), t, .06);
  audio.high.detune.setTargetAtTime(Math.sin(t * .17) * 17, t, .3);
  audio.lowGain.gain.setTargetAtTime(.055 + (audio.mocking ? (.045 + .035 * Math.sin(t * 2.1)) : 0), t, .04);
  audio.midGain.gain.setTargetAtTime(.018 + (audio.mocking ? (.024 + .018 * Math.sin(t * 3.4 + 1.2)) : 0), t, .04);
  audio.highGain.gain.setTargetAtTime(.012 + (audio.mocking ? (.018 + .012 * Math.sin(t * 5.8 + 2.1)) : 0), t, .04);
  if (!audio.mocking) {
    const decay = Math.max(0, 1 - dt * 6);
    audioBands.low *= decay; audioBands.mid *= decay; audioBands.high *= decay;
  } else {
    audio.analyser.getByteFrequencyData(audio.frequencyData);
    const targetLow = Math.min(1, averageFrequency(audio.frequencyData, 0, 7) / 210) * (.58 + .42 * Math.max(0, Math.sin(t * 2.2)));
    const targetMid = Math.min(1, averageFrequency(audio.frequencyData, 7, 28) / 190) * (.52 + .48 * Math.max(0, Math.sin(t * 3.7 + 1.1)));
    const targetHigh = Math.min(1, averageFrequency(audio.frequencyData, 28, 72) / 165) * (.46 + .54 * Math.max(0, Math.sin(t * 6.1 + 2.4)));
    audioBands.low += (targetLow - audioBands.low) * .28;
    audioBands.mid += (targetMid - audioBands.mid) * .32;
    audioBands.high += (targetHigh - audioBands.high) * .38;
  }
  const values = [audioBands.low, audioBands.low, audioBands.mid, audioBands.mid, audioBands.mid, audioBands.high, audioBands.high, audioBands.high];
  frequencyMeterBars.forEach((bar, index) => bar.style.setProperty("--level", values[index].toFixed(3)));
  frequencyLow.textContent = String(Math.round(audioBands.low * 99)).padStart(2, "0");
  frequencyMid.textContent = String(Math.round(audioBands.mid * 99)).padStart(2, "0");
  frequencyHigh.textContent = String(Math.round(audioBands.high * 99)).padStart(2, "0");
  canvas.dataset.audioLow = audioBands.low.toFixed(3);
  canvas.dataset.audioMid = audioBands.mid.toFixed(3);
  canvas.dataset.audioHigh = audioBands.high.toFixed(3);
}

function emitImpact(clientX, clientY) {
  const normalizedX = clientX / innerWidth;
  const normalizedY = 1 - clientY / innerHeight;
  const impactX = (normalizedX * 2 - 1) * viewportAspect;
  const impactY = normalizedY * 2 - 1;
  const intensity = cssNumber("--organism-intensity", 1);
  const maxRadius = Math.hypot(viewportAspect * 2, 2);
  const impact = {
    x: impactX,
    y: impactY,
    radius: 0,
    previousRadius: 0,
    maxRadius,
    hits: new Uint8Array(particleCount),
    scattered: 0,
    startedAt: performance.now(),
  };

  if (reducedMotion) {
    for (let index = 0; index < particleCount; index += 1) {
      const positionOffset = index * 3;
      const deltaX = particlePositions[positionOffset] - impactX;
      const deltaY = particlePositions[positionOffset + 1] - impactY;
      const distance = Math.hypot(deltaX, deltaY);
      const directionX = distance > .0001 ? deltaX / distance : Math.cos(particleAngles[index]);
      const directionY = distance > .0001 ? deltaY / distance : Math.sin(particleAngles[index]);
      const staticDisplacement = .035 * Math.max(.45, 1 - distance / maxRadius * .48) * intensity;
      particlePositions[positionOffset] += directionX * staticDisplacement;
      particlePositions[positionOffset + 1] += directionY * staticDisplacement;
      impact.scattered += 1;
    }
    particleGeometry.attributes.position.needsUpdate = true;
  } else {
    activeImpacts.push(impact);
    if (activeImpacts.length > 3) activeImpacts.shift();
  }

  canvas.dataset.impactCount = String((Number(canvas.dataset.impactCount) || 0) + 1);
  canvas.dataset.lastImpact = `${normalizedX.toFixed(3)},${normalizedY.toFixed(3)}`;
  canvas.dataset.lastScattered = String(impact.scattered);
  canvas.dataset.firstCollisionDelay = reducedMotion ? "0.0" : "";
  canvas.dataset.collisionModel = "swept-disc-shell";
  canvas.dataset.activeImpacts = String(activeImpacts.length);
  impactInstruction.classList.add("is-used");
  const ring = document.createElement("i");
  ring.className = "impact-ring";
  ring.style.left = `${clientX}px`; ring.style.top = `${clientY}px`;
  ring.style.setProperty("--impact-size", `${maxRadius * innerHeight}px`);
  ring.style.setProperty("--impact-duration", `${maxRadius / impactWaveSpeed}s`);
  ring.addEventListener("animationend", () => ring.remove(), { once: true });
  document.body.append(ring);
  requestReducedFrame();
}

function requestReducedFrame() {
  if (material) material.userData.rendered = false;
}

addEventListener("resize", () => { resize(); requestReducedFrame(); });
addEventListener("scroll", () => { updateInterface(); requestReducedFrame(); }, { passive: true });
addEventListener("pointermove", (event) => {
  const nx = event.clientX / innerWidth;
  const ny = event.clientY / innerHeight;
  pointer.speed = Math.min(2, pointer.speed + Math.hypot(nx - pointer.tx, ny - pointer.ty) * 9);
  pointer.tx = nx; pointer.ty = ny;
  requestReducedFrame();
  cursorOrbit.style.transform = `translate3d(${event.clientX - 22}px,${event.clientY - 22}px,0)`;
}, { passive: true });
document.querySelectorAll("button,a").forEach((item) => {
  item.addEventListener("pointerenter", () => { document.body.dataset.hover = "true"; });
  item.addEventListener("pointerleave", () => { document.body.dataset.hover = "false"; });
});
soundButton.addEventListener("click", () => setSound(soundButton.getAttribute("aria-pressed") !== "true"));
spectrumButton.addEventListener("click", () => setMockSpectrum(spectrumButton.getAttribute("aria-pressed") !== "true"));
addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || event.target instanceof Element && event.target.closest("button,a")) return;
  emitImpact(event.clientX, event.clientY);
});
document.querySelector('[data-action="enter"]').addEventListener("click", () => document.querySelector('[data-chapter="1"]').scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" }));
document.querySelector('[data-action="reset"]').addEventListener("click", () => scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));

try {
  initRenderer();
} catch (error) {
  console.error("[symbiosis] WebGL initialization failed", error);
  document.querySelector("#webgl-fallback").hidden = false;
}
updateInterface();
addEventListener("beforeunload", () => { cancelAnimationFrame(frame); audio?.context.close(); });
