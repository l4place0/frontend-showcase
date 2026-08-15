import { useEffect, useState } from "react";
import type { LearningResource } from "../app/learning";
import type { Specimen } from "../app/types";
import { itemAsset } from "../app/urls";

interface LearningState {
  resource: LearningResource | null;
  loading: boolean;
  error: string | null;
}

function isLearningResource(value: unknown): value is LearningResource {
  if (!value || typeof value !== "object") return false;
  const resource = value as Partial<LearningResource>;
  if (resource.learningVersion !== 1 || typeof resource.contentRevision !== "number" || !Number.isInteger(resource.contentRevision) || resource.contentRevision < 1 || typeof resource.itemId !== "string" || !Array.isArray(resource.steps) || resource.steps.length < 4) return false;
  if (!Array.isArray(resource.objectives) || !Array.isArray(resource.prerequisites) || !Array.isArray(resource.commonMistakes) || !Array.isArray(resource.furtherReading) || !Array.isArray(resource.completion?.criteria)) return false;
  return resource.steps.every((step) => {
    if (!step || typeof step.id !== "string" || typeof step.kind !== "string" || typeof step.label !== "string" || typeof step.title !== "string" || typeof step.body !== "string") return false;
    if (step.annotations?.length && (!step.scene || !Number.isInteger(step.scene.viewport?.minWidth) || !step.scene.controls || typeof step.scene.controls !== "object")) return false;
    if (step.code && (typeof step.code.sourceDigest !== "string" || typeof step.code.sourceScope !== "string" || typeof step.code.sourceAvailability !== "string")) return false;
    return !step.quiz || step.quiz.every((quiz) => Array.isArray(quiz.options) && quiz.options.length >= 2 && Number.isInteger(quiz.correct) && quiz.correct >= 0 && quiz.correct < quiz.options.length);
  });
}

export function useLearningResource(item: Specimen, enabled: boolean): LearningState {
  const [state, setState] = useState<LearningState>({ resource: null, loading: false, error: null });

  useEffect(() => {
    if (!enabled || !item.learning?.resource) return;
    const controller = new AbortController();
    setState({ resource: null, loading: true, error: null });
    fetch(itemAsset(item, item.learning.resource), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json() as unknown;
      })
      .then((resource) => {
        if (!isLearningResource(resource)) throw new Error("教程资源结构或版本无效");
        if (resource.itemId !== item.id) throw new Error("教程与展品标识不一致");
        setState({ resource, loading: false, error: null });
      })
      .catch((reason: unknown) => {
        if ((reason as Error).name !== "AbortError") setState({ resource: null, loading: false, error: String((reason as Error).message || reason) });
      });
    return () => controller.abort();
  }, [enabled, item]);

  return state;
}
