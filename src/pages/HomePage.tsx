import { Link } from "react-router-dom";
import { CatalogStatus } from "../components/catalog/CatalogStatus";
import { TypewriterQuote } from "../components/catalog/TypewriterQuote";
import { useCatalog } from "../hooks/useCatalog";

export function HomePage() {
  const { items, loading, error } = useCatalog();
  const scrollToCollections = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("collections")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };
  const collections = [
    {
      id: "style-layout",
      title: "样式布局",
      en: "Styles & Layouts",
      description: "用同一份真实内容观察视觉语言与信息结构：30种风格，30种布局。",
      href: "/collections",
      count: items.filter((item) => item.category === "visual-style" || item.category === "layout").length,
    },
    {
      id: "css-animation",
      title: "CSS 动画",
      en: "CSS Animation",
      description: "收藏只用样式发生的运动，拆解循环、形变、节奏、缓动与视觉错觉。",
      href: "/collections/css-animation",
      count: items.filter((item) => item.category === "css-animation").length,
    },
    {
      id: "webgl",
      title: "WebGL",
      en: "Realtime Graphics",
      description: "面向实时图形、三维空间、Shader与沉浸式交互的浏览器实验。",
      href: "/collections/webgl",
      count: items.filter((item) => item.category === "webgl").length,
    },
  ];
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">FRONTEND SPECIMEN MUSEUM / 01</span>
          <h1>收藏每一次<br /><em>前端灵感</em></h1>
          <p>一个让实验独立运行、让灵感可以复用，也让 AI 能够直接理解与仿制的前端样品博物馆。</p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={scrollToCollections}>查看分类</button>
          </div>
        </div>
        <div className="hero-object" aria-hidden="true">
          <div className="orbit orbit-a"><i /></div><div className="orbit orbit-b"><i /></div>
          <span className="object-label">{items.length || "—"}<small>SPECIMENS</small></span>
        </div>
      </section>

      <CatalogStatus loading={loading} error={error} />
      {!loading && !error && (
        <section className="collection-overview" id="collections" aria-labelledby="collection-overview-title">
          <div className="section-heading">
            <span className="eyebrow">COLLECTIONS / 03</span>
            <h2 id="collection-overview-title">选择探索方向</h2>
            <span className="overview-total">{items.length} 件馆藏</span>
          </div>
          <div className="overview-grid">
            {collections.map((collection, index) => (
              <Link className="overview-card" to={collection.href} key={collection.id}>
                <span className="overview-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="overview-count"><b>{collection.count}</b> SPECIMENS</span>
                <h3>{collection.title}</h3>
                <p className="overview-en">{collection.en}</p>
                <p>{collection.description}</p>
                <span className="overview-enter">进入展柜 <i aria-hidden="true">↗</i></span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="manifesto">
        <span className="eyebrow">DESIGNED FOR TWO AUDIENCES</span>
        <TypewriterQuote />
        <p>每件展品都拥有独立运行环境和结构化参考资料。你可以观察、调试、复制链接，然后把它直接交给 AI。</p>
      </section>
    </>
  );
}
