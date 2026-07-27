import { useCallback, useEffect, useMemo, useState } from "react";
import {
  filterRowsByCampaign,
  getCampaignIdentity,
} from "../../../utils/metaAdsAnalytics";
import { metaLeadRepository } from "../../../services/metaLeadRepository";
import {
  buildCampaignAssessment,
  buildCampaignComparisonReport,
  buildCampaignFindings,
  buildCampaignOutcome,
  buildCampaignTrendAnalysis,
  buildCampaignVerdict,
  buildLeaderboardRows,
  buildPreviousComparableCampaign,
} from "../../../utils/metaAdsCampaignReview";
import { CampaignAssessment } from "./CampaignAssessment";
import { CampaignBenchmarkTable } from "./CampaignBenchmarkTable";
import { CampaignComparison } from "./CampaignComparison";
import { CampaignDetailHeader } from "./CampaignDetailHeader";
import { CampaignFindings } from "./CampaignFindings";
import { CampaignFunnel } from "./CampaignFunnel";
import { CampaignKpiGrid } from "./CampaignKpiGrid";
import { CampaignLeaderboard } from "./CampaignLeaderboard";
import { CampaignSummary } from "./CampaignSummary";
import { CampaignTrendChart } from "./CampaignTrendChart";
import { LeadTrackingSection } from "./LeadTrackingSection";
import { PreviousCampaignComparison } from "./PreviousCampaignComparison";

export function CampaignDetailPanel({
  campaign,
  campaigns,
  selectedCampaignId,
  allRows,
  currentRows,
  previousRows,
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
  const campaignPreviousRows = useMemo(
    () => (campaign ? filterRowsByCampaign(previousRows, campaign) : []),
    [campaign, previousRows]
  );
  const currentSummary = useMemo(
    () => buildCampaignOutcome(campaignCurrentRows, manualLeads),
    [campaignCurrentRows, manualLeads]
  );
  const previousSummary = useMemo(
    () => buildCampaignOutcome(campaignPreviousRows),
    [campaignPreviousRows]
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
  const trendAnalysis = useMemo(
    () => buildCampaignTrendAnalysis(campaignCurrentRows),
    [campaignCurrentRows]
  );
  const verdict = useMemo(
    () => buildCampaignVerdict(currentSummary, comparisonReport),
    [comparisonReport, currentSummary]
  );
  const findings = useMemo(
    () => buildCampaignFindings({ outcome: currentSummary, comparisonReport, trendAnalysis }),
    [comparisonReport, currentSummary, trendAnalysis]
  );
  const assessment = useMemo(
    () => buildCampaignAssessment({ verdict, outcome: currentSummary, findings }),
    [currentSummary, findings, verdict]
  );
  const leaderboardRows = useMemo(
    () => buildLeaderboardRows(comparisonReport),
    [comparisonReport]
  );
  const previousComparableCampaign = useMemo(
    () => buildPreviousComparableCampaign(currentSummary, comparisonReport),
    [comparisonReport, currentSummary]
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
        verdict={verdict}
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
      <CampaignFindings findings={findings} />
      <CampaignTrendChart rows={campaignCurrentRows} />
      <CampaignFunnel outcome={currentSummary} />

      <section className="meta-campaign-detail-grid">
        <CampaignComparison
          currentSummary={currentSummary}
          previousSummary={previousSummary}
        />
        <CampaignBenchmarkTable comparison={comparisonReport} />
        <PreviousCampaignComparison
          current={currentSummary}
          previousCampaign={previousComparableCampaign}
        />
        <CampaignSummary
          currentSummary={currentSummary}
          previousSummary={previousSummary}
        />
        <CampaignAssessment assessment={assessment} />
      </section>

      <CampaignLeaderboard
        rows={leaderboardRows}
        selectedCampaignId={selectedCampaignId}
        onSelectCampaign={onSelectCampaign}
      />

      <LeadTrackingSection
        campaignId={campaignId}
        amountSpent={currentSummary.amountSpent}
        onLeadsChange={setManualLeads}
      />
    </section>
  );
}
