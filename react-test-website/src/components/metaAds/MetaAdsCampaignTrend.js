import { useMemo, useState } from "react";
import {
  buildTrendRows,
  formatMetricValue,
  hasNumber,
} from "../../utils/metaAdsAnalytics";

const trendMetrics = [
  { key: "results", label: "Leads", format: "number" },
  { key: "amountSpent", label: "Spend", format: "currency" },
  { key: "costPerResult", label: "Cost / lead", format: "currency" },
];

export function MetaAdsCampaignTrend({ rows }) {
  const [metricKey, setMetricKey] = useState("results");
  const metric = trendMetrics.find((item) => item.key === metricKey) || trendMetrics[0];
  const trendRows = useMemo(
    () => buildTrendRows(rows, "Daily", metric.key).filter((row) => hasNumber(row.value)),
    [rows, metric.key]
  );
  const maxValue = Math.max(...trendRows.map((row) => Number(row.value)), 0);

  return (
    <section className="analytics-chart-card meta-ads-analysis-card">
      <div className="analytics-card-header">
        <strong>Daily trend</strong>
        <div className="analytics-mode-toggle meta-ads-trend-toggle" aria-label="Trend metric">
          {trendMetrics.map((item) => (
            <button
              className={item.key === metric.key ? "analytics-mode-active" : ""}
              key={item.key}
              type="button"
              onClick={() => setMetricKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {trendRows.length === 0 ? (
        <div className="meta-ads-analysis-empty">No daily values are available for this campaign.</div>
      ) : (
        <>
          <div className="analytics-bar-chart meta-ads-trend-chart">
            <div className="analytics-y-axis" aria-hidden="true">
              <span>{formatMetricValue(maxValue, metric.format)}</span>
              <span>{formatMetricValue(maxValue / 2, metric.format)}</span>
              <span>0</span>
            </div>
            <div className="analytics-bars">
              {trendRows.map((row) => {
                const height = maxValue > 0 ? Math.max((Number(row.value) / maxValue) * 100, 4) : 4;
                return (
                  <div className="analytics-bar-group" key={row.key}>
                    <div className="analytics-bar-track">
                      <button
                        className="analytics-bar analytics-bar-current meta-ads-trend-bar"
                        data-tooltip={`${row.label}: ${formatMetricValue(row.value, metric.format)}`}
                        style={{ "--bar-height": `${height}%` }}
                        type="button"
                        aria-label={`${row.label} ${metric.label} ${formatMetricValue(row.value, metric.format)}`}
                      />
                    </div>
                    <span>{row.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="analytics-chart-legend">
            <span>
              <i className="analytics-legend-current" />
              <em>{metric.label}</em>
            </span>
          </div>
        </>
      )}
    </section>
  );
}
