import { useLayoutEffect } from "react";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { CatalogProvider } from "../hooks/useCatalog";
import { AppShell } from "../components/catalog/AppShell";
import { HomePage } from "../pages/HomePage";
import { CollectionsPage } from "../pages/CollectionsPage";
import { ItemPage } from "../pages/ItemPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { CssAnimationPage } from "../pages/CssAnimationPage";
import { WebglPage } from "../pages/WebglPage";

function RoutedContent() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className="route-view" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/css-animation" element={<CssAnimationPage />} />
        <Route path="/collections/webgl" element={<WebglPage />} />
        <Route path="/collections/:category" element={<CollectionsPage />} />
        <Route path="/items/:id" element={<ItemPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <CatalogProvider>
        <AppShell>
          <RoutedContent />
        </AppShell>
      </CatalogProvider>
    </HashRouter>
  );
}
