import { useEffect, useMemo, useState } from "react";
import { MetaAdsCampaignComparison } from "../components/metaAds/MetaAdsCampaignComparison";
import { MetaAdsFilters } from "../components/metaAds/MetaAdsFilters";
import { MetaAdsKeyTakeaways } from "../components/metaAds/MetaAdsKeyTakeaways";
import { MetaAdsLeadPipeline } from "../components/metaAds/MetaAdsLeadPipeline";
import { MetaAdsPerformanceOverTime } from "../components/metaAds/MetaAdsPerformanceOverTime";
import { MetaAdsReviewKpis } from "../components/metaAds/MetaAdsReviewKpis";
import { useMetaAdsData } from "../hooks/useMetaAdsData";
import { useMetaAdsManualLeads } from "../hooks/useMetaAdsManualLeads";
import {
  describeDateWindow,
  parseDate,
} from "../utils/metaAdsAnalytics";
import {
  buildCampaignComparisonRows,
  buildCampaignOptions,
  buildCampaignReviewMetrics,
  buildCampaignTrendSummary,
  buildKeyTakeaways,
  filterRowsByCampaignId,
  getDefaultCampaignId,
  getMetaCampaignId,
  sortCampaignComparisonRows,
} from "../utils/metaAdsCampaignReview";

const DEFAULT_SORT = {
  key: "latestDate",
  direction: "desc",
};

const describeCampaignRun = (campaignRows) => {
  const dates = campaignRows
    .flatMap((row) => [row.reportingStarts || row.date, row.reportingEnds])
    .map(parseDate)
    .filter(Boolean)
    .sort((first, second) => first - second);

  if (dates.length === 0) return "No reporting dates";

  return describeDateWindow({
    startDate: dates[0],
    endDate: dates.at(-1),
  });
};

export function MetaAdsReportingPage() {
  const { rows, loading, refreshing, error, usingFallback } = useMetaAdsData();
  const { leads, createLead, updateLead, deleteLead } = useMetaAdsManualLeads();
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [comparisonSort, setComparisonSort] = useState(DEFAULT_SORT);

  const campaignOptions = useMemo(() => buildCampaignOptions(rows), [rows]);

  useEffect(() => {
    if (rows.length === 0) return;
    const selectedExists = campaignOptions.some((campaign) => campaign.id === selectedCampaignId);
    if (!selectedExists) {
      setSelectedCampaignId(getDefaultCampaignId(rows));
    }
  }, [campaignOptions, rows, selectedCampaignId]);

  const leadsByCampaign = useMemo(
    () =>
      leads.reduce((map, lead) => {
        const campaignLeads = map[lead.campaignId] || [];
        campaignLeads.push(lead);
        map[lead.campaignId] = campaignLeads;
        return map;
      }, {}),
    [leads]
  );

  const comparison = useMemo(
    () => buildCampaignComparisonRows(rows, selectedCampaignId, leadsByCampaign),
    [leadsByCampaign, rows, selectedCampaignId]
  );
  const comparisonRows = useMemo(
    () => sortCampaignComparisonRows(comparison.rows, comparisonSort.key, comparisonSort.direction),
    [comparison.rows, comparisonSort]
  );
  const selectedCampaign = useMemo(
    () =>
      comparison.rows.find((campaign) => getMetaCampaignId(campaign) === selectedCampaignId) ||
      comparison.selectedCampaign,
    [comparison.rows, comparison.selectedCampaign, selectedCampaignId]
  );
  const selectedRows = useMemo(
    () => filterRowsByCampaignId(rows, getMetaCampaignId(selectedCampaign)),
    [rows, selectedCampaign]
  );
  const activePeriod = useMemo(() => describeCampaignRun(selectedRows), [selectedRows]);
  const selectedManualLeads = useMemo(
    () => leadsByCampaign[getMetaCampaignId(selectedCampaign)] || [],
    [leadsByCampaign, selectedCampaign]
  );
  const selectedReview = useMemo(
    () => buildCampaignReviewMetrics({ ...selectedCampaign, rows: selectedRows }, selectedManualLeads),
    [selectedCampaign, selectedManualLeads, selectedRows]
  );
  const trendSummary = useMemo(() => buildCampaignTrendSummary(selectedRows), [selectedRows]);
  const takeaways = useMemo(
    () =>
      buildKeyTakeaways({
        campaign: selectedReview,
        comparableCampaigns: comparison.comparableRows,
        trendSummary,
      }),
    [comparison.comparableRows, selectedReview, trendSummary]
  );

  const handleCampaignSort = (key) => {
    setComparisonSort((currentSort) => ({
      key,
      direction: currentSort.key === key && currentSort.direction === "desc" ? "asc" : "desc",
    }));
  };

  const resetFilters = () => {
    setSelectedCampaignId(getDefaultCampaignId(rows));
    setComparisonSort(DEFAULT_SORT);
  };

  return (
    <main className="analytics-shell meta-ads-shell">
      <MetaAdsFilters
        campaigns={campaignOptions}
        selectedCampaignId={selectedCampaignId}
        activePeriod={activePeriod}
        onSelectCampaign={setSelectedCampaignId}
        onReset={resetFilters}
      />

      {refreshing ? (
        <div className="dashboard-refreshing-pill meta-ads-refreshing" role="status" aria-live="polite">
          <span aria-hidden="true" />
          Refreshing...
        </div>
      ) : null}

      {error ? (
        <div className="dashboard-warning meta-ads-warning" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <section className="analytics-breakdown-card meta-ads-state-card" role="status" aria-live="polite">
          Loading Meta Ads data...
        </section>
      ) : null}

      {!loading && rows.length === 0 ? (
        <section className="analytics-breakdown-card meta-ads-state-card">
          No campaigns available from the published Meta Ads sheet yet.
        </section>
      ) : null}

      {!loading && usingFallback ? (
        <section className="analytics-breakdown-card meta-ads-state-card">
          Development fallback data is currently being displayed.
        </section>
      ) : null}

      {!loading && rows.length > 0 && !selectedCampaign ? (
        <section className="analytics-breakdown-card meta-ads-state-card">
          Selected campaign not found.
        </section>
      ) : null}

      {!loading && rows.length > 0 && selectedCampaign ? (
        <>
          <MetaAdsReviewKpis campaign={selectedReview} />
          <MetaAdsPerformanceOverTime rows={selectedRows} />
          <MetaAdsCampaignComparison
            rows={comparisonRows}
            sort={comparisonSort}
            comparisonLimited={comparison.comparisonLimited}
            onSort={handleCampaignSort}
            onSelectCampaign={setSelectedCampaignId}
          />
          <MetaAdsLeadPipeline
            campaignId={getMetaCampaignId(selectedCampaign)}
            leads={leads}
            campaignSpend={selectedReview.amountSpent || 0}
            onCreateLead={createLead}
            onUpdateLead={updateLead}
            onDeleteLead={deleteLead}
          />
          <MetaAdsKeyTakeaways takeaways={takeaways} />
        </>
      ) : null}
    </main>
  );
}
