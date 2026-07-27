export function MetaAdsInsights({ insights }) {
  return (
    <section className="analytics-breakdown-card meta-ads-insights-card">
      <div className="analytics-card-header">
        <strong>Automated Insights</strong>
      </div>
      {insights.length ? (
        <div className="meta-ads-insights-list">
          {insights.map((insight) => (
            <article className="meta-ads-insight" key={insight}>
              <span aria-hidden="true">i</span>
              <p>{insight}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="meta-ads-empty-copy">No supported insights for this selection.</p>
      )}
    </section>
  );
}
