import { useState, type ComponentType } from "react";
import { MemoryRouter } from "react-router-dom";
import type { Specimen, SpecimenControl } from "@/app/types";
import { SpecimenCard } from "@/components/catalog/SpecimenCard";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { AiReferencePanel } from "@/components/viewer/AiReferencePanel";
import { SpecimenViewer } from "@/components/viewer/SpecimenViewer";
import "@/styles/app.css";

const controls: SpecimenControl[] = [
  { key: "speed", label: "动画速度", type: "range", min: 0, max: 3, step: 0.1, default: 1 },
  { key: "accent", label: "强调色", type: "color", default: "#7dd3fc" },
  { key: "paused", label: "暂停动画", type: "boolean", default: false },
  { key: "density", label: "密度", type: "select", default: "normal", options: ["low", "normal", "high"] },
  { key: "origin", label: "原点", type: "vector2", default: [0, 0] },
];

const item: Specimen = {
  specimenVersion: 1,
  id: "control-probe",
  title: { zh: "控制探针", en: "Control probe" },
  description: "用于验证隔离、控制通信和 AI 资源的确定性展品。",
  category: "test-fixture",
  tags: ["protocol", "deterministic"],
  technology: ["html", "javascript"],
  entry: "/tests/fixtures/specimens/control-probe/index.html",
  url: "/tests/fixtures/specimens/control-probe/",
  runtime: { scripts: true },
  controls,
  ai: { prompt: "AI.md", context: "ai-context.json" },
  learning: { resource: "learning.json", contentRevision: 1, difficulty: "beginner", durationMinutes: 8 },
};

function ControlPanelStory() {
  const defaults = Object.fromEntries(controls.map((control) => [control.key, control.default]));
  const [values, setValues] = useState<Record<string, unknown>>(defaults);
  return (
    <>
      <ControlPanel controls={controls} values={values} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} onReset={() => setValues(defaults)} />
      <output data-testid="control-state">{JSON.stringify(values)}</output>
    </>
  );
}

function EmptyControlPanelStory() {
  return <ControlPanel controls={[]} values={{}} onChange={() => undefined} onReset={() => undefined} />;
}

function SpecimenCardStory() {
  return <MemoryRouter><SpecimenCard item={item} index={4} /></MemoryRouter>;
}

function SpecimenViewerStory() {
  const [values, setValues] = useState<Record<string, unknown>>({ speed: 1 });
  return (
    <>
      <SpecimenViewer item={item} values={values} onReset={() => setValues({ speed: 1 })} />
      <button type="button" onClick={() => setValues({ speed: 2 })}>Set speed 2</button>
    </>
  );
}

function AiReferencePanelStory() {
  return <AiReferencePanel item={item} />;
}

const builtInStories: Record<string, ComponentType> = {
  "ControlPanel#AllControls": ControlPanelStory,
  "ControlPanel#Empty": EmptyControlPanelStory,
  "SpecimenCard#Default": SpecimenCardStory,
  "SpecimenViewer#ProtocolProbe": SpecimenViewerStory,
  "AiReferencePanel#Default": AiReferencePanelStory,
};

const colocatedModules = import.meta.glob<{ [name: string]: ComponentType }>("/src/**/*.story.tsx", { eager: true });
const colocatedStories = Object.fromEntries(
  Object.entries(colocatedModules).flatMap(([modulePath, exports]) =>
    Object.entries(exports)
      .filter(([, value]) => typeof value === "function")
      .map(([name, Story]) => [`${modulePath.slice(1)}#${name}`, Story]),
  ),
);

export const stories: Record<string, ComponentType> = { ...builtInStories, ...colocatedStories };
