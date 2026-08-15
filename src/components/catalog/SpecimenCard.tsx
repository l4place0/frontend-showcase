import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import type { Specimen } from "../../app/types";
import { englishText, text } from "../../app/types";
import { itemAsset } from "../../app/urls";
import { useLearningProgress } from "../../app/learningProgress";

export function SpecimenCard({ item, index = 0 }: { item: Specimen; index?: number }) {
  const thumbnail = item.thumbnail ? itemAsset(item, item.thumbnail) : null;
  const progress = useLearningProgress(item.id);
  const currentProgress = progress?.contentRevision === item.learning?.contentRevision ? progress : null;
  return (
    <article className="specimen-card" style={{ "--card-index": index } as CSSProperties}>
      <Link className="card-hit-area" to={`/items/${encodeURIComponent(item.id)}`} aria-label={`查看展品：${text(item.title, item.id)}`}>
        <span className="card-preview">
          {thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : (
            <span className="preview-fallback" aria-hidden="true"><i />{item.category}</span>
          )}
          <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
        </span>
        <div className="card-copy">
          <span className="eyebrow">{item.category}</span>
          {item.learning && <span className="learning-card-meta">{currentProgress ? currentProgress.completed ? "已完成" : "学习中" : "可学习"} · {item.learning.difficulty || "教程"}{item.learning.durationMinutes ? ` · ${item.learning.durationMinutes} min` : ""}</span>}
          <h3>{text(item.title, item.id)}</h3>
          {englishText(item.title) && <p className="card-en">{englishText(item.title)}</p>}
          {item.description && <p>{text(item.description)}</p>}
          <div className="tag-list" aria-label="标签">
            {(item.tags || []).slice(0, 4).map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
        </div>
      </Link>
    </article>
  );
}
