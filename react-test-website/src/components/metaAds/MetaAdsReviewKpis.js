import { formatMetricValue } from "../../utils/metaAdsAnalytics";

const kpis = [
  { key: "amountSpent", label: "Amount Spent", format: "currency" },
  { key: "results", label: "Total Leads", format: "number" },
  { key: "costPerResult", label: "Cost Per Lead", format: "currency" },
  { key: "conversionRate", label: "Conversion Rate", format: "percent" },
  { key: "costPerConvertedCustomer", label: "Cost Per Converted Customer", format: "currency" },
];

export function MetaAdsReviewKpis({ campaign }) {
  return (
    <section className="analytics-kpi-grid meta-ads-kpi-grid">
      {kpis.map((kpi) => (
        <article className="analytics-kpi-card meta-ads-kpi-card" key={kpi.key}>
          <div className="meta-ads-kpi-icon" aria-hidden="true">
            {kpi.label.slice(0, 1)}
          </div>
          <div>
            <span>{kpi.label}</span>
            <strong>{formatMetricValue(campaign[kpi.key], kpi.format)}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}
