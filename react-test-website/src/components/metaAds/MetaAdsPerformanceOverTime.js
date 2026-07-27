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
  { key: "results", label: "Leads", format: "number" },
  { key: "amountSpent", label: "Amount Spent", format: "currency" },
  { key: "costPerResult", label: "Cost Per Lead", format: "currency" },
];

export function MetaAdsPerformanceOverTime({ rows }) {
  const [metricKey, setMetricKey] = useState("results");
  const metric = metrics.find((item) => item.key === metricKey) || metrics[0];
  const trendRows = useMemo(
    () => buildTrendRows(rows, "Daily", metric.key).filter((row) => hasNumber(row.value)),
    [metric.key, rows]
  );
  const trendSummary = useMemo(() => buildCampaignTrendSummary(rows), [rows]);
  const maxValue = Math.max(1, ...trendRows.map((row) => Number(row.value)));

  return (
    <section className="analytics-chart-card meta-ads-chart-card meta-ads-review-chart">
      <div className="analytics-card-header">
        <strong>Performance over time</strong>
        <div className="analytics-mode-toggle meta-ads-trend-toggle" aria-label="Performance metric">
          {metrics.map((item) => (
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
        <div className="meta-ads-state-card">No daily campaign data is available.</div>
      ) : (
        <div className="analytics-bar-chart meta-ads-review-bars">
          <div className="analytics-y-axis" aria-hidden="true">
            <span>{formatMetricValue(maxValue, metric.format)}</span>
            <span>{formatMetricValue(maxValue / 2, metric.format)}</span>
            <span>0</span>
          </div>
          <div className="analytics-bars">
            {trendRows.map((row) => (
              <div className="analytics-bar-group" key={row.key}>
                <div className="analytics-bar-track">
                  <span
                    className="analytics-bar analytics-bar-current"
                    data-tooltip={`${row.label}: ${formatMetricValue(row.value, metric.format)}`}
                    style={{ "--bar-height": `${Math.max(4, (Number(row.value) / maxValue) * 100)}%` }}
                    tabIndex="0"
                    aria-label={`${row.label} ${metric.label}: ${formatMetricValue(row.value, metric.format)}`}
                  />
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
