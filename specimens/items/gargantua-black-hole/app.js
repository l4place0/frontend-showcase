import * as THREE from "./vendor/three.module.js";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { vertexShader, fragmentShader } from "./shaders.js?v=22";

const canvas = document.querySelector("#viewport");
const loading = document.querySelector("#loading");
const failure = document.querySelector("#failure");
const url = new URL(location.href);
const labels = [
  "拖动旋转 · 滚轮缩放 · 观察相机 C、成像平面与射线 d",
  "同一个相机位置 C · 不同像素 Pᵢⱼ · 形成不同方向 dᵢⱼ",
  "橙色虚线：欧氏直线 · 蓝色实线：Schwarzschild 零测地线",
  "每个 Fragment 独立积分 · 捕获写黑色 · 逃逸采样最终天空方向",
  "临界诊断：b < b_c 被捕获 · b ≈ b_c 在 r = 1.5rₛ 附近绕行 · b > b_c 逃逸",
  "最终成像：视界捕获、盘面穿越与背景透镜共享同一积分器",
];

let renderer;
let camera;
let controls;
let material;
let stage = THREE.MathUtils.clamp(Number(url.searchParams.get("stage") ?? (url.searchParams.has("testMode") ? 5 : 0)), 0, 5);
let raf = 0;
let rendered = false;
let renderCount = 0;
let lastAnimationFrame = 0;
let shaderScene;
let lessonScene;
let screenCamera;
const lessonLabels = [];
let singleRayGroup;
let rayBundleGroup;
let curvatureGroup;
let curvatureViewPosition;
let curvatureViewTarget;

function showFailure(error) {
  cancelAnimationFrame(raf);
  loading.classList.add("hidden");
  failure.hidden = false;
  document.querySelector("#failure-message").textContent = error?.message || "无法建立 WebGL2 上下文。";
  window.__GARGANTUA_ERROR__ = String(error?.message || error);
}

function resize() {
  if (!renderer) return;
  const dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1 : 1.35);
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  material?.uniforms.uResolution.value.set(canvas.width, canvas.height);
  invalidate();
}

function updateCameraUniforms() {
  camera.updateMatrixWorld();
  const e = camera.matrixWorld.elements;
  material.uniforms.uCamera.value.copy(camera.position);
  material.uniforms.uRight.value.set(e[0], e[1], e[2]).normalize();
  material.uniforms.uUp.value.set(e[4], e[5], e[6]).normalize();
  material.uniforms.uForward.value.set(-e[8], -e[9], -e[10]).normalize();
}

function updateCriticalGuides() {
  if (stage < 4) return;
  const radius = camera.position.length();
  const f = Math.max(1 - 1 / radius, .0001);
  const criticalImpact = 1.5 * Math.sqrt(3);
  const focalLength = 1 / Math.tan(THREE.MathUtils.degToRad(34 * .5));
  const projectImpact = impact => {
    const sinAlpha = THREE.MathUtils.clamp(impact * Math.sqrt(f) / radius, 0, .9999);
    return {
      alpha: Math.asin(sinAlpha),
      pixels: innerHeight * .5 * focalLength * Math.tan(Math.asin(sinAlpha)),
    };
  };
  const critical = projectImpact(criticalImpact);
  const nearCritical = projectImpact(1.15 * criticalImpact);
  const half = projectImpact(.5 * criticalImpact);
  const outer = projectImpact(1.25 * criticalImpact);
  const screenRadius = critical.pixels;
  document.querySelector("#app").style.setProperty("--critical-radius", `${screenRadius.toFixed(1)}px`);
  document.querySelector("#app").style.setProperty("--near-critical-radius", `${nearCritical.pixels.toFixed(1)}px`);
  document.querySelector("#app").style.setProperty("--half-impact-radius", `${half.pixels.toFixed(1)}px`);
  document.querySelector("#app").style.setProperty("--outer-impact-radius", `${outer.pixels.toFixed(1)}px`);
  document.querySelector("#guide-angle").innerHTML = `α<sub>c</sub> = ${THREE.MathUtils.radToDeg(critical.alpha).toFixed(1)}°`;
  document.querySelector("#guide-distance").textContent = `相机 r₀ = ${radius.toFixed(1)}rₛ`;
}

