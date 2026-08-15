import { useEffect, useState } from "react";
import type { Specimen } from "../../app/types";
import { itemAsset, itemRoot } from "../../app/urls";

function CopyButton({ value, children }: { value: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return <button className="button secondary" type="button" onClick={copy}>{copied ? "已复制" : children}</button>;
}

export function AiReferencePanel({ item }: { item: Specimen }) {
  const promptUrl = itemAsset(item, item.ai?.prompt || item.prompt || "AI.md");
  const independentUrl = new URL(itemRoot(item.id, item.url), window.location.href).toString();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setPrompt("");
    setError("");
    fetch(promptUrl, { signal: controller.signal })
      .then((response) => response.ok ? response.text() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then(setPrompt)
      .catch((reason: Error) => { if (reason.name !== "AbortError") setError("暂时无法读取这件展品的 AI Prompt。"); });
    return () => controller.abort();
  }, [promptUrl]);

  return (
    <section className="ai-panel" data-testid="prompt-panel">
      <div className="section-heading compact">
        <span className="eyebrow">AI REFERENCE</span>
        <h2>让 AI 读懂这件展品</h2>
        <p>复制独立展品 URL 交给 AI，或直接查看这件展品的制作提示词。</p>
      </div>
      <div className="ai-actions">
        <CopyButton value={independentUrl}>复制展品 URL</CopyButton>
        <a className="button secondary" href={promptUrl} target="_blank" rel="noreferrer">打开 AI.md</a>
      </div>
      <details className="prompt-details">
        <summary>预览并复制 Prompt</summary>
        {error ? <p className="status-error">{error}</p> : prompt ? <><pre>{prompt}</pre><CopyButton value={prompt}>复制完整 Prompt</CopyButton></> : <p className="muted">正在读取 Prompt…</p>}
      </details>
    </section>
  );
}
