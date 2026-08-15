interface FiltersProps {
  query: string;
  onQuery: (value: string) => void;
  tags: string[];
  activeTag: string;
  onTag: (value: string) => void;
}

export function Filters({ query, onQuery, tags, activeTag, onTag }: FiltersProps) {
  return (
    <section className="filters" aria-label="筛选展品">
      <label className="search-field">
        <span>搜索</span>
        <input type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="名称、描述、技术或标签" />
      </label>
      {tags.length > 0 && (
        <div className="tag-filter" aria-label="按标签筛选">
          <button className={!activeTag ? "active" : ""} type="button" onClick={() => onTag("")}>全部</button>
          {tags.map((tag) => <button className={activeTag === tag ? "active" : ""} type="button" key={tag} onClick={() => onTag(tag)}>#{tag}</button>)}
        </div>
      )}
    </section>
  );
}
