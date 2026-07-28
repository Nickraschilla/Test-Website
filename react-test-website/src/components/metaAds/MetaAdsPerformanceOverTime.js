import { useMemo, useState } from "react";
import {
  buildCampaignTrendSummary,
} from "../../utils/metaAdsCampaignReview";
import {
  buildTrendRows,
  formatMetricValue,
  hasNumber,
} from "../../utils/metaAdsAnalytics";

const metrics = [
  { key: "results", label: "Leads", format: "number", className: "meta-ads-bar-leads" },
  { key: "amountSpent", label: "Amount Spent", format: "currency", className: "meta-ads-bar-spend" },
  { key: "costPerResult", label: "Cost Per Lead", format: "currency", className: "meta-ads-bar-cpl" },
];

export function MetaAdsPerformanceOverTime({ rows }) {
  const [focusedMetricKey, setFocusedMetricKey] = useState("");
  const visibleMetrics = focusedMetricKey
    ? metrics.filter((metric) => metric.key === focusedMetricKey)
    : metrics;
  const trendData = useMemo(() => {
    const rowsByDate = new Map();
    const maxByMetric = {};

    metrics.forEach((metric) => {
      const metricRows = buildTrendRows(rows, "Daily", metric.key);
      const values = metricRows.map((row) => row.value).filter(hasNumber).map(Number);
      maxByMetric[metric.key] = Math.max(1, ...values);

      metricRows.forEach((row) => {
        const group = rowsByDate.get(row.key) || {
          key: row.key,
          label: row.label,
          values: {},
        };
        group.values[metric.key] = row.value;
        rowsByDate.set(row.key, group);
      });
    });

    return {
      rows: [...rowsByDate.values()].sort((first, second) => first.key.localeCompare(second.key)),
      maxByMetric,
    };
  }, [rows]);
  const trendSummary = useMemo(() => buildCampaignTrendSummary(rows), [rows]);
  const hasTrendRows = trendData.rows.some((row) =>
    visibleMetrics.some((metric) => hasNumber(row.values[metric.key]))
  );
  const toggleFocusedMetric = (metricKey) => {
    setFocusedMetricKey((currentKey) => (currentKey === metricKey ? "" : metricKey));
  };

  return (
    <section className="analytics-chart-card meta-ads-chart-card meta-ads-review-chart">
      <div className="analytics-card-header">
        <strong>Performance over time</strong>
        <div className="analytics-chart-legend meta-ads-combined-legend">
          {metrics.map((item) => (
            <button
              key={item.key}
              type="button"
              className={focusedMetricKey === item.key ? "meta-ads-legend-active" : ""}
              aria-pressed={focusedMetricKey === item.key}
              aria-label={`${focusedMetricKey === item.key ? "Show all metrics" : "Focus"} ${item.label}`}
              onClick={() => toggleFocusedMetric(item.key)}
            >
              <i className={item.className} />
              <em>{item.label}</em>
            </button>
          ))}
        </div>
      </div>

      {!hasTrendRows ? (
        <div className="meta-ads-state-card">No daily campaign data is available.</div>
      ) : (
        <div className="analytics-bar-chart meta-ads-review-bars">
          <div className="analytics-y-axis" aria-hidden="true">
            <span>High</span>
            <span>Mid</span>
            <span>0</span>
          </div>
          <div className="analytics-bars">
            {trendData.rows.map((row) => (
              <div className="analytics-bar-group" key={row.key}>
                <div className="analytics-bar-track">
                  {visibleMetrics.map((metric) => {
                    const value = row.values[metric.key];
                    const height = hasNumber(value)
                      ? Math.max(4, (Number(value) / trendData.maxByMetric[metric.key]) * 100)
                      : 0;

                    return (
                      <span
                        className={`analytics-bar meta-ads-combined-bar ${metric.className}${hasNumber(value) ? "" : " meta-ads-bar-empty"}`}
                        data-tooltip={`${row.label} ${metric.label}: ${formatMetricValue(value, metric.format)}`}
                        key={metric.key}
                        style={{ "--bar-height": `${height}%` }}
                        tabIndex="0"
                        aria-label={`${row.label} ${metric.label}: ${formatMetricValue(value, metric.format)}`}
                      />
                    );
                  })}
                </div>
                <span>{row.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="meta-ads-trend-support">
        <div>
          <span>Best lead day</span>
          <strong>{trendSummary.bestLeadDay}</strong>
        </div>
        <div>
          <span>Average leads / day</span>
          <strong>{formatMetricValue(trendSummary.averageLeadsPerDay, "decimal")}</strong>
        </div>
        <div>
          <span>First-half CPL vs second-half CPL</span>
          <strong>{trendSummary.firstHalfVsSecondHalfCpl}</strong>
        </div>
      </div>
    </section>
  );
}
