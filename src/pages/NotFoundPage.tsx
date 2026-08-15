import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <section className="empty-page"><span className="eyebrow">404 / LOST IN THE ARCHIVE</span><h1>这里没有陈列展品</h1><p>地址可能已经失效，或者这件样品尚未入馆。</p><Link className="button primary" to="/">返回首页</Link></section>;
}
