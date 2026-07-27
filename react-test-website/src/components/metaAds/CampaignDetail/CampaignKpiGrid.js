import { formatMetricValue } from "../../../utils/metaAdsAnalytics";

const CAMPAIGN_KPIS = [
  { key: "amountSpent", label: "Amount spent", format: "currency" },
  { key: "results", label: "Leads", format: "number" },
  { key: "costPerResult", label: "Cost per lead", format: "currency" },
  { key: "impressions", label: "Impressions", format: "number" },
  { key: "reach", label: "Reach", format: "number" },
  { key: "frequency", label: "Frequency", format: "decimal" },
];

export function CampaignKpiGrid({ summary }) {
  return (
    <section className="analytics-kpi-grid meta-campaign-kpi-grid">
      {CAMPAIGN_KPIS.map((metric) => (
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
