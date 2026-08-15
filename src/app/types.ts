export type LocalizedText = string | { zh?: string; en?: string };

export interface SpecimenRuntime {
  scripts?: boolean;
  forms?: boolean;
  downloads?: boolean;
  webgl?: boolean;
  audio?: boolean;
  fullscreen?: boolean;
  pointerLock?: boolean;
}

export interface ControlOption {
  label: string;
  value: string | number;
}

export interface SpecimenControl {
  key: string;
  label: string;
  type: "range" | "number" | "color" | "boolean" | "select" | "text" | "button" | "vector2";
  default?: unknown;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: Array<ControlOption | string | number>;
}

export interface Specimen {
  specimenVersion?: number;
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  category: string;
  tags?: string[];
  technology?: string[];
  renderer?: string;
  entry?: string;
  url?: string;
  thumbnail?: string;
  runtime?: SpecimenRuntime;
  controls?: SpecimenControl[];
  ai?: { prompt?: string; context?: string; source?: string };
  learning?: { resource: string; contentRevision?: number; title?: string; difficulty?: string; durationMinutes?: number; concepts?: string[] };
  prompt?: string;
  context?: string;
}

export interface CatalogPayload {
  version?: number;
  generatedAt?: string;
  items: Specimen[];
}

export function text(value: LocalizedText | undefined, fallback = ""): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.zh || value.en || fallback;
}

export function englishText(value: LocalizedText | undefined): string {
  return typeof value === "object" ? value.en || "" : "";
}
