import { formatDateLabel } from "../../../utils/metaAdsAnalytics";
import { CampaignSelector } from "./CampaignSelector";

export function CampaignDetailHeader({
  campaign,
  campaigns,
  selectedCampaignId,
  activePeriod,
  outcome,
  verdict,
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
          {campaign?.campaignObjective ? <span>{campaign.campaignObjective}</span> : null}
          <span>{activePeriod}</span>
          {outcome?.durationDays ? <span>{outcome.durationDays} day campaign</span> : null}
          {outcome?.startDateKey ? <span>Start {formatDateLabel(outcome.startDateKey)}</span> : null}
          {outcome?.endDateKey ? <span>End {formatDateLabel(outcome.endDateKey)}</span> : null}
          {lastSynced ? <span>Last synced {formatDateLabel(lastSynced)}</span> : null}
        </div>
        {verdict ? (
          <div className={`meta-campaign-verdict meta-campaign-verdict-${verdict.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <strong>{verdict.label}</strong>
            <span>{verdict.rules[0]}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
