import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import artworkCatalog from "./assets/artworks.json";
import inlineArtworkImages from "virtual:artwork-images";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = { data: null, screen: "welcome", period: null, gallery: null, detailOpen: false, toastTimer: 0 };

function showScreen(name) {
  state.screen = name;
  $$(".screen").forEach((screen) => screen.classList.toggle("is-active", screen.dataset.screen === name));
  if (name === "timeline") {
    requestAnimationFrame(() => $(".timeline").classList.add("is-grown"));
    state.gallery?.pause();
  }
  if (name === "gallery") state.gallery?.resume();
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("is-visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => element.classList.remove("is-visible"), 2100);
}

function periodArtworks(periodId) {
  return state.data.artworks.filter((artwork) => artwork.periodId === periodId);
}

function buildTimeline() {
  const nodes = $("#period-nodes");
  const svg = $("#tree-lines");
  nodes.replaceChildren();
  const points = state.data.periods.map((period, index) => ({
    period,
    x: 10 + index * (80 / (state.data.periods.length - 1)),
    y: 52 + Math.sin(index * 1.43) * 22 + (index % 2 ? 4 : -2),
  }));
  const width = 1200;
  const height = 650;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const scaled = points.map((point) => ({ ...point, sx: point.x * width / 100, sy: point.y * height / 100 }));
  const trunk = scaled.slice(1).map((point, index) => {
    const before = scaled[index];
    const bend = (before.sx + point.sx) / 2;
    return `C ${bend} ${before.sy}, ${bend} ${point.sy}, ${point.sx} ${point.sy}`;
  }).join(" ");
  const paths = [`<path pathLength="1" d="M ${scaled[0].sx - 100} ${scaled[0].sy + 28} Q ${scaled[0].sx - 35} ${scaled[0].sy - 20} ${scaled[0].sx} ${scaled[0].sy} ${trunk}"/>`];
  scaled.forEach((point, index) => {
    const direction = index % 2 ? 1 : -1;
    paths.push(`<path pathLength="1" d="M ${point.sx} ${point.sy} q ${32 + index * 2} ${direction * 38} ${74} ${direction * 74}" style="transition-delay:${.35 + index * .08}s"/>`);
  });
  svg.innerHTML = paths.join("");

  points.forEach(({ period, x, y }, index) => {
    const button = document.createElement("button");
    button.className = "period-node";
    button.style.cssText = `left:${x}%;top:${y}%;--accent:${period.accent};--i:${index};--r:${index % 2 ? "2deg" : "-2deg"}`;
    button.innerHTML = `<small>0${index + 1} · ${period.en}</small><strong>${period.zh}</strong><span>${period.years}</span>`;
    button.setAttribute("aria-label", `${period.zh}，${period.years}，进入画廊`);
    button.addEventListener("mouseenter", () => showPeriodPreview(period, button));
    button.addEventListener("focus", () => showPeriodPreview(period, button));
    button.addEventListener("mouseleave", hidePeriodPreview);
    button.addEventListener("blur", hidePeriodPreview);
    button.addEventListener("click", () => enterGallery(period));
    nodes.append(button);
    const branch = document.createElement("span");
    branch.className = "artist-branch";
    branch.style.cssText = `left:${x + 2.4}%;top:${y + (index % 2 ? 10 : -14)}%;--i:${index}`;
    branch.textContent = period.artists.map((artist) => artist.zh).join(" · ");
    nodes.append(branch);
  });
}

function showPeriodPreview(period, anchor) {
  const preview = $("#period-preview");
  const artwork = periodArtworks(period.id)[0];
  $("#preview-image").src = artwork.image;
  $("#preview-image").alt = artwork.titleZh;
  $("#preview-count").textContent = `PERIOD 0${period.order} · ${period.en}`;
  $("#preview-title").textContent = period.zh;
  $("#preview-years").textContent = period.years;
  $("#preview-description").textContent = period.intro;
  $("#preview-artwork").textContent = `${artwork.titleZh} · ${artwork.date}`;
  const rect = anchor.getBoundingClientRect();
  const left = Math.min(innerWidth - Math.min(430, innerWidth - 32) - 16, Math.max(16, rect.left - 120));
  const top = rect.top > innerHeight * .55 ? rect.top - 214 : rect.bottom + 12;
  preview.style.left = `${left}px`;
  preview.style.top = `${Math.max(90, Math.min(innerHeight - 210, top))}px`;
  preview.classList.add("is-visible");
  preview.setAttribute("aria-hidden", "false");
}

function hidePeriodPreview() {
  $("#period-preview").classList.remove("is-visible");
  $("#period-preview").setAttribute("aria-hidden", "true");
}

async function enterGallery(period) {
  hidePeriodPreview();
  state.period = period;
  $("#gallery-index").textContent = String(period.order).padStart(2, "0");
  $("#gallery-period").textContent = period.zh;
  $("#gallery-years").textContent = period.years;
  showScreen("gallery");
  $("#loading-card").classList.remove("is-done");
  $("#loading-copy").textContent = `正在布展：${period.zh}`;
  try {
    if (!state.gallery) state.gallery = new GalleryApp($("#webgl-root"));
    await state.gallery.loadPeriod(period, periodArtworks(period.id));
    $("#loading-card").classList.add("is-done");
  } catch (error) {
    console.error("[time-gallery] WebGL initialization failed", error);
    $("#loading-card").classList.add("is-done");
    $("#webgl-fallback").hidden = false;
  }
}

function openDetail(artwork) {
  if (!artwork || state.detailOpen) return;
  state.detailOpen = true;
  const period = state.data.periods.find((item) => item.id === artwork.periodId);
  const sequence = periodArtworks(period.id).findIndex((item) => item.id === artwork.id) + 1;
  $("#detail-image").src = artwork.image;
  $("#detail-image").alt = `${artwork.titleZh}，${artwork.artistZh}`;
  $("#detail-sequence").textContent = `${period.en.toUpperCase()} · ${String(sequence).padStart(2, "0")} / 06`;
  $("#detail-period").textContent = `${period.zh} · ${period.en}`;
  $("#detail-title").textContent = artwork.titleZh;
  $("#detail-title-en").textContent = artwork.titleEn;
  $("#detail-artist").textContent = artwork.artistZh;
  $("#detail-artist-en").textContent = artwork.artistEn;
  $("#detail-life").textContent = artwork.lifespan;
  $("#detail-date").textContent = artwork.date;
  $("#detail-medium").textContent = artwork.medium;
  $("#detail-period-name").textContent = `${period.zh} / ${period.en}`;
  $("#detail-intro").textContent = period.intro;
  $("#detail-source").textContent = artwork.source;
  $("#detail-source").href = artwork.sourceUrl;
  $("#detail-license").textContent = artwork.license;
  $("#detail-accession").textContent = `${artwork.accessionNumber} · Commons 署名：${artwork.attribution || artwork.artistEn} · 图像已离线内置`;
  const detail = $("#art-detail");
  detail.classList.add("is-open");
  detail.setAttribute("aria-hidden", "false");
  document.exitPointerLock?.();
  setTimeout(() => $(".detail-close").focus(), 80);
}

function closeDetail() {
  if (!state.detailOpen) return;
  state.detailOpen = false;
  const detail = $("#art-detail");
  detail.classList.remove("is-open");
  detail.setAttribute("aria-hidden", "true");
}

function marbleTexture(seed = 1, size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#e9e2d3"); gradient.addColorStop(.48, "#cfc5b3"); gradient.addColorStop(1, "#f3eee2");
  context.fillStyle = gradient; context.fillRect(0, 0, size, size);
  let value = seed * 9973;
  const random = () => ((value = (value * 16807) % 2147483647) - 1) / 2147483646;
  for (let index = 0; index < 48; index += 1) {
    context.beginPath();
    const base = random() * size;
    context.moveTo(-20, base);
    for (let x = -20; x <= size + 20; x += 24) {
      const y = base + Math.sin(x * .018 + random() * 4) * (12 + random() * 35) + x * (random() - .5) * .28;
      context.lineTo(x, y);
    }
    context.strokeStyle = `rgba(${70 + random() * 40},${82 + random() * 35},${86 + random() * 35},${.025 + random() * .08})`;
    context.lineWidth = .5 + random() * 2.2; context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function fallbackArtworkTexture(artwork) {
  const canvas = document.createElement("canvas");
  canvas.width = 960; canvas.height = 720;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 960, 720);
  gradient.addColorStop(0, "#48647a"); gradient.addColorStop(1, "#c18a65");
  context.fillStyle = gradient; context.fillRect(0, 0, 960, 720);
  context.fillStyle = "rgba(255,255,255,.84)"; context.font = "800 42px sans-serif";
  context.fillText(artwork.titleZh.slice(0, 24), 70, 330);
  context.font = "600 23px sans-serif"; context.fillText(artwork.artistZh, 70, 380);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

class GalleryApp {
  constructor(root) {
    this.root = root;
    this.keys = new Set();
    this.frames = [];
    this.target = null;
    this.running = true;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.renderedReducedFrame = false;
    this.renderCount = 0;
    this.root.dataset.reducedMotion = String(this.reducedMotion);
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 7;
    this.yaw = 0;
    this.pitch = 0;
    this.dragging = false;
    this.dragMoved = false;
    this.dragPointerId = null;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7899b0);
    this.scene.fog = new THREE.FogExp2(0xb9ad96, .012);
    this.camera = new THREE.PerspectiveCamera(67, innerWidth / innerHeight, .08, 80);
    this.camera.position.set(0, 1.7, -6.2);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(navigator.webdriver ? .65 : Math.min(devicePixelRatio, 1.45));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.root.replaceChildren(this.renderer.domElement);
    this.buildArchitecture();
    this.buildPostProcessing();
    this.bindEvents();
    this.resize();
    this.animate();
  }

  buildPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.ssao = new SSAOPass(this.scene, this.camera, innerWidth, innerHeight, 16);
    this.ssao.kernelRadius = .34;
    this.ssao.minDistance = .001;
    this.ssao.maxDistance = .085;
    this.composer.addPass(this.ssao);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .26, .45, .89);
    this.composer.addPass(this.bloom);
  }

  buildArchitecture() {
    const marble = marbleTexture(4); marble.repeat.set(5, 2);
    const floorMarble = marbleTexture(9); floorMarble.repeat.set(7, 7);
    const stone = new THREE.MeshPhysicalMaterial({ map: marble, color: 0xe3dac9, roughness: .42, metalness: .02, clearcoat: .24, clearcoatRoughness: .55, side: THREE.BackSide });
    const trim = new THREE.MeshPhysicalMaterial({ color: 0xd1b991, roughness: .34, metalness: .08, clearcoat: .3 });
    const darkStone = new THREE.MeshPhysicalMaterial({ color: 0x6d746f, roughness: .5, metalness: .03 });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(13.7, 13.7, 6.2, 64, 1, true), stone);
    wall.position.y = 3.1; wall.receiveShadow = true; this.scene.add(wall);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(13.72, 64, 28, 0, Math.PI * 2, .25, Math.PI / 2 - .25), stone);
    dome.position.y = 6.1; dome.receiveShadow = true; this.scene.add(dome);
    const cornice = new THREE.Mesh(new THREE.TorusGeometry(13.46, .28, 10, 96), trim);
    cornice.rotation.x = Math.PI / 2; cornice.position.y = 6.1; cornice.castShadow = true; this.scene.add(cornice);
    for (let ring = 0; ring < 4; ring += 1) {
      const theta = .38 + ring * .23;
      const count = 10 + ring * 5;
      for (let index = 0; index < count; index += 1) {
        const phi = index / count * Math.PI * 2;
        const radius = 13.25;
        const coffer = new THREE.Mesh(new THREE.BoxGeometry(1.18 + ring * .18, .18, .84 + ring * .12), darkStone);
        coffer.position.set(Math.sin(theta) * Math.sin(phi) * radius, 6.1 + Math.cos(theta) * radius, Math.sin(theta) * Math.cos(phi) * radius);
        coffer.lookAt(0, 6.1, 0); coffer.castShadow = true; coffer.receiveShadow = true; this.scene.add(coffer);
      }
    }
    const sky = new THREE.Mesh(new THREE.SphereGeometry(48, 36, 20), new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { top: { value: new THREE.Color(0x4b86b2) }, bottom: { value: new THREE.Color(0xe7d9b9) } },
      vertexShader: "varying vec3 p; void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "varying vec3 p;uniform vec3 top;uniform vec3 bottom;void main(){float h=clamp(normalize(p).y*.5+.5,0.,1.);gl_FragColor=vec4(mix(bottom,top,pow(h,1.15)),1.);}",
    }));
    this.scene.add(sky);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), new THREE.MeshBasicMaterial({ color: 0xffe3a1 }));
    sun.position.set(-4, 23, -15); sun.lookAt(0, 2, 0); this.scene.add(sun);
    const reflectorScale = navigator.webdriver ? .45 : 1;
    const reflector = new Reflector(new THREE.CircleGeometry(12.95, 64), { textureWidth: Math.min(1600, innerWidth * devicePixelRatio * reflectorScale), textureHeight: Math.min(1200, innerHeight * devicePixelRatio * reflectorScale), color: 0x8f918c, clipBias: .003 });
    reflector.rotation.x = -Math.PI / 2; reflector.position.y = .005; this.scene.add(reflector);
    const floor = new THREE.Mesh(new THREE.RingGeometry(0, 13.1, 64), new THREE.MeshPhysicalMaterial({ map: floorMarble, color: 0xd4c8b2, roughness: .28, metalness: .12, transparent: true, opacity: .74, clearcoat: .55, clearcoatRoughness: .32 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = .014; floor.receiveShadow = true; this.scene.add(floor);
    for (let ring = 1; ring <= 3; ring += 1) {
      const inlay = new THREE.Mesh(new THREE.RingGeometry(ring * 3.1 - .035, ring * 3.1 + .035, 64), new THREE.MeshStandardMaterial({ color: 0x8f765e, roughness: .35, metalness: .12 }));
      inlay.rotation.x = -Math.PI / 2; inlay.position.y = .025; this.scene.add(inlay);
    }
    for (let index = 0; index < 12; index += 1) {
      const angle = index / 12 * Math.PI * 2;
      const pilaster = new THREE.Group();
      pilaster.position.set(Math.sin(angle) * 13.18, 0, Math.cos(angle) * 13.18);
      pilaster.lookAt(0, 0, 0);
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(.62, 5.25, .5), stone.clone());
      shaft.material.side = THREE.FrontSide; shaft.position.y = 2.8; shaft.castShadow = true; shaft.receiveShadow = true;
      const base = new THREE.Mesh(new THREE.BoxGeometry(.95, .35, .72), trim); base.position.y = .35;
      const cap = base.clone(); cap.position.y = 5.45;
      pilaster.add(shaft, base, cap); this.scene.add(pilaster);
    }
    this.bayGroups = [];
    for (let index = 0; index < 6; index += 1) {
      const angle = index / 6 * Math.PI * 2;
      const group = new THREE.Group();
      group.position.set(Math.sin(angle) * 12.9, 0, Math.cos(angle) * 12.9);
      group.lookAt(0, 0, 0);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(2.35, .16, 10, 38, Math.PI), trim);
      arch.position.y = 3.65; arch.castShadow = true;
      const left = new THREE.Mesh(new THREE.BoxGeometry(.32, 2.7, .28), trim); left.position.set(-2.35, 2.25, 0);
      const right = left.clone(); right.position.x = 2.35;
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.05, .16, .32), trim); lintel.position.y = 5.95;
      group.add(arch, left, right, lintel); this.scene.add(group); this.bayGroups.push(group);
      const spot = new THREE.SpotLight(0xffd7a2, 62, 10, .48, .62, 1.5);
      spot.position.set(Math.sin(angle) * 9.8, 6.6, Math.cos(angle) * 9.8);
      spot.target.position.set(Math.sin(angle) * 12.7, 2.8, Math.cos(angle) * 12.7);
      spot.castShadow = index % 2 === 0; spot.shadow.mapSize.set(512, 512);
      this.scene.add(spot, spot.target);
    }
    const hemi = new THREE.HemisphereLight(0xb7ddff, 0x7b654b, 2.7); this.scene.add(hemi);
    const daylight = new THREE.DirectionalLight(0xfff1cf, 3.4); daylight.position.set(-4, 17, -6); daylight.castShadow = true; daylight.shadow.mapSize.set(1024, 1024); daylight.shadow.camera.left = -14; daylight.shadow.camera.right = 14; daylight.shadow.camera.top = 14; daylight.shadow.camera.bottom = -14; this.scene.add(daylight);
    for (const position of [[0, 7.5, 0], [5, 4, -5], [-5, 4, 5]]) {
      const light = new THREE.PointLight(0xffd9a4, position[0] ? 18 : 35, 15, 1.7); light.position.set(...position); this.scene.add(light);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd79b })); globe.position.copy(light.position); this.scene.add(globe);
    }
  }

  async loadPeriod(period, artworks) {
    this.period = period;
    this.clearFrames();
    this.camera.position.set(0, 1.7, -6.2); this.yaw = 0; this.pitch = 0;
    const loader = new THREE.TextureLoader();
    const texturePromises = artworks.map((artwork) => new Promise((resolve) => {
      loader.load(artwork.image, (texture) => { texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); resolve(texture); }, undefined, () => resolve(fallbackArtworkTexture(artwork)));
    }));
    const textures = await Promise.all(texturePromises);
    artworks.forEach((artwork, index) => this.createFrame(this.bayGroups[index], artwork, textures[index]));
    this.running = true;
    this.renderedReducedFrame = false;
  }

  createFrame(bay, artwork, texture) {
    const width = artwork.width || texture.image?.naturalWidth || texture.image?.width || 4;
    const height = artwork.height || texture.image?.naturalHeight || texture.image?.height || 3;
    const ratio = Math.max(.48, Math.min(2.3, width / height));
    let artWidth = 3.65; let artHeight = artWidth / ratio;
    if (artHeight > 2.7) { artHeight = 2.7; artWidth = artHeight * ratio; }
    const frame = new THREE.Group(); frame.position.set(0, 3.05, .18);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(artWidth, artHeight), new THREE.MeshStandardMaterial({ map: texture, roughness: .72, metalness: 0, side: THREE.DoubleSide }));
    art.userData.artwork = artwork; art.castShadow = true; frame.add(art);
    const frameMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa3783d, roughness: .24, metalness: .62, clearcoat: .6 });
    const sideWidth = .16;
    const horizontal = new THREE.BoxGeometry(artWidth + .38, sideWidth, .15);
    const vertical = new THREE.BoxGeometry(sideWidth, artHeight + .38, .15);
    for (const y of [-artHeight / 2 - .11, artHeight / 2 + .11]) { const bar = new THREE.Mesh(horizontal, frameMaterial); bar.position.set(0, y, .06); bar.castShadow = true; frame.add(bar); }
    for (const x of [-artWidth / 2 - .11, artWidth / 2 + .11]) { const bar = new THREE.Mesh(vertical, frameMaterial); bar.position.set(x, 0, .06); bar.castShadow = true; frame.add(bar); }
    const plaqueTexture = this.makePlaqueTexture(artwork);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(3.5, Math.max(2.2, artWidth)), .42), new THREE.MeshBasicMaterial({ map: plaqueTexture, transparent: true, side: THREE.DoubleSide }));
    plaque.position.set(0, -artHeight / 2 - .52, .08); frame.add(plaque);
    bay.add(frame); this.frames.push({ bay, frame, art, artwork, texture, plaqueTexture });
  }

  makePlaqueTexture(artwork) {
    const canvas = document.createElement("canvas"); canvas.width = 768; canvas.height = 120;
    const context = canvas.getContext("2d"); context.fillStyle = "rgba(235,224,201,.95)"; context.fillRect(0, 0, 768, 120);
    context.fillStyle = "#172a39"; context.font = "800 27px sans-serif"; context.fillText(artwork.titleZh.slice(0, 30), 28, 49);
    context.fillStyle = "#6f6559"; context.font = "600 19px sans-serif"; context.fillText(`${artwork.artistZh} · ${artwork.date}`.slice(0, 48), 28, 84);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }

  clearFrames() {
    for (const entry of this.frames) {
      entry.bay.remove(entry.frame); entry.frame.traverse((node) => { node.geometry?.dispose(); node.material?.dispose(); });
      entry.texture.dispose(); entry.plaqueTexture.dispose();
    }
    this.frames = []; this.setTarget(null);
  }

  bindEvents() {
    this.onKeyDown = (event) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code) && state.screen === "gallery") event.preventDefault();
      this.keys.add(event.code);
      if (event.code === "KeyE" && !event.repeat && state.screen === "gallery") this.inspect();
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onMouseMove = (event) => {
      if (state.detailOpen) return;
      const locked = document.pointerLockElement === this.renderer.domElement;
      if (!locked && !this.dragging) return;
      if (this.dragging && (Math.abs(event.movementX) + Math.abs(event.movementY)) > 2) this.dragMoved = true;
      this.yaw -= event.movementX * (locked ? .0018 : .0034);
      this.pitch -= event.movementY * (locked ? .0016 : .003);
      this.pitch = THREE.MathUtils.clamp(this.pitch, -.72, .72);
    };
    addEventListener("keydown", this.onKeyDown); addEventListener("keyup", this.onKeyUp); addEventListener("mousemove", this.onMouseMove); addEventListener("resize", () => this.resize());
    this.renderer.domElement.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || document.pointerLockElement === this.renderer.domElement || state.detailOpen) return;
      this.dragging = true; this.dragMoved = false; this.dragPointerId = event.pointerId;
      this.renderer.domElement.setPointerCapture?.(event.pointerId);
      this.root.classList.add("is-drag-looking");
    });
    const endDrag = (event) => {
      if (!this.dragging || (this.dragPointerId !== null && event.pointerId !== this.dragPointerId)) return;
      this.dragging = false; this.dragPointerId = null; this.root.classList.remove("is-drag-looking");
    };
    this.renderer.domElement.addEventListener("pointerup", endDrag);
    this.renderer.domElement.addEventListener("pointercancel", endDrag);
    this.renderer.domElement.addEventListener("click", () => {
      if (this.dragMoved) { this.dragMoved = false; return; }
      if (this.target) this.inspect();
      else if (!state.detailOpen) this.requestMouseLock();
    });
    document.addEventListener("pointerlockchange", () => {
      const locked = document.pointerLockElement === this.renderer.domElement;
      this.root.dataset.lookMode = locked ? "locked" : "drag";
      $("#look-mode").textContent = locked ? "鼠标已锁定 · Esc 释放" : "按住左键拖动转向 · 点击空白处可尝试锁定";
    });
  }

  requestMouseLock() {
    if (!this.renderer.domElement.requestPointerLock) { this.enableDragLook(); return; }
    try {
      const request = this.renderer.domElement.requestPointerLock();
      request?.catch?.(() => this.enableDragLook());
    } catch { this.enableDragLook(); }
  }

  enableDragLook() {
    this.root.dataset.lookMode = "drag";
    $("#look-mode").textContent = "按住左键拖动即可转向 · 当前环境无需鼠标锁定";
    toast("已切换为拖动转向：按住左键移动鼠标");
  }

  inspect() { if (this.target && !state.detailOpen) openDetail(this.target.artwork); }
  pause() { this.running = false; document.exitPointerLock?.(); this.keys.clear(); }
  resume() { this.running = true; this.renderedReducedFrame = false; this.clock.start(); }

  updateMovement(delta) {
    if (state.detailOpen) return;
    const forwardAmount = (this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0) - (this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0);
    const rightAmount = (this.keys.has("KeyD") || this.keys.has("ArrowRight") ? 1 : 0) - (this.keys.has("KeyA") || this.keys.has("ArrowLeft") ? 1 : 0);
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.camera.position.addScaledVector(forward, forwardAmount * delta * 3.15);
    this.camera.position.addScaledVector(right, rightAmount * delta * 3.15);
    const radial = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
    if (radial.length() > 11.3) { radial.setLength(11.3); this.camera.position.x = radial.x; this.camera.position.z = radial.y; }
    this.camera.position.y = 1.7;
    this.root.dataset.cameraX = this.camera.position.x.toFixed(4);
    this.root.dataset.cameraZ = this.camera.position.z.toFixed(4);
    this.root.dataset.yaw = this.yaw.toFixed(4);
    this.camera.rotation.order = "YXZ"; this.camera.rotation.y = this.yaw; this.camera.rotation.x = this.pitch;
  }

  updateTarget() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersections = this.raycaster.intersectObjects(this.frames.map((entry) => entry.art), false);
    const hit = intersections.find((entry) => entry.distance <= 7);
    const target = hit ? this.frames.find((entry) => entry.art === hit.object) : null;
    this.setTarget(target);
  }

  setTarget(target) {
    if (target === this.target) return;
    this.target = target;
    $(".gallery").classList.toggle("has-target", Boolean(target));
    $("#art-prompt").hidden = !target;
    if (target) $("#prompt-title").textContent = target.artwork.titleZh;
  }

  resize() {
    const width = this.root.clientWidth || innerWidth; const height = this.root.clientHeight || innerHeight;
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height); this.composer?.setSize(width, height); this.ssao?.setSize(width, height); this.bloom?.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.running || state.screen !== "gallery" || document.documentElement.dataset.specimenPaused === "true") return;
    if (this.reducedMotion && this.renderedReducedFrame && this.keys.size === 0 && !this.dragging) return;
    const delta = Math.min(.035, this.clock.getDelta()); this.updateMovement(delta); this.updateTarget(); this.composer.render(delta);
    this.renderedReducedFrame = this.reducedMotion;
    this.root.dataset.renderCount = String(++this.renderCount);
  }
}

