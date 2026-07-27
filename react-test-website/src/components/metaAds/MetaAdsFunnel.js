import { buildFunnel, formatMetricValue } from "../../utils/metaAdsAnalytics";

export function MetaAdsFunnel({ summary }) {
  const stages = buildFunnel(summary);
  const maxValue = Math.max(1, ...stages.map((stage) => stage.value));

  return (
    <section className="analytics-breakdown-card meta-ads-funnel-card">
      <div className="analytics-card-header">
        <strong>Lead Funnel</strong>
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
              {stage.label === "Impressions"
                ? "Top of funnel"
                : `${formatMetricValue(stage.rate, "percent")} conversion`}
            </small>
          </div>
        ))}
      </div>
      <div className="meta-ads-funnel-rates">
        <span>CTR {formatMetricValue(summary.clickThroughRate, "percent")}</span>
        <span>LP CVR {formatMetricValue(summary.landingPageConversionRate, "percent")}</span>
        <span>Lead CVR {formatMetricValue(summary.leadConversionRate, "percent")}</span>
      </div>
    </section>
  );
}
