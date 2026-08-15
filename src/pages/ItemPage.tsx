import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { text, englishText } from "../app/types";
import { itemRoot } from "../app/urls";
import { ControlPanel } from "../components/controls/ControlPanel";
import { CatalogStatus } from "../components/catalog/CatalogStatus";
import { LearningWorkspace } from "../components/learning/LearningWorkspace";
import { AiReferencePanel } from "../components/viewer/AiReferencePanel";
import { SpecimenViewer } from "../components/viewer/SpecimenViewer";
import { useCatalog } from "../hooks/useCatalog";
import { usePersistentControls } from "../hooks/usePersistentControls";

function LoadedItem({ id }: { id: string }) {
  const { items } = useCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const item = items.find((candidate) => candidate.id === id);
  const controls = item?.controls || [];
  const { values, update, replace, reset } = usePersistentControls(id, controls);
  const index = item ? items.indexOf(item) : -1;
  const previous = index > 0 ? items[index - 1] : items.at(-1);
  const next = index >= 0 && index < items.length - 1 ? items[index + 1] : items[0];

  useEffect(() => {
    if (!item) return;
    document.title = `${text(item.title, item.id)} · Frontend Specimens`;
    return () => { document.title = "Frontend Specimen Museum"; };
  }, [item]);

  if (!item) return <section className="empty-page"><span className="eyebrow">404 / SPECIMEN</span><h1>展品不在馆藏中</h1><Link className="button primary" to="/collections">回到展柜</Link></section>;
  const independent = itemRoot(item.id, item.url);
  const hasLearning = Boolean(item.learning?.resource);
  const learning = hasLearning && searchParams.get("view") === "learn";
  const toggleLearning = () => {
    const nextParams = new URLSearchParams(searchParams);
    if (learning) nextParams.delete("view");
    else nextParams.set("view", "learn");
    setSearchParams(nextParams);
  };
  return (
    <article className="item-page">
      <header className="item-heading">
        <div>
          <Link className="back-link" to={`/collections/${encodeURIComponent(item.category)}`}>← {item.category}</Link>
          <span className="eyebrow">SPECIMEN / {String(index + 1).padStart(2, "0")}</span>
          <h1>{text(item.title, item.id)}</h1>
          {englishText(item.title) && <p className="item-en">{englishText(item.title)}</p>}
        </div>
        <div className="item-summary">
          <p>{text(item.description, "一件独立运行的前端样品。")}</p>
          <div className="tag-list">{(item.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}</div>
          <div className="item-actions">
            {hasLearning && <button className={`button ${learning ? "primary" : "secondary"}`} type="button" onClick={toggleLearning} aria-pressed={learning} data-testid="learning-mode-toggle">{learning ? "返回观看" : "学习这件展品"}</button>}
            <a className="button primary" href={independent} target="_blank" rel="noreferrer">独立打开 ↗</a>
          </div>
        </div>
      </header>
      {hasLearning ? (
        <LearningWorkspace item={item} values={values} learning={learning} onChange={update} onReplaceValues={replace} onReset={reset} />
      ) : (
        <div className="exhibit-workspace">
          <SpecimenViewer item={item} values={values} onReset={reset} />
          <aside className="inspector">
            <div className="inspector-heading"><span className="eyebrow">CONTROLS</span><h2>展品参数</h2></div>
            <ControlPanel controls={controls} values={values} onChange={update} onReset={reset} />
            <dl className="metadata">
              <div><dt>分类</dt><dd>{item.category}</dd></div>
              {item.renderer && <div><dt>Renderer</dt><dd>{item.renderer}</dd></div>}
              {!!item.technology?.length && <div><dt>技术</dt><dd>{item.technology.join(" · ")}</dd></div>}
              <div><dt>协议</dt><dd>v{item.specimenVersion || 1}</dd></div>
            </dl>
          </aside>
        </div>
      )}
      <AiReferencePanel item={item} />
      <nav className="item-pagination" aria-label="相邻展品">
        {previous && <Link to={`/items/${encodeURIComponent(previous.id)}`}><span>← PREVIOUS</span><b>{text(previous.title, previous.id)}</b></Link>}
        {next && <Link to={`/items/${encodeURIComponent(next.id)}`}><span>NEXT →</span><b>{text(next.title, next.id)}</b></Link>}
      </nav>
    </article>
  );
}

export function ItemPage() {
  const { id = "" } = useParams();
  const { loading, error } = useCatalog();
  if (loading || error) return <CatalogStatus loading={loading} error={error} />;
  return <LoadedItem id={decodeURIComponent(id)} />;
}
