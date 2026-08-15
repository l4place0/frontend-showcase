import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCatalog } from "../../hooks/useCatalog";
import { useSlidingIndicator } from "../../hooks/useSlidingIndicator";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { items } = useCatalog();
  const itemId = location.pathname.startsWith("/items/") ? decodeURIComponent(location.pathname.slice("/items/".length)) : "";
  const itemCategory = itemId ? items.find((item) => item.id === itemId)?.category : undefined;
  const section = location.pathname === "/"
    ? "home"
    : location.pathname === "/collections/css-animation" || itemCategory === "css-animation"
      ? "css-animation"
      : location.pathname === "/collections/webgl" || itemCategory === "webgl"
        ? "webgl"
        : location.pathname === "/collections" || location.pathname === "/collections/layout" || location.pathname === "/collections/visual-style" || itemCategory === "layout" || itemCategory === "visual-style"
          ? "styles"
          : "";
  const navRef = useSlidingIndicator<HTMLElement>(section);
  const navProps = (name: string) => ({
    className: section === name ? "active" : undefined,
    "aria-current": section === name ? ("page" as const) : undefined,
    onClick: () => setOpen(false),
  });
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" onClick={() => setOpen(false)} aria-label="前端样品博物馆首页">
          <span className="brand-mark" aria-hidden="true">F·S</span>
          <span>Frontend<br />Specimens</span>
        </Link>
        <button className="nav-toggle" type="button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          {open ? "关闭" : "菜单"}
        </button>
        <nav ref={navRef} id="site-nav" className={open ? "site-nav sliding-indicator is-open" : "site-nav sliding-indicator"} aria-label="主要导航">
          <Link to="/" {...navProps("home")}>首页</Link>
          <Link to="/collections" {...navProps("styles")}>样式布局</Link>
          <Link to="/collections/css-animation" {...navProps("css-animation")}>CSS 动画</Link>
          <Link to="/collections/webgl" {...navProps("webgl")}>WebGL</Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <span>Frontend Specimen Museum</span>
      </footer>
    </div>
  );
}
