import { formatMetricValue } from "../../utils/metaAdsAnalytics";

const metrics = [
  { key: "amountSpent", label: "Spend", format: "currency" },
  { key: "results", label: "Leads", format: "number" },
  { key: "costPerResult", label: "Cost per lead", format: "currency" },
  { key: "reach", label: "Reach", format: "number" },
  { key: "impressions", label: "Impressions", format: "number" },
];

export function MetaAdsSelectedCampaignKpis({ summary }) {
  return (
    <section className="analytics-kpi-grid meta-ads-kpi-grid">
      {metrics.map((metric) => (
        <article className="analytics-kpi-card meta-ads-kpi-card" key={metric.key}>
          <div className="meta-ads-kpi-icon" aria-hidden="true">
            {metric.label.slice(0, 1)}
          </div>
          <div>
            <span>{metric.label}</span>
            <strong>{formatMetricValue(summary[metric.key], metric.format)}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}
