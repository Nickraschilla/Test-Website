import { formatDateLabel } from "../../../utils/metaAdsAnalytics";
import { CampaignSelector } from "./CampaignSelector";

export function CampaignDetailHeader({
  campaign,
  campaigns,
  selectedCampaignId,
  activePeriod,
  lastSynced,
  onSelectCampaign,
  onBack,
}) {
  return (
    <section className="meta-campaign-detail-header">
      <div className="meta-campaign-detail-actions">
        <button type="button" onClick={onBack}>
          Back to campaigns
        </button>
        <CampaignSelector
          campaigns={campaigns}
          selectedCampaignId={selectedCampaignId}
          onChange={onSelectCampaign}
        />
      </div>
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
