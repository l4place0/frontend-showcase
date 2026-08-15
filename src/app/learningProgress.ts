import { useSyncExternalStore } from "react";

const STORAGE_KEY = "specimen-learning-progress:index";
const EVENT_NAME = "specimen-learning-progress";

export interface LearningProgressRecord {
  contentRevision: number;
  quizCorrect?: number;
  quizTotal?: number;
  criteriaCompleted?: number;
  criteriaTotal?: number;
  experimentsCompleted?: number;
  experimentsTotal?: number;
  completed?: boolean;
  updatedAt: string;
}

type LearningProgressIndex = Record<string, LearningProgressRecord>;

function readIndex(): LearningProgressIndex {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

export function updateLearningProgress(itemId: string, patch: Partial<LearningProgressRecord>) {
  const index = readIndex();
  index[itemId] = { ...index[itemId], ...patch, updatedAt: new Date().toISOString() } as LearningProgressRecord;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(index));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch { /* aggregate progress is optional */ }
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT_NAME, listener);
  window.addEventListener("storage", listener);
  return () => { window.removeEventListener(EVENT_NAME, listener); window.removeEventListener("storage", listener); };
}

function snapshot() {
  try { return localStorage.getItem(STORAGE_KEY) || "{}"; } catch { return "{}"; }
}

export function useLearningProgress(itemId: string): LearningProgressRecord | null {
  const serialized = useSyncExternalStore(subscribe, snapshot, () => "{}");
  try { return (JSON.parse(serialized) as LearningProgressIndex)[itemId] || null; } catch { return null; }
}
