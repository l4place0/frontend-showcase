export type LearningPoint = [number, number];

export interface LearningAnnotation {
  id: string;
  anchor: LearningPoint;
  elbow: LearningPoint;
  end: LearningPoint;
  detailSide?: string;
  summary: string;
  detail: string;
}

export interface LearningCodeStudy {
  file: string;
  locator: string;
  snippet: string;
  sourceDigest: string;
  sourceScope: string;
  sourceAvailability: string;
}

export interface LearningExperiment {
  id: string;
  label: string;
  note?: string;
  initial: Record<string, unknown>;
  controls: Record<string, unknown>;
  expected: string;
  reset: string;
}

export interface LearningQuiz {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface LearningStep {
  id: string;
  kind: string;
  label: string;
  hint: string;
  eyebrow?: string;
  title: string;
  body: string;
  question?: string;
  scene?: { viewport: { minWidth: number; maxWidth?: number }; controls: Record<string, unknown>; screen: string; scroll: { x: number; y: number } };
  annotations?: LearningAnnotation[];
  code?: LearningCodeStudy;
  experiments?: LearningExperiment[];
  quiz?: LearningQuiz[];
}

export interface LearningResource {
  learningVersion: 1;
  contentRevision: number;
  itemId: string;
  title: string;
  summary: string;
  difficulty: string;
  durationMinutes: number;
  concepts: string[];
  objectives: string[];
  prerequisites: string[];
  steps: LearningStep[];
  commonMistakes: string[];
  furtherReading: Array<{ label: string; href: string }>;
  completion: { criteria: string[] };
}
