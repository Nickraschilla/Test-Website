import { formatMetricValue, TREND_METRICS } from "../../utils/metaAdsAnalytics";

export function MetaAdsTrendChart({ rows, metricKey }) {
  const metric = TREND_METRICS.find((item) => item.key === metricKey) || TREND_METRICS[0];
  const maxValue = Math.max(1, ...rows.map((row) => Number(row.value || 0)));

  return (
    <section className="analytics-chart-card meta-ads-chart-card">
      <div className="analytics-card-header">
        <strong>Performance Trend</strong>
        <span>{metric.label}</span>
      </div>
      <div className="analytics-card-subheader">
        {rows.length ? "Filtered campaign trend" : "No trend data for this selection"}
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
            const value = Number(row.value || 0);

            return (
              <div className="analytics-bar-group" key={row.key}>
                <div className="analytics-bar-track">
                  <span
                    className="analytics-bar analytics-bar-current"
                    aria-label={`${row.label} ${metric.label}: ${formatMetricValue(row.value, metric.format)}`}
                    data-tooltip={`${row.label}: ${formatMetricValue(row.value, metric.format)}`}
                    tabIndex="0"
                    style={{ "--bar-height": `${Math.max(2, (value / maxValue) * 100)}%` }}
                  />
                </div>
                <span>{row.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="analytics-chart-legend" aria-label="Chart legend">
        <span><i className="analytics-legend-current" /> Current selection</span>
        <em>{metric.label}</em>
      </div>
    </section>
  );
}
