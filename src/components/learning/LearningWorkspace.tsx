import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { LearningAnnotation, LearningExperiment, LearningQuiz, LearningResource, LearningStep } from "../../app/learning";
import type { Specimen } from "../../app/types";
import { useLearningResource } from "../../hooks/useLearningResource";
import { ControlPanel } from "../controls/ControlPanel";
import { SpecimenViewer } from "../viewer/SpecimenViewer";
import { itemAsset } from "../../app/urls";
import { updateLearningProgress } from "../../app/learningProgress";
import "../../styles/learning.css";

function sceneControlMatches(expected: Record<string, unknown>, actual: Record<string, unknown>) {
  return Object.entries(expected).every(([key, value]) => JSON.stringify(actual[key]) === JSON.stringify(value));
}

function AnnotationLayer({ step, visible }: { step: LearningStep; visible: boolean }) {
  const annotations = step.annotations || [];
  if (!annotations.length || !visible) return null;
  return (
    <div className="specimen-annotation-layer" data-testid="specimen-annotations" aria-label={`${step.label}讲解标注`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {annotations.map((annotation) => {
          const points = `${annotation.anchor.join(",")} ${annotation.elbow.join(",")} ${annotation.end.join(",")}`;
          return <g key={annotation.id}><polyline className="callout-line-outline" points={points} /><polyline className="callout-line-main" points={points} /></g>;
        })}
      </svg>
      {annotations.map((annotation: LearningAnnotation) => (
        <div className="specimen-callout" key={annotation.id}>
          <i className="callout-anchor" style={{ left: `${annotation.anchor[0]}%`, top: `${annotation.anchor[1]}%` }} aria-hidden="true" />
          <button className={`callout-copy${annotation.detailSide === "left" ? " detail-left" : ""}`} type="button" style={{ left: `${annotation.end[0]}%`, top: `${annotation.end[1]}%` }} aria-label={annotation.summary} aria-describedby={`annotation-${step.id}-${annotation.id}`}>
            <span>{annotation.summary}</span><b id={`annotation-${step.id}-${annotation.id}`} role="tooltip">{annotation.detail}</b>
          </button>
        </div>
      ))}
    </div>
  );
}

function Metadata({ item }: { item: Specimen }) {
  return <dl className="metadata"><div><dt>分类</dt><dd>{item.category}</dd></div>{item.renderer && <div><dt>Renderer</dt><dd>{item.renderer}</dd></div>}{!!item.technology?.length && <div><dt>技术</dt><dd>{item.technology.join(" · ")}</dd></div>}<div><dt>协议</dt><dd>v{item.specimenVersion || 1}</dd></div></dl>;
}

function ExperimentCards({ experiments, values, onReplaceValues, onComplete, completed }: { experiments: LearningExperiment[]; values: Record<string, unknown>; onReplaceValues: (values: Record<string, unknown>) => void; onComplete: (id: string) => void; completed: Set<string> }) {
  const [phases, setPhases] = useState<Record<string, "idle" | "baseline" | "changed">>({});
  return <div className="experiment-list">{experiments.map((experiment, index) => {
    const native = Object.keys(experiment.controls).length === 0 && Object.keys(experiment.initial).length === 0;
    const phase = phases[experiment.id] || "idle";
    const setPhase = (next: "baseline" | "changed") => setPhases((current) => ({ ...current, [experiment.id]: next }));
    return <article className="experiment-card" key={experiment.id}>
      <header><span>{String(index + 1).padStart(2, "0")}</span><b>{experiment.label}</b><i>{completed.has(experiment.id) ? "已完成" : phase === "baseline" ? "基线已设置" : phase === "changed" ? "变化已应用" : "待实验"}</i></header>
      <dl><div><dt>预期观察</dt><dd>{experiment.expected}</dd></div><div><dt>如何复位</dt><dd>{experiment.reset}</dd></div></dl>
      {native ? <button type="button" className="experiment-complete" aria-pressed={completed.has(experiment.id)} onClick={() => onComplete(experiment.id)}>我已在展品中完成此操作</button> : <footer><button type="button" onClick={() => { onReplaceValues({ ...values, ...experiment.initial }); setPhase("baseline"); }}>1 · 设置基线</button><button type="button" disabled={phase === "idle"} onClick={() => { onReplaceValues({ ...values, ...experiment.initial, ...experiment.controls }); setPhase("changed"); onComplete(experiment.id); }}>2 · 应用变化</button><button type="button" onClick={() => { onReplaceValues({ ...values, ...experiment.initial }); setPhase("baseline"); }}>复位到基线</button></footer>}
    </article>;
  })}</div>;
}

function QuizCards({ item, resource, quiz, completedExperiments, totalExperiments }: { item: Specimen; resource: LearningResource; quiz: LearningQuiz[]; completedExperiments: number; totalExperiments: number }) {
  const [cardIndex, setCardIndex] = useState(0);
  const storageKey = `specimen-learning:${resource.itemId}:v${resource.learningVersion}:r${resource.contentRevision}:quiz`;
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}").answers || {}; } catch { return {}; }
  });
  const [criteria, setCriteria] = useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}").criteria || {}; } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ answers, criteria })); } catch { /* progress storage is optional */ }
  }, [answers, criteria, storageKey]);
  const card = quiz[cardIndex];
  const selected = answers[card.id];
  const progress = Math.round(quiz.filter((candidate) => answers[candidate.id] === candidate.correct).length / quiz.length * 100);
  const criteriaComplete = resource.completion.criteria.every((_, index) => criteria[index]);
  const lessonComplete = progress === 100 && completedExperiments === totalExperiments && criteriaComplete;
  useEffect(() => {
    updateLearningProgress(resource.itemId, {
      contentRevision: resource.contentRevision,
      quizCorrect: quiz.filter((candidate) => answers[candidate.id] === candidate.correct).length,
      quizTotal: quiz.length,
      criteriaCompleted: resource.completion.criteria.filter((_, index) => criteria[index]).length,
      criteriaTotal: resource.completion.criteria.length,
      completed: lessonComplete,
    });
  }, [answers, criteria, lessonComplete, quiz, resource]);
  return (
    <>
      <div className="mastery-card" data-testid="mastery-card">
        <header><span>FLASH CARD</span><b>{String(cardIndex + 1).padStart(2, "0")} / {String(quiz.length).padStart(2, "0")}</b></header>
        <h3>{card.question}</h3>
        <div className="mastery-options">{card.options.map((option, optionIndex) => { const isSelected = selected === optionIndex; const isCorrect = isSelected && optionIndex === card.correct; return <button type="button" className={isCorrect ? "correct" : isSelected ? "wrong" : ""} aria-pressed={isSelected} onClick={() => setAnswers((current) => ({ ...current, [card.id]: optionIndex }))} key={option}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>; })}</div>
        {selected !== undefined && <div className={`quiz-feedback ${selected === card.correct ? "is-correct" : "is-wrong"}`} role="status"><b>{selected === card.correct ? "回答正确" : "再看一眼展品"}</b><p>{card.explanation}</p></div>}
        <footer><button type="button" disabled={cardIndex === 0} onClick={() => setCardIndex((index) => index - 1)}>← 上一张</button><button type="button" disabled={cardIndex === quiz.length - 1} onClick={() => setCardIndex((index) => index + 1)}>下一张 →</button></footer>
      </div>
      <div className="completion-score" aria-live="polite"><strong>{String(progress).padStart(2, "0")}</strong><span>% QUIZ SCORE · 实验 {completedExperiments}/{totalExperiments}</span><i><b style={{ width: `${progress}%` }} /></i></div>
      <section className={`lesson-completion-status${lessonComplete ? " is-complete" : ""}`} aria-live="polite"><b>{lessonComplete ? "教程完成" : "尚未完成全部标准"}</b><p>测验、实验和下面的自检标准彼此独立，不以浏览进度代替掌握。</p></section>
      <details className="learning-completion" open><summary>完成标准与常见错误</summary><h3>完成标准</h3><div className="completion-checks">{resource.completion.criteria.map((criterion, index) => <label key={criterion}><input type="checkbox" checked={Boolean(criteria[index])} onChange={(event) => setCriteria((current) => ({ ...current, [index]: event.target.checked }))} />{criterion}</label>)}</div><h3>常见错误</h3><ul>{resource.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></details>
      <section className="further-reading"><h3>延伸阅读</h3>{resource.furtherReading.map((reading) => <a href={itemAsset(item, reading.href)} target="_blank" rel="noreferrer" key={reading.href}>{reading.label} ↗</a>)}</section>
    </>
  );
}