function draw(time = performance.now()) {
  raf = 0;
  if (stage === 5 && time - lastAnimationFrame < 1000 / 24) {
    raf = requestAnimationFrame(draw);
    return;
  }
  lastAnimationFrame = time;
  renderCount += 1;
  controls.update();
  if (stage <= 2) {
    renderer.setClearColor(0x07090c, 1);
    renderer.render(lessonScene, camera);
    updateLessonLabels();
  } else {
    renderer.setClearColor(0x060606, 1);
    updateCameraUniforms();
    material.uniforms.uTime.value = time * .001;
    updateCriticalGuides();
    renderer.render(shaderScene, screenCamera);
    lessonLabels.forEach(({ element }) => { element.hidden = true; });
  }
  if (!rendered) {
    rendered = true;
    loading.classList.add("hidden");
    window.__GARGANTUA_READY__ = true;
    document.documentElement.dataset.captureReady = "true";
  }
  if (stage === 5) raf = requestAnimationFrame(draw);
}

function invalidate() {
  if (!raf && renderer) raf = requestAnimationFrame(draw);
}

function resetCamera() {
  if (stage === 2 && curvatureViewPosition) {
    camera.position.copy(curvatureViewPosition);
    controls.target.copy(curvatureViewTarget);
  } else if (stage <= 1) {
    camera.position.set(10.5, 7.2, 12.5);
    controls.target.set(0, 1.1, 0);
  } else {
    camera.position.set(0, 3.4, 14.5);
    controls.target.set(0, 0, 0);
  }
  controls.update();
  invalidate();
}

function setStage(next) {
  const previousStage = stage;
  stage = THREE.MathUtils.clamp(Number(next), 0, 5);
  material.uniforms.uStage.value = Math.max(stage - 2, 0);
  document.documentElement.dataset.lesson = String(stage + 1);
  document.querySelectorAll("[data-step]").forEach(button => {
    const active = Number(button.dataset.step) === stage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "step" : "false");
  });
  document.querySelectorAll("[data-page]").forEach(page => {
    const active = Number(page.dataset.page) === stage;
    page.hidden = !active;
    page.classList.toggle("active", active);
  });
  document.querySelector("#previous").disabled = stage === 0;
  document.querySelector("#next").disabled = stage === 5;
  document.querySelector("#view-label").textContent = labels[stage];
  const lessonMode = stage <= 2;
  document.querySelector("#space-labels").hidden = !lessonMode;
  document.querySelector("#capture-key").hidden = stage !== 3;
  document.querySelector("#capture-crosshair").hidden = stage !== 3;
  document.querySelector("#critical-key").hidden = stage !== 4;
  document.querySelector("#critical-guides").hidden = stage !== 4;
  document.querySelector("#formation-key").hidden = stage !== 5;
  document.querySelector("#formation-guides").hidden = stage !== 5;
  document.querySelector("#app").classList.toggle("space-mode", lessonMode);
  document.querySelector("#app").classList.toggle("capture-mode", stage === 3);
  singleRayGroup.visible = stage <= 1;
  rayBundleGroup.visible = stage === 1;
  curvatureGroup.visible = stage === 2;
  document.querySelector("#label-origin").textContent = stage === 2 ? "M  Schwarzschild 中心" : "O  世界原点 (0, 0, 0)";
  document.querySelector("#label-ray").textContent = stage === 2 ? "橙：直线  /  蓝：零测地线" : (stage === 1 ? "dᵢⱼ  每个像素一个方向" : "d  世界空间方向");
  if ((previousStage <= 2) !== lessonMode || (previousStage === 2) !== (stage === 2)) resetCamera();
  invalidate();
}

function addLessonLabel(id, text, position, stages) {
  const element = document.querySelector(id);
  element.textContent = text;
  lessonLabels.push({ element, position, stages });
}

function updateLessonLabels() {
  const width = innerWidth;
  const height = innerHeight;
  lessonLabels.forEach(({ element, position, stages }) => {
    const projected = position.clone().project(camera);
    const visible = projected.z > -1 && projected.z < 1 && (!stages || stages.includes(stage));
    element.hidden = !visible;
    element.style.transform = `translate(${(projected.x * .5 + .5) * width}px, ${(-projected.y * .5 + .5) * height}px)`;
  });
}

