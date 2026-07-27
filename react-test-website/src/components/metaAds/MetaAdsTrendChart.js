import { formatMetricValue, TREND_METRICS } from "../../utils/metaAdsAnalytics";

function SingleTrendChart({ rows, metric }) {
  const numericValues = rows
    .map((row) => row.value)
    .filter((value) => Number.isFinite(Number(value)));
  const maxValue = Math.max(1, ...numericValues.map(Number));

  return (
    <article className="analytics-chart-card meta-ads-chart-card">
      <div className="analytics-card-header">
        <strong>{metric.label} over time</strong>
      </div>
      <div className="analytics-card-subheader">
        {rows.length ? "Filtered daily campaign data" : "No trend data for this selection"}
      </div>
      <div className="analytics-bar-chart">
        <div className="analytics-y-axis">
          <span>{formatMetricValue(maxValue, metric.format)}</span>
          <span>{formatMetricValue(maxValue * 0.66, metric.format)}</span>
          <span>{formatMetricValue(maxValue * 0.33, metric.format)}</span>
          <span>0</span>
        </div>
        <div className="analytics-bars">
          {rows.map((row) => {
            const hasValue = Number.isFinite(Number(row.value));
            const value = hasValue ? Number(row.value) : 0;

            return (
              <div className="analytics-bar-group" key={row.key}>
                <div className="analytics-bar-track">
                  <span
                    className={`analytics-bar analytics-bar-current${hasValue ? "" : " meta-ads-bar-empty"}`}
                    aria-label={`${row.label} ${metric.label}: ${formatMetricValue(row.value, metric.format)}`}
                    data-tooltip={`${row.label}: ${formatMetricValue(row.value, metric.format)}`}
                    tabIndex="0"
                    style={{ "--bar-height": hasValue ? `${Math.max(2, (value / maxValue) * 100)}%` : "0%" }}
                  />
                </div>
                <span>{row.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export function MetaAdsTrendChart({ rowsByMetric, grouping }) {
  return (
    <section className="meta-ads-trend-section">
      <div className="analytics-card-header meta-ads-section-header">
        <strong>Performance charts</strong>
        <span>{grouping}</span>
      </div>
      <div className="meta-ads-trend-grid">
        {TREND_METRICS.map((metric) => (
          <SingleTrendChart
            key={metric.key}
            metric={metric}
            rows={rowsByMetric[metric.key] || []}
          />
        ))}
      </div>
    </section>
  );
}
