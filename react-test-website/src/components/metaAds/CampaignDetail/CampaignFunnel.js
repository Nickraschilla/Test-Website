import { buildCampaignFunnel } from "../../../utils/metaAdsCampaignReview";
import { formatMetricValue } from "../../../utils/metaAdsAnalytics";

export function CampaignFunnel({ outcome }) {
  const funnel = buildCampaignFunnel(outcome);

  return (
    <section className="analytics-table-card meta-campaign-detail-card">
      <div className="analytics-card-header">
        <strong>Campaign funnel</strong>
      </div>
      <div className="meta-campaign-funnel">
        {funnel.stages.map((stage) => (
          <article key={stage.key}>
            <span>{stage.label}</span>
            <strong>{formatMetricValue(stage.value)}</strong>
          </article>
        ))}
      </div>
      {funnel.rates.length ? (
        <div className="meta-campaign-rate-row">
          {funnel.rates.map((rate) => (
            <span key={rate.key}>
              {rate.label}: <strong>{formatMetricValue(rate.value, "percent")}</strong>
            </span>
          ))}
        </div>
      ) : (
        <p className="meta-ads-empty-copy">More click and lead outcome data will unlock deeper funnel rates.</p>
      )}
    </section>
  );
}
