import { buildCampaignSummary } from "../../../utils/metaAdsAnalytics";

export function CampaignSummary({ currentSummary, previousSummary }) {
  const points = buildCampaignSummary(currentSummary, previousSummary);

  return (
    <section className="analytics-breakdown-card meta-campaign-detail-card">
      <div className="analytics-card-header">
        <strong>Campaign summary</strong>
      </div>
      <ul className="meta-ads-insights-list">
        {points.map((point) => (
          <li className="meta-ads-insight" key={point}>
            <span aria-hidden="true" />
            <p>{point}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
