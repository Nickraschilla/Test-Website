import { formatDateLabel } from "../../../utils/metaAdsAnalytics";

export function CampaignDetailHeader({
  campaign,
  activePeriod,
  lastSynced,
  onBack,
}) {
  return (
    <section className="meta-campaign-detail-header">
      <button type="button" onClick={onBack}>
        Back to campaigns
      </button>
      <div>
        <h2>{campaign?.campaignName || "Campaign not found"}</h2>
        <div className="meta-campaign-detail-meta">
          <span className={`meta-ads-status-badge ${/active/i.test(campaign?.campaignDelivery || "") ? "is-active" : "is-muted"}`}>
            {campaign?.campaignDelivery || "—"}
          </span>
          <span>{activePeriod}</span>
          {lastSynced ? <span>Last synced {formatDateLabel(lastSynced)}</span> : null}
        </div>
      </div>
    </section>
  );
}