function buildImagePlane(rayCamera, distance) {
  const height = 2 * Math.tan(THREE.MathUtils.degToRad(rayCamera.fov * .5)) * distance;
  const width = height * rayCamera.aspect;
  const group = new THREE.Group();
  group.position.copy(rayCamera.position);
  group.quaternion.copy(rayCamera.quaternion);
  group.translateZ(-distance);

  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ color: 0x5ec7ff, transparent: true, opacity: .075, side: THREE.DoubleSide, depthWrite: false })
  );
  group.add(surface);

  const points = [];
  for (let i = 0; i <= 6; i += 1) {
    const x = -width / 2 + width * i / 6;
    points.push(new THREE.Vector3(x, -height / 2, .005), new THREE.Vector3(x, height / 2, .005));
  }
  for (let i = 0; i <= 4; i += 1) {
    const y = -height / 2 + height * i / 4;
    points.push(new THREE.Vector3(-width / 2, y, .005), new THREE.Vector3(width / 2, y, .005));
  }
  group.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x5ec7ff, transparent: true, opacity: .32 })
  ));
  lessonScene.add(group);

  const corners = [
    new THREE.Vector3(-width / 2, -height / 2, 0),
    new THREE.Vector3(width / 2, -height / 2, 0),
    new THREE.Vector3(width / 2, height / 2, 0),
    new THREE.Vector3(-width / 2, height / 2, 0),
  ].map(point => point.applyQuaternion(group.quaternion).add(group.position));
  const frustumPoints = corners.flatMap(point => [rayCamera.position.clone(), point]);
  lessonScene.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(frustumPoints),
    new THREE.LineBasicMaterial({ color: 0x7c8b96, transparent: true, opacity: .24 })
  ));

  const pixel = new THREE.Vector3(width * .34, height * .05, 0).applyQuaternion(group.quaternion).add(group.position);
  const marker = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffc36a }));
  marker.position.copy(pixel);
  lessonScene.add(marker);
  return { pixel, center: group.position.clone(), group, width, height };
}

function metricDerivative(state, pt, angularMomentum, rs) {
  const [radiusValue, phi, radialMomentum] = state;
  const radius = Math.max(radiusValue, rs + .0002);
  const f = Math.max(1 - rs / radius, .0001);
  const fp = rs / (radius * radius);
  return [
    f * radialMomentum,
    angularMomentum / (radius * radius),
    -.5 * (pt * pt * fp / (f * f) + fp * radialMomentum * radialMomentum - 2 * angularMomentum * angularMomentum / (radius * radius * radius)),
  ];
}

function rk4State(state, pt, angularMomentum, rs, h) {
  const add = (base, change, scale) => base.map((value, index) => value + change[index] * scale);
  const k1 = metricDerivative(state, pt, angularMomentum, rs);
  const k2 = metricDerivative(add(state, k1, h * .5), pt, angularMomentum, rs);
  const k3 = metricDerivative(add(state, k2, h * .5), pt, angularMomentum, rs);
  const k4 = metricDerivative(add(state, k3, h), pt, angularMomentum, rs);
  return state.map((value, index) => value + h * (k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index]) / 6);
}

function orbitPosition(radius, phi, radialBasis, tangentBasis) {
  return radialBasis.clone().multiplyScalar(radius * Math.cos(phi)).addScaledVector(tangentBasis, radius * Math.sin(phi));
}

