import { useEffect, useMemo, useState } from "react";
import { MetaAdsCampaignComparison } from "../components/metaAds/MetaAdsCampaignComparison";
import { MetaAdsCampaignScore } from "../components/metaAds/MetaAdsCampaignScore";
import { MetaAdsFilters } from "../components/metaAds/MetaAdsFilters";
import { MetaAdsKeyTakeaways } from "../components/metaAds/MetaAdsKeyTakeaways";
import { MetaAdsLeadPipeline } from "../components/metaAds/MetaAdsLeadPipeline";
import { MetaAdsPerformanceOverTime } from "../components/metaAds/MetaAdsPerformanceOverTime";
import { MetaAdsReviewKpis } from "../components/metaAds/MetaAdsReviewKpis";
import { useMetaAdsData } from "../hooks/useMetaAdsData";
import { useMetaAdsManualLeads } from "../hooks/useMetaAdsManualLeads";
import {
  buildDateWindows,
  describeDateWindow,
  filterMetaAdsRows,
} from "../utils/metaAdsAnalytics";
import {
  buildCampaignComparisonRows,
  buildCampaignOptions,
  buildCampaignReviewMetrics,
  buildCampaignTrendSummary,
  buildKeyTakeaways,
  calculateCampaignScore,
  filterRowsByCampaignId,
  getDefaultCampaignId,
  getMetaCampaignId,
  sortCampaignComparisonRows,
} from "../utils/metaAdsCampaignReview";

const DEFAULT_FILTERS = {
  dateRange: "30",
  campaign: "all",
  delivery: "all",
  resultIndicator: "all",
  customStart: "",
  customEnd: "",
};

const DEFAULT_SORT = {
  key: "latestDate",
  direction: "desc",
};

export function MetaAdsReportingPage() {
  const { rows, loading, refreshing, error, usingFallback } = useMetaAdsData();
  const { leads, createLead, updateLead, deleteLead } = useMetaAdsManualLeads();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [comparisonSort, setComparisonSort] = useState(DEFAULT_SORT);

  const windows = useMemo(
    () =>
      buildDateWindows(filters.dateRange, rows, {
        start: filters.customStart,
        end: filters.customEnd,
      }),
    [filters.customEnd, filters.customStart, filters.dateRange, rows]
  );
  const activePeriod = useMemo(() => describeDateWindow(windows.current), [windows]);
  const periodRows = useMemo(
    () => filterMetaAdsRows(rows, filters, windows.current),
    [filters, rows, windows]
  );
  const campaignOptions = useMemo(() => buildCampaignOptions(periodRows), [periodRows]);

  useEffect(() => {
    if (periodRows.length === 0) return;
    const selectedExists = campaignOptions.some((campaign) => campaign.id === selectedCampaignId);
    if (!selectedExists) {
      setSelectedCampaignId(getDefaultCampaignId(periodRows));
    }
  }, [campaignOptions, periodRows, selectedCampaignId]);

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
    () => buildCampaignComparisonRows(periodRows, selectedCampaignId, leadsByCampaign),
    [leadsByCampaign, periodRows, selectedCampaignId]
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
    () => filterRowsByCampaignId(periodRows, getMetaCampaignId(selectedCampaign)),
    [periodRows, selectedCampaign]
  );
  const selectedManualLeads = useMemo(
    () => leadsByCampaign[getMetaCampaignId(selectedCampaign)] || [],
    [leadsByCampaign, selectedCampaign]
  );
  const selectedReview = useMemo(
    () => buildCampaignReviewMetrics({ ...selectedCampaign, rows: selectedRows }, selectedManualLeads),
    [selectedCampaign, selectedManualLeads, selectedRows]
  );
  const campaignScore = useMemo(
    () => calculateCampaignScore(selectedReview, comparison.comparableRows),
    [comparison.comparableRows, selectedReview]
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
    setFilters(DEFAULT_FILTERS);
    setComparisonSort(DEFAULT_SORT);
  };

  return (
    <main className="analytics-shell meta-ads-shell">
      <MetaAdsFilters
        filters={filters}
        campaigns={campaignOptions}
        selectedCampaignId={selectedCampaignId}
        activePeriod={activePeriod}
        onChange={setFilters}
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

      {!loading && rows.length > 0 && periodRows.length === 0 ? (
        <section className="analytics-breakdown-card meta-ads-state-card">
          Selected campaign has no data in this reporting period.
        </section>
      ) : null}

      {!loading && periodRows.length > 0 && !selectedCampaign ? (
        <section className="analytics-breakdown-card meta-ads-state-card">
          Selected campaign not found.
        </section>
      ) : null}

      {!loading && periodRows.length > 0 && selectedCampaign ? (
        <>
          <MetaAdsCampaignScore
            score={campaignScore}
            comparisonReason={comparison.comparisonReason}
          />
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