interface WorkspaceProps {
  item: Specimen;
  values: Record<string, unknown>;
  learning: boolean;
  onChange: (key: string, value: unknown) => void;
  onReplaceValues: (values: Record<string, unknown>) => void;
  onReset: () => void;
}

export function LearningWorkspace({ item, values, learning, onChange, onReplaceValues, onReset }: WorkspaceProps) {
  const { resource, loading, error } = useLearningResource(item, learning);
  const allExperimentIds = resource ? [...new Set(resource.steps.flatMap((candidate) => candidate.experiments?.map((experiment) => experiment.id) || []))] : [];
  const [stepIndex, setStepIndex] = useState(0);
  const [completedExperimentIds, setCompletedExperimentIds] = useState<Set<string>>(new Set());
  const [confirmedScenes, setConfirmedScenes] = useState<Set<string>>(new Set());
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(0);
  useEffect(() => { setStepIndex(0); setConfirmedScenes(new Set()); }, [item.id]);
  useEffect(() => {
    if (!resource) return;
    const key = `specimen-learning:${resource.itemId}:v${resource.learningVersion}:r${resource.contentRevision}:experiments`;
    try { setCompletedExperimentIds(new Set(JSON.parse(localStorage.getItem(key) || "[]"))); } catch { setCompletedExperimentIds(new Set()); }
  }, [resource]);
  useEffect(() => {
    if (!resource) return;
    const key = `specimen-learning:${resource.itemId}:v${resource.learningVersion}:r${resource.contentRevision}:experiments`;
    try { localStorage.setItem(key, JSON.stringify([...completedExperimentIds])); } catch { /* progress storage is optional */ }
    updateLearningProgress(resource.itemId, { contentRevision: resource.contentRevision, experimentsCompleted: completedExperimentIds.size, experimentsTotal: allExperimentIds.length });
  }, [completedExperimentIds, resource]);
  useEffect(() => setConfirmedScenes(new Set()), [values]);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width));
    observer.observe(stage);
    setStageWidth(stage.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [learning]);
  const step = resource?.steps[Math.min(stepIndex, resource.steps.length - 1)] || null;
  const stepCount = resource?.steps.length || 4;
  const stepperStyle = { "--lesson-step-count": stepCount } as CSSProperties;
  const markExperimentComplete = (id: string) => setCompletedExperimentIds((current) => new Set([...current, id]));
  const annotationScene = step?.annotations?.length ? step.scene : undefined;
  const sceneKey = `${item.id}:${step?.id || "none"}`;
  const viewportMatches = !annotationScene || (stageWidth >= annotationScene.viewport.minWidth && (annotationScene.viewport.maxWidth === undefined || stageWidth <= annotationScene.viewport.maxWidth));
  const controlsMatch = !annotationScene || sceneControlMatches(annotationScene.controls, values);
  const needsManualScene = Boolean(annotationScene && (annotationScene.screen !== "initial" || annotationScene.scroll.x !== 0 || annotationScene.scroll.y !== 0));
  const manualSceneConfirmed = !needsManualScene || confirmedScenes.has(sceneKey);
  const annotationsVisible = Boolean(annotationScene && viewportMatches && controlsMatch && manualSceneConfirmed);
  const restoreAnnotationScene = () => annotationScene && onReplaceValues({ ...values, ...annotationScene.controls });
  const selectStep = (index: number) => { setConfirmedScenes(new Set()); setStepIndex(index); };

  return (
    <div className={`integrated-exhibit-workspace${learning ? " is-learning" : ""}`} data-testid="integrated-exhibit-workspace">
      <section className="integrated-stage" aria-label={learning ? "持续展示的学习展品" : "展品舞台"}>
        <div className="canvas-context" aria-hidden={!learning}>
          <div><span>{String(stepIndex + 1).padStart(2, "0")} / {step?.label || "学习"}</span><b>{step?.hint || "载入教程"}</b></div>
          <p>{step?.body || "教程资源正在载入，展品保持可见且可操作。"}</p>
        </div>
        <div className="learning-specimen-stage" ref={stageRef}>
          <SpecimenViewer item={item} values={values} onReset={onReset} />
          {learning && step && <AnnotationLayer step={step} visible={annotationsVisible} />}
        </div>
      </section>

      {learning ? (
        <aside className="learning-dock" aria-label="展品学习面板">
          {resource && <nav className="lesson-stepper" style={stepperStyle} aria-label="学习视角">{resource.steps.map((candidate, index) => <button type="button" className={stepIndex === index ? "active" : ""} aria-current={stepIndex === index ? "step" : undefined} onClick={() => selectStep(index)} key={candidate.id}><span>{String(index + 1).padStart(2, "0")}</span><b>{candidate.label}</b></button>)}</nav>}
          <div className="dock-content">
            {loading && <section className="dock-lesson learning-resource-status"><span className="eyebrow">LEARNING RESOURCE</span><h2>正在布置学习现场</h2><p>展品不会重载；教程内容加载后将出现在这里。</p></section>}
            {error && <section className="dock-lesson learning-resource-status"><span className="eyebrow">LEARNING RESOURCE</span><h2>教程暂时不可用</h2><p>{error}</p></section>}
            {resource && step && <section className={`dock-lesson lesson-kind-${step.kind}`}>
              <span className="eyebrow">{step.eyebrow || step.kind.toUpperCase()}</span><h2>{step.title}</h2><p>{step.body}</p>
              {annotationScene && <div className={`annotation-scene-status${annotationsVisible ? " is-ready" : ""}`} data-testid="annotation-scene-status"><b>{annotationsVisible ? "标注按本次人工确认显示；移动画面后请重新对准" : !viewportMatches ? "当前画布过窄，已隐藏定位标注" : !controlsMatch ? "展品参数已偏离标注场景" : "请先在展品内对准标注场景"}</b><span>宽度 {annotationScene.viewport.minWidth}{annotationScene.viewport.maxWidth ? `–${annotationScene.viewport.maxWidth}` : "+"} px · 画面 {annotationScene.screen} · 滚动 x {annotationScene.scroll.x} / y {annotationScene.scroll.y}</span>{viewportMatches && !controlsMatch && <button type="button" onClick={restoreAnnotationScene}>恢复宿主参数</button>}{viewportMatches && controlsMatch && needsManualScene && !manualSceneConfirmed && <button type="button" onClick={() => setConfirmedScenes((current) => new Set([...current, sceneKey]))}>我已在展品内对准</button>}{needsManualScene && manualSceneConfirmed && <button type="button" onClick={() => setConfirmedScenes((current) => new Set([...current].filter((key) => key !== sceneKey)))}>重新对准</button>}</div>}
              {stepIndex === 0 && <div className="learning-overview"><div><b>{resource.difficulty}</b><span>{resource.durationMinutes} 分钟</span></div><h3>学习目标</h3><ul>{resource.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>{!!resource.prerequisites.length && <><h3>前置知识</h3><ul>{resource.prerequisites.map((prerequisite) => <li key={prerequisite}>{prerequisite}</li>)}</ul></>}</div>}
              {!!step.experiments?.length && <ExperimentCards experiments={step.experiments} values={values} onReplaceValues={onReplaceValues} onComplete={markExperimentComplete} completed={completedExperimentIds} />}
              {step.code && <details className="code-reference"><summary>查看对应关键代码 <span>{step.code.file} · {step.code.locator}</span></summary><div className="inline-code"><pre data-testid="learning-code"><code>{step.code.snippet}</code></pre></div></details>}
              {step.question && <div className="observation-card"><b>对着展品回答</b><p>{step.question}</p></div>}
              {step.quiz?.length ? <QuizCards item={item} resource={resource} quiz={step.quiz} completedExperiments={allExperimentIds.filter((id) => completedExperimentIds.has(id)).length} totalExperiments={allExperimentIds.length} /> : <details className="fine-controls"><summary>展开全部实验参数</summary><ControlPanel controls={item.controls || []} values={values} onChange={onChange} onReset={onReset} /></details>}
            </section>}
          </div>
          {resource && <footer className="dock-navigation"><button type="button" disabled={stepIndex === 0} onClick={() => selectStep(stepIndex - 1)}>← 上一个视角</button><span>{stepIndex + 1} / {resource.steps.length}</span><button type="button" disabled={stepIndex === resource.steps.length - 1} onClick={() => selectStep(stepIndex + 1)}>下一个视角 →</button></footer>}
        </aside>
      ) : (
        <aside className="inspector"><div className="inspector-heading"><span className="eyebrow">CONTROLS</span><h2>展品参数</h2></div><ControlPanel controls={item.controls || []} values={values} onChange={onChange} onReset={onReset} /><Metadata item={item} /></aside>
      )}
    </div>
  );
}
