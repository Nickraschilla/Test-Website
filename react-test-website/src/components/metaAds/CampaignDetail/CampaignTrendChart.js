import { useState } from "react";
import { buildTrendRows, formatMetricValue } from "../../../utils/metaAdsAnalytics";

const METRICS = [
  { key: "results", label: "Leads", format: "number" },
  { key: "amountSpent", label: "Amount spent", format: "currency" },
  { key: "costPerResult", label: "Cost per lead", format: "currency" },
  { key: "reach", label: "Reach", format: "number" },
];

const GROUPINGS = ["Daily", "Monthly", "Yearly"];

export function CampaignTrendChart({ rows }) {
  const [metricKey, setMetricKey] = useState("results");
  const [grouping, setGrouping] = useState("Monthly");
  const metric = METRICS.find((item) => item.key === metricKey) || METRICS[0];
  const trendRows = buildTrendRows(rows, grouping, metric.key);
  const numericValues = trendRows
    .map((row) => row.value)
    .filter((value) => Number.isFinite(Number(value)));
  const maxValue = Math.max(1, ...numericValues.map(Number));

  return (
    <section className="analytics-chart-card meta-campaign-detail-card">
      <div className="analytics-card-header">
        <strong>Campaign performance trend</strong>
        <div className="meta-campaign-trend-controls">
          <div className="analytics-mode-toggle">
            {METRICS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={metric.key === item.key ? "active" : ""}
                onClick={() => setMetricKey(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="analytics-mode-toggle">
            {GROUPINGS.map((item) => (
              <button
                key={item}
                type="button"
                className={grouping === item ? "active" : ""}
                onClick={() => setGrouping(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      {trendRows.length === 0 ? (
        <div className="analytics-card-subheader">No daily campaign data for this period.</div>
      ) : (
        <div className="analytics-bar-chart">
          <div className="analytics-y-axis">
            <span>{formatMetricValue(maxValue, metric.format)}</span>
            <span>{formatMetricValue(maxValue * 0.5, metric.format)}</span>
            <span>0</span>
          </div>
          <div className="analytics-bars">
            {trendRows.map((row) => {
              const hasValue = Number.isFinite(Number(row.value));
              const value = hasValue ? Number(row.value) : 0;

              return (
                <div className="analytics-bar-group" key={row.key}>
                  <div className="analytics-bar-track">
                    <span
                      className={`analytics-bar analytics-bar-current${hasValue ? "" : " meta-ads-bar-empty"}`}
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
      )}
    </section>
  );
}
