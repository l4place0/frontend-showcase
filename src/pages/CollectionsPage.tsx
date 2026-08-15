import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CatalogStatus } from "../components/catalog/CatalogStatus";
import { Filters } from "../components/catalog/Filters";
import { SpecimenCard } from "../components/catalog/SpecimenCard";
import { useCatalog } from "../hooks/useCatalog";
import { text } from "../app/types";
import { useSlidingIndicator } from "../hooks/useSlidingIndicator";

export function CollectionsPage() {
  const { category } = useParams();
  const decodedCategory = category ? decodeURIComponent(category) : "";
  const { items, loading, error } = useCatalog();
  const styleCategories = ["layout", "visual-style"].filter((name) => items.some((item) => item.category === name));
  const styleItems = items.filter((item) => styleCategories.includes(item.category));
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const categoryTabsRef = useSlidingIndicator<HTMLElement>(decodedCategory);
  const categoryItems = decodedCategory ? styleItems.filter((item) => item.category === decodedCategory) : styleItems;
  const tags = useMemo(() => [...new Set(categoryItems.flatMap((item) => item.tags || []))].sort(), [categoryItems]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return categoryItems.filter((item) => {
      if (tag && !item.tags?.includes(tag)) return false;
      if (!needle) return true;
      return [item.id, text(item.title), text(item.description), item.category, ...(item.tags || []), ...(item.technology || []), item.learning?.difficulty || "", ...(item.learning?.concepts || [])].join(" ").toLocaleLowerCase().includes(needle);
    });
  }, [categoryItems, query, tag]);
  const scrollToInventory = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("style-inventory")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  if (!loading && !error && decodedCategory && !styleCategories.includes(decodedCategory)) return (
    <section className="empty-page"><span className="eyebrow">404 / COLLECTION</span><h1>没有这个样式展柜</h1><Link className="button primary" to="/collections">返回样式布局</Link></section>
  );

  return (
    <section className="motion-collection styles-collection">
      <header className="motion-hero">
        <div className="motion-hero-copy">
          <span className="eyebrow">COLLECTION / STYLES & LAYOUTS</span>
          <p className="motion-issue">视觉与结构标本 · 第 01–60 柜</p>
          <h1>样式<br /><em>{decodedCategory === "layout" ? "布局实验" : decodedCategory === "visual-style" ? "视觉语言" : "布局展柜"}</em></h1>
          <p className="motion-intro">同一份真实内容的六十种呈现方式：视觉语言决定气质，布局结构决定阅读路径。</p>
          <button className="button primary" type="button" onClick={scrollToInventory}>浏览展品 <span aria-hidden="true">↓</span></button>
        </div>

        <div className="motion-study styles-study" aria-hidden="true">
          <div className="motion-study-grid" />
          <div className="styles-study-layout"><i /><i /><i /><i /><i /><i /></div>
          <span className="motion-study-label">SYSTEM STUDY<br />STYLE / LAYOUT</span>
          <span className="motion-study-counter">{styleItems.length || "—"}</span>
        </div>
      </header>

      <div className="motion-marquee" aria-hidden="true"><div>
        <span>TYPOGRAPHY</span><i>•</i><span>COLOR</span><i>•</i><span>GRID</span><i>•</i><span>HIERARCHY</span><i>•</i><span>COMPOSITION</span><i>•</i>
        <span>TYPOGRAPHY</span><i>•</i><span>COLOR</span><i>•</i><span>GRID</span><i>•</i><span>HIERARCHY</span><i>•</i><span>COMPOSITION</span><i>•</i>
      </div></div>

      <section className="motion-curatorial">
        <span className="eyebrow">CURATORIAL NOTE</span>
        <p>样式塑造第一印象，布局安排阅读秩序。把两者拆开观察，也就看见了界面如何表达。</p>
        <dl>
          <div><dt>藏品</dt><dd>{styleItems.length} 件</dd></div>
          <div><dt>方向</dt><dd>视觉 / 布局</dd></div>
          <div><dt>基准</dt><dd>共享真实内容</dd></div>
        </dl>
      </section>

      <section className="collection-inventory" id="style-inventory" aria-labelledby="style-inventory-title">
        <div className="section-heading">
          <span className="eyebrow">ON DISPLAY / {String(categoryItems.length).padStart(2, "0")}</span>
          <h2 id="style-inventory-title">展品目录</h2>
        </div>
        <nav ref={categoryTabsRef} className="category-tabs sliding-indicator" aria-label="分类">
          <Link className={!decodedCategory ? "active" : ""} aria-current={!decodedCategory ? "page" : undefined} to="/collections">全部</Link>
          {styleCategories.map((name) => <Link className={decodedCategory === name ? "active" : ""} aria-current={decodedCategory === name ? "page" : undefined} to={`/collections/${encodeURIComponent(name)}`} key={name}>{name === "layout" ? "布局" : "视觉样式"}</Link>)}
        </nav>
        <CatalogStatus loading={loading} error={error} />
        {!loading && !error && <>
          <Filters query={query} onQuery={setQuery} tags={tags} activeTag={tag} onTag={setTag} />
          <p className="result-count"><b>{filtered.length}</b> 件展品</p>
          {filtered.length ? <div className="specimen-grid">{filtered.map((item, index) => <SpecimenCard item={item} index={index} key={item.id} />)}</div> : <div className="empty-results"><h2>没有匹配项</h2><p>换一个关键词或清除标签试试。</p><button className="text-button" onClick={() => { setQuery(""); setTag(""); }}>清除筛选</button></div>}
        </>}
      </section>
    </section>
  );
}