function bindUi() {
  document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]"); if (!control) return;
    const action = control.dataset.action;
    if (action === "start") { showScreen("timeline"); setTimeout(() => $(".timeline").classList.add("is-grown"), 80); }
    if (action === "home") { $(".timeline").classList.remove("is-grown"); showScreen("welcome"); }
    if (action === "back-timeline") { closeDetail(); showScreen("timeline"); }
    if (action === "close-detail") closeDetail();
    if (action === "inspect") state.gallery?.inspect();
    if (action === "toggle-help") $("#gallery-help").classList.toggle("is-hidden");
  });
  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.detailOpen) { event.preventDefault(); event.stopImmediatePropagation(); closeDetail(); }
  }, true);
  document.addEventListener("pointerlockerror", () => state.gallery?.enableDragLook());
}

async function init() {
  bindUi();
  try {
    state.data = structuredClone(artworkCatalog);
    state.data.artworks.forEach((artwork) => { artwork.image = inlineArtworkImages[artwork.image]; });
    document.body.dataset.periods = String(state.data.periods.length);
    document.body.dataset.artists = String(new Set(state.data.artworks.map((artwork) => artwork.artistEn)).size);
    document.body.dataset.artworks = String(state.data.artworks.length);
    buildTimeline();
    console.info(`[time-gallery] ready: ${state.data.periods.length} periods, ${new Set(state.data.periods.flatMap((period) => period.artists.map((artist) => artist.en))).size} artists, ${state.data.artworks.length} artworks`);
  } catch (error) {
    console.error("[time-gallery] local catalog failed", error);
    toast("本地艺术史数据加载失败");
  }
}

init();
