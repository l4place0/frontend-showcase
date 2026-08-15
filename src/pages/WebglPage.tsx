import { CatalogStatus } from "../components/catalog/CatalogStatus";
import { SpecimenCard } from "../components/catalog/SpecimenCard";
import { useCatalog } from "../hooks/useCatalog";

export function WebglPage() {
  const { items, loading, error } = useCatalog();
  const webglItems = items.filter((item) => item.category === "webgl");
  const scrollToInventory = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("webgl-inventory")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <section className="motion-collection webgl-collection">
      <header className="motion-hero">
        <div className="motion-hero-copy">
          <span className="eyebrow">COLLECTION / WEBGL</span>
          <p className="motion-issue">实时图形标本 · 第 01 柜</p>
          <h1>WebGL<br /><em>实验展柜</em></h1>
          <p className="motion-intro">在浏览器里建立空间、光线与时间。收藏三维场景、Shader、粒子系统和沉浸式交互实验。</p>
          <button className="button primary" type="button" onClick={scrollToInventory}>浏览展品 <span aria-hidden="true">↓</span></button>
        </div>

        <div className="motion-study webgl-study" aria-hidden="true">
          <div className="motion-study-grid" />
          <div className="webgl-orb"><i /><i /><i /><b /></div>
          <span className="motion-study-label">SPACE STUDY<br />WEBGL / 001</span>
          <span className="motion-study-counter">3D</span>
        </div>
      </header>

      <div className="motion-marquee" aria-hidden="true"><div>
        <span>GEOMETRY</span><i>•</i><span>SHADER</span><i>•</i><span>LIGHT</span><i>•</i><span>CAMERA</span><i>•</i><span>PARTICLES</span><i>•</i>
        <span>GEOMETRY</span><i>•</i><span>SHADER</span><i>•</i><span>LIGHT</span><i>•</i><span>CAMERA</span><i>•</i><span>PARTICLES</span><i>•</i>
      </div></div>

      <section className="motion-curatorial">
        <span className="eyebrow">CURATORIAL NOTE</span>
        <p>实时图形不是一张图片，而是一套持续运行的空间规则。每一次移动，都让画面重新成立。</p>
        <dl>
          <div><dt>媒介</dt><dd>WebGL</dd></div>
          <div><dt>维度</dt><dd>空间 / 时间</dd></div>
          <div><dt>运行</dt><dd>本地独立</dd></div>
        </dl>
      </section>

      <section className="collection-inventory" id="webgl-inventory" aria-labelledby="webgl-inventory-title">
        <div className="section-heading">
          <span className="eyebrow">ON DISPLAY / {String(webglItems.length).padStart(2, "0")}</span>
          <h2 id="webgl-inventory-title">馆藏展品</h2>
        </div>
        <CatalogStatus loading={loading} error={error} />
        {!loading && !error && <>
          <p className="result-count"><b>{webglItems.length}</b> 件展品</p>
          {webglItems.length ? <div className="specimen-grid">{webglItems.map((item, index) => <SpecimenCard item={item} index={index} key={item.id} />)}</div> : <div className="empty-results"><h2>展柜正在布展</h2><p>新的实时图形实验会陈列在这里。</p></div>}
        </>}
      </section>
    </section>
  );
}