function orbitCircle(radius, radialBasis, tangentBasis, color, opacity) {
  const points = [];
  for (let index = 0; index < 128; index += 1) {
    const phi = index / 128 * Math.PI * 2;
    points.push(orbitPosition(radius, phi, radialBasis, tangentBasis));
  }
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

function traceSchwarzschildRay(cameraPosition, direction, rs = 1) {
  const radius0 = cameraPosition.length();
  const radialBasis = cameraPosition.clone().normalize();
  const orbitNormal = new THREE.Vector3().crossVectors(radialBasis, direction).normalize();
  const tangentBasis = new THREE.Vector3().crossVectors(orbitNormal, radialBasis).normalize();
  const f0 = 1 - rs / radius0;
  const pt = -Math.sqrt(f0);
  const radialMomentum = direction.dot(radialBasis) / Math.sqrt(f0);
  const angularMomentum = radius0 * direction.dot(tangentBasis);
  let state = [radius0, 0, radialMomentum];
  const points = [cameraPosition.clone()];

  for (let index = 0; index < 640; index += 1) {
    const h = .032 * THREE.MathUtils.lerp(.75, 2.2, THREE.MathUtils.smoothstep(state[0], 1.4, 10));
    state = rk4State(state, pt, angularMomentum, rs, h);
    if (!state.every(Number.isFinite)) break;
    points.push(orbitPosition(state[0], state[1], radialBasis, tangentBasis));
    if (state[0] <= 1.008) break;
    if (state[0] > 15 && index > 20) break;
  }
  return { points, radialBasis, tangentBasis, orbitNormal };
}

function buildCurvatureComparison(rayCamera, direction) {
  const trace = traceSchwarzschildRay(rayCamera.position, direction);
  curvatureGroup = new THREE.Group();

  const straightEnd = rayCamera.position.clone().addScaledVector(direction, 18);
  const straight = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([rayCamera.position, straightEnd]),
    new THREE.LineDashedMaterial({ color: 0xffa94f, dashSize: .24, gapSize: .16, transparent: true, opacity: .8 })
  );
  straight.computeLineDistances();
  curvatureGroup.add(straight);

  curvatureGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(trace.points),
    new THREE.LineBasicMaterial({ color: 0x72d5ff })
  ));
  curvatureGroup.add(new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(trace.points.filter((_, index) => index % 6 === 0)),
    new THREE.PointsMaterial({ color: 0xb7ebff, size: .065, transparent: true, opacity: .85, depthWrite: false })
  ));
  curvatureGroup.add(orbitCircle(1, trace.radialBasis, trace.tangentBasis, 0xff794d, .9));
  curvatureGroup.add(orbitCircle(1.5, trace.radialBasis, trace.tangentBasis, 0x65c8ff, .45));
  lessonScene.add(curvatureGroup);

  curvatureViewTarget = rayCamera.position.clone().multiplyScalar(.38);
  curvatureViewPosition = curvatureViewTarget.clone().addScaledVector(trace.orbitNormal, 22);
  addLessonLabel("#label-horizon", "rₛ  事件视界参考", trace.radialBasis.clone().multiplyScalar(1.08), [2]);
}

function buildRayBundle(rayCamera, imagePlane) {
  const points = [];
  const samples = [];
  const columns = 7;
  const rows = 5;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const localPoint = new THREE.Vector3(
        imagePlane.width * (column / (columns - 1) - .5) * .9,
        imagePlane.height * (row / (rows - 1) - .5) * .9,
        0
      );
      const pixel = localPoint.applyQuaternion(imagePlane.group.quaternion).add(imagePlane.group.position);
      const direction = pixel.clone().sub(rayCamera.position).normalize();
      samples.push(pixel);
      points.push(rayCamera.position.clone(), rayCamera.position.clone().addScaledVector(direction, 11));
    }
  }
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x65c8ff, transparent: true, opacity: .27, depthWrite: false })
  );
  rayBundleGroup = new THREE.Group();
  rayBundleGroup.add(lines);
  rayBundleGroup.add(new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(samples),
    new THREE.PointsMaterial({ color: 0x9bddff, size: .075, transparent: true, opacity: .9, depthWrite: false })
  ));
  lessonScene.add(rayBundleGroup);
}

