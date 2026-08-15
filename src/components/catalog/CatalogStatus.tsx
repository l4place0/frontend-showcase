export function CatalogStatus({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <div className="status-card" role="status"><span className="spinner" />正在整理展柜…</div>;
  if (error) return <div className="status-card status-error" role="alert">{error}<br /><small>请确认已经生成 /specimens.json。</small></div>;
  return null;
}
