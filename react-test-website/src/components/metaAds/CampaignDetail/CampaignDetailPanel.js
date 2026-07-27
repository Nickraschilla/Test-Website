import { useCallback, useEffect, useMemo, useState } from "react";
import {
  filterRowsByCampaign,
  getCampaignIdentity,
} from "../../../utils/metaAdsAnalytics";
import { metaLeadRepository } from "../../../services/metaLeadRepository";
import {
  buildCampaignComparisonReport,
  buildCampaignOutcome,
  buildLeaderboardRows,
} from "../../../utils/metaAdsCampaignReview";
import { CampaignBenchmarkTable } from "./CampaignBenchmarkTable";
import { CampaignDetailHeader } from "./CampaignDetailHeader";
import { CampaignKpiGrid } from "./CampaignKpiGrid";
import { CampaignLeaderboard } from "./CampaignLeaderboard";
import { CampaignTimeBreakdown } from "./CampaignTimeBreakdown";
import { CampaignTrendChart } from "./CampaignTrendChart";
import { LeadTrackingSection } from "./LeadTrackingSection";

export function CampaignDetailPanel({
  campaign,
  campaigns,
  selectedCampaignId,
  allRows,
  currentRows,
  activePeriod,
  onSelectCampaign,
  onBack,
}) {
  const [manualLeads, setManualLeads] = useState([]);
  const refreshManualLeads = useCallback(() => {
    setManualLeads(metaLeadRepository.getLeadsByCampaign(selectedCampaignId));
  }, [selectedCampaignId]);

  useEffect(() => {
    refreshManualLeads();
  }, [refreshManualLeads]);

  const campaignCurrentRows = useMemo(
    () => (campaign ? filterRowsByCampaign(currentRows, campaign) : []),
    [campaign, currentRows]
  );
  const currentSummary = useMemo(
    () => buildCampaignOutcome(campaignCurrentRows, manualLeads),
    [campaignCurrentRows, manualLeads]
  );
  const comparisonReport = useMemo(
    () =>
      buildCampaignComparisonReport({
        selectedCampaign: campaign,
        allRows: allRows || [],
        getLeadsByCampaign: (campaignId) => metaLeadRepository.getLeadsByCampaign(campaignId),
      }),
    [allRows, campaign]
  );
  const leaderboardRows = useMemo(
    () => buildLeaderboardRows(comparisonReport),
    [comparisonReport]
  );
  const lastSynced = campaignCurrentRows
    .map((row) => row.lastSynced)
    .filter(Boolean)
    .sort()
    .at(-1);

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

  const campaignId = campaign.campaignId || getCampaignIdentity(campaign);

  return (
    <section className="meta-campaign-detail-panel">
      <CampaignDetailHeader
        campaign={campaign}
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        activePeriod={activePeriod}
        outcome={currentSummary}
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
      <CampaignTimeBreakdown rows={campaignCurrentRows} />

      <section className="meta-campaign-detail-grid">
        <CampaignBenchmarkTable comparison={comparisonReport} />
        <LeadTrackingSection
          campaignId={campaignId}
          amountSpent={currentSummary.amountSpent}
          onLeadsChange={setManualLeads}
        />
      </section>

      <CampaignLeaderboard
        rows={leaderboardRows}
        selectedCampaignId={selectedCampaignId}
        onSelectCampaign={onSelectCampaign}
      />

    </section>
  );
}