function buildLessonScene() {
  lessonScene = new THREE.Scene();
  lessonScene.fog = new THREE.FogExp2(0x07090c, .018);

  const grid = new THREE.GridHelper(24, 24, 0x314355, 0x18232d);
  grid.material.transparent = true;
  grid.material.opacity = .72;
  lessonScene.add(grid);
  lessonScene.add(new THREE.AxesHelper(4));

  const origin = new THREE.Mesh(
    new THREE.SphereGeometry(.16, 24, 14),
    new THREE.MeshBasicMaterial({ color: 0xff9f43 })
  );
  lessonScene.add(origin);

  const rayCamera = new THREE.PerspectiveCamera(34, 1.45, .55, 10);
  rayCamera.position.set(4.8, 3.6, 7.2);
  rayCamera.lookAt(0, .6, 0);
  rayCamera.updateMatrixWorld(true);
  const cameraBody = new THREE.Mesh(
    new THREE.BoxGeometry(.34, .24, .42),
    new THREE.MeshBasicMaterial({ color: 0xe9eef2, wireframe: true })
  );
  cameraBody.position.copy(rayCamera.position);
  cameraBody.quaternion.copy(rayCamera.quaternion);
  lessonScene.add(cameraBody);

  const imagePlane = buildImagePlane(rayCamera, 2.2);
  const { pixel, center: planeCenter } = imagePlane;
  const direction = pixel.clone().sub(rayCamera.position).normalize();
  const rayEnd = rayCamera.position.clone().addScaledVector(direction, 12);
  singleRayGroup = new THREE.Group();
  singleRayGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([rayCamera.position, rayEnd]),
    new THREE.LineBasicMaterial({ color: 0xffa94f })
  ));
  const arrow = new THREE.ConeGeometry(.11, .34, 16);
  const arrowHead = new THREE.Mesh(arrow, new THREE.MeshBasicMaterial({ color: 0xffa94f }));
  arrowHead.position.copy(rayCamera.position).addScaledVector(direction, 4.2);
  arrowHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  singleRayGroup.add(arrowHead);
  lessonScene.add(singleRayGroup);
  buildRayBundle(rayCamera, imagePlane);
  buildCurvatureComparison(rayCamera, direction);

  addLessonLabel("#label-origin", "O  世界原点 (0, 0, 0)", new THREE.Vector3(0, .32, 0));
  addLessonLabel("#label-camera", "C  相机位置", rayCamera.position.clone().add(new THREE.Vector3(0, .4, 0)));
  addLessonLabel("#label-plane", "P  成像平面", planeCenter.add(new THREE.Vector3(0, .55, 0)));
  addLessonLabel("#label-ray", "d  世界空间方向", rayCamera.position.clone().lerp(pixel, .45).add(new THREE.Vector3(0, .34, 0)));
}

const context = canvas.getContext("webgl2", {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: url.searchParams.has("capture"),
  powerPreference: "high-performance",
});

try {
  if (!context) throw new Error("这个实验需要 WebGL2。请启用硬件加速后重试。");
  renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false, alpha: false });
  renderer.setClearColor(0x060606, 1);
  shaderScene = new THREE.Scene();
  screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, .01, 100);
  material = new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uCamera: { value: new THREE.Vector3() },
      uForward: { value: new THREE.Vector3() },
      uRight: { value: new THREE.Vector3() },
      uUp: { value: new THREE.Vector3() },
      uStage: { value: stage },
      uTime: { value: 0 },
    },
  });
  shaderScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  buildLessonScene();

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.rotateSpeed = .4;
  controls.zoomSpeed = .65;
  controls.minDistance = 5;
  controls.maxDistance = 40;
  controls.addEventListener("change", invalidate);

  resetCamera();
  resize();
  setStage(stage);
} catch (error) {
  showFailure(error);
}

document.querySelectorAll("[data-step]").forEach(button => button.addEventListener("click", () => setStage(button.dataset.step)));
document.querySelector("#previous").addEventListener("click", () => setStage(stage - 1));
document.querySelector("#next").addEventListener("click", () => setStage(stage + 1));
document.querySelector("#reset-camera").addEventListener("click", resetCamera);
document.querySelector("#retry").addEventListener("click", () => location.reload());
addEventListener("resize", resize, { passive: true });
addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") setStage(stage - 1);
  if (event.key === "ArrowRight") setStage(stage + 1);
  if (/^[1-6]$/.test(event.key)) setStage(Number(event.key) - 1);
  if (event.key.toLowerCase() === "r") resetCamera();
});
canvas.addEventListener("webglcontextlost", event => {
  event.preventDefault();
  showFailure(new Error("WebGL 上下文已丢失，渲染已经安全停止。"));
});
canvas.addEventListener("webglcontextrestored", () => location.reload());

window.__GARGANTUA_CAPTURE__ = () => ({
  ready: Boolean(window.__GARGANTUA_READY__),
  dataUrl: window.__GARGANTUA_READY__ ? canvas.toDataURL("image/png") : null,
  state: { stage, renderCount },
});
window.__GARGANTUA_SET_STATE__ = next => {
  if (next?.stage !== undefined) setStage(next.stage);
};

if (url.searchParams.has("testMode")) document.querySelector("#app").classList.add("preview-mode");
