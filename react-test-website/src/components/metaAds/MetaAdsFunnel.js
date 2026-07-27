import { formatMetricValue } from "../../utils/metaAdsAnalytics";

export function MetaAdsFunnel({ summary }) {
  const stages = [
    { label: "Reach", value: summary.reach },
    { label: "Impressions", value: summary.impressions },
    { label: "Leads", value: summary.results },
  ];
  const maxValue = Math.max(1, ...stages.map((stage) => stage.value));

  return (
    <section className="analytics-breakdown-card meta-ads-funnel-card">
      <div className="analytics-card-header">
        <strong>Lead Summary</strong>
      </div>
      <div className="meta-ads-funnel">
        {stages.map((stage) => (
          <div className="meta-ads-funnel-stage" key={stage.label}>
            <div>
              <span>{stage.label}</span>
              <strong>{formatMetricValue(stage.value)}</strong>
            </div>
            <div className="meta-ads-funnel-track" aria-hidden="true">
              <span style={{ "--funnel-width": `${Math.max(4, (stage.value / maxValue) * 100)}%` }} />
            </div>
            <small>
              {stage.label === "Leads"
                ? `${formatMetricValue(summary.resultRateByReach, "percent")} of reach`
                : "Reported total"}
            </small>
          </div>
        ))}
      </div>
      <div className="meta-ads-funnel-rates">
        <span>Cost / Lead {formatMetricValue(summary.costPerResult, "currency")}</span>
        <span>Leads / Reach {formatMetricValue(summary.resultRateByReach, "percent")}</span>
        <span>Leads / Impressions {formatMetricValue(summary.resultRateByImpressions, "percent")}</span>
      </div>
    </section>
  );
}
