import { Link } from "react-router-dom";
import { CatalogStatus } from "../components/catalog/CatalogStatus";
import { SpecimenCard } from "../components/catalog/SpecimenCard";
import { useCatalog } from "../hooks/useCatalog";

const CSS_ANIMATION_CATEGORY = "css-animation";

export function CssAnimationPage() {
  const { items, loading, error } = useCatalog();
  const animationItems = items.filter((item) => item.category === CSS_ANIMATION_CATEGORY);
  const scrollToOpeningExhibit = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("opening-exhibit")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <section className="motion-collection">
      <header className="motion-hero">
        <div className="motion-hero-copy">
          <span className="eyebrow">COLLECTION / CSS ANIMATION</span>
          <p className="motion-issue">动态标本 · 第 01 柜</p>
          <h1>CSS<br /><em>动画展柜</em></h1>
          <p className="motion-intro">收藏那些只用样式就能发生的运动：循环、形变、节奏与错觉。拆开每一帧，也保留它流动时的生命力。</p>
          <button className="button primary" type="button" onClick={scrollToOpeningExhibit}>查看开幕展品 <span aria-hidden="true">↓</span></button>
        </div>

        <div className="motion-study" aria-hidden="true">
          <div className="motion-study-grid" />
          <div className="motion-rings">
            <i /><i /><i /><i /><i />
          </div>
          <span className="motion-study-label">LOOP STUDY<br />CSS / 001</span>
          <span className="motion-study-counter">∞</span>
        </div>
      </header>

      <div className="motion-marquee" aria-hidden="true">
        <div>
          <span>TRANSFORM</span><i>•</i><span>KEYFRAMES</span><i>•</i><span>MASK</span><i>•</i><span>GRADIENT</span><i>•</i><span>LOOP</span><i>•</i>
          <span>TRANSFORM</span><i>•</i><span>KEYFRAMES</span><i>•</i><span>MASK</span><i>•</i><span>GRADIENT</span><i>•</i><span>LOOP</span><i>•</i>
        </div>
      </div>

      <section className="motion-curatorial">
        <span className="eyebrow">CURATORIAL NOTE</span>
        <p>好的 CSS 动画不只是在移动。它用时间组织视觉，用缓动制造重量，也用重复建立一种可以被感知的秩序。</p>
        <dl>
          <div><dt>媒介</dt><dd>HTML / CSS</dd></div>
          <div><dt>原则</dt><dd>独立运行</dd></div>
          <div><dt>动效</dt><dd>尊重减弱动态偏好</dd></div>
        </dl>
      </section>

      <section className="motion-opening" id="opening-exhibit">
        <div className="motion-opening-number" aria-hidden="true">01</div>
        <div className="motion-opening-copy">
          <span className="eyebrow">OPENING EXHIBIT / NOW ON DISPLAY</span>
          <h2>CSS 海浪动画</h2>
          <p className="motion-opening-en">CSS OCEAN WAVE</p>
          <p>同一片海拥有两种光线。开启黑夜模式，清透白昼会平滑沉入深夜月色，波浪始终保持同一段呼吸。</p>
          <Link className="motion-opening-status" to="/items/css-ocean-wave"><i /> 进入展品 →</Link>
        </div>
        <div className="motion-opening-window" aria-label="CSS 海浪动画预告">
          <span className="motion-sun" />
          <div className="motion-wave motion-wave-back" />
          <div className="motion-wave motion-wave-front" />
          <span className="motion-horizon-label">FIRST SPECIMEN<br />NOW ON DISPLAY</span>
        </div>
      </section>

      <CatalogStatus loading={loading} error={error} />
      {!loading && !error && animationItems.length > 0 && (
        <section className="motion-inventory" aria-labelledby="motion-inventory-title">
          <div className="section-heading">
            <span className="eyebrow">ON DISPLAY / {String(animationItems.length).padStart(2, "0")}</span>
            <h2 id="motion-inventory-title">馆藏展品</h2>
            <Link to="/collections">浏览样式布局 →</Link>
          </div>
          <div className="specimen-grid">
            {animationItems.map((item, index) => <SpecimenCard item={item} index={index} key={item.id} />)}
          </div>
        </section>
      )}
    </section>
  );
}
