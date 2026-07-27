import {
  buildMetaAdsSummary,
  filterRowsByCampaign,
  getCampaignIdentity,
} from "../../../utils/metaAdsAnalytics";
import { CampaignComparison } from "./CampaignComparison";
import { CampaignDetailHeader } from "./CampaignDetailHeader";
import { CampaignKpiGrid } from "./CampaignKpiGrid";
import { CampaignSummary } from "./CampaignSummary";
import { CampaignTrendChart } from "./CampaignTrendChart";
import { LeadTrackingSection } from "./LeadTrackingSection";

export function CampaignDetailPanel({
  campaign,
  campaigns,
  selectedCampaignId,
  currentRows,
  previousRows,
  activePeriod,
  onSelectCampaign,
  onBack,
}) {
  if (!campaign) {
    return (
      <section className="analytics-breakdown-card meta-campaign-detail-panel">
        <CampaignDetailHeader
          campaign={null}
          campaigns={campaigns}
          selectedCampaignId={selectedCampaignId}
          activePeriod={activePeriod}
          onSelectCampaign={onSelectCampaign}
          onBack={onBack}
        />
        <p className="meta-ads-empty-copy">Campaign not found.</p>
      </section>
    );
  }

  const campaignCurrentRows = filterRowsByCampaign(currentRows, campaign);
  const campaignPreviousRows = filterRowsByCampaign(previousRows, campaign);
  const currentSummary = buildMetaAdsSummary(campaignCurrentRows);
  const previousSummary = buildMetaAdsSummary(campaignPreviousRows);
  const lastSynced = campaignCurrentRows
    .map((row) => row.lastSynced)
    .filter(Boolean)
    .sort()
    .at(-1);
  const campaignId = campaign.campaignId || getCampaignIdentity(campaign);

  return (
    <section className="meta-campaign-detail-panel">
      <CampaignDetailHeader
        campaign={campaign}
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        activePeriod={activePeriod}
        lastSynced={lastSynced}
        onSelectCampaign={onSelectCampaign}
        onBack={onBack}
      />

      {campaignCurrentRows.length === 0 ? (
        <section className="analytics-breakdown-card meta-ads-state-card">
          This campaign has no data in the selected reporting period.
        </section>
      ) : null}

      <CampaignKpiGrid summary={currentSummary} />
      <CampaignTrendChart rows={campaignCurrentRows} />

      <section className="meta-campaign-detail-grid">
        <CampaignComparison
          currentSummary={currentSummary}
          previousSummary={previousSummary}
        />
        <CampaignSummary
          currentSummary={currentSummary}
          previousSummary={previousSummary}
        />
      </section>

      <LeadTrackingSection
        campaignId={campaignId}
        amountSpent={currentSummary.amountSpent}
      />
    </section>
  );
}
