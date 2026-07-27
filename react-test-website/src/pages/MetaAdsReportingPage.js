import { useMemo, useState } from "react";
import { MetaAdsCampaignTable } from "../components/metaAds/MetaAdsCampaignTable";
import { MetaAdsDeliveryBreakdown } from "../components/metaAds/MetaAdsDeliveryBreakdown";
import { MetaAdsFilters } from "../components/metaAds/MetaAdsFilters";
import { MetaAdsFunnel } from "../components/metaAds/MetaAdsFunnel";
import { MetaAdsInsights } from "../components/metaAds/MetaAdsInsights";
import { MetaAdsKpiGrid } from "../components/metaAds/MetaAdsKpiGrid";
import { MetaAdsTrendChart } from "../components/metaAds/MetaAdsTrendChart";
import { useMetaAdsData } from "../hooks/useMetaAdsData";
import {
  aggregateByCampaign,
  buildDateWindows,
  buildDeliveryRows,
  buildInsights,
  buildMetaAdsSummary,
  buildTrendRows,
  filterMetaAdsRows,
  getMetaAdsFilterOptions,
  sortRows,
} from "../utils/metaAdsAnalytics";

const DEFAULT_FILTERS = {
  dateRange: "30",
  campaign: "all",
  delivery: "all",
  resultIndicator: "all",
  trendMetric: "amountSpent",
  grouping: "Daily",
  comparePrevious: false,
};

export function MetaAdsReportingPage() {
  const { rows, loading, refreshing, error, usingFallback } = useMetaAdsData();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignSort, setCampaignSort] = useState({
    key: "amountSpent",
    direction: "desc",
  });

  const filterOptions = useMemo(() => getMetaAdsFilterOptions(rows), [rows]);
  const windows = useMemo(
    () => buildDateWindows(filters.dateRange, rows),
    [filters.dateRange, rows]
  );

  const filteredRows = useMemo(
    () => filterMetaAdsRows(rows, filters, windows.current),
    [filters, rows, windows]
  );
  const previousRows = useMemo(
    () => filterMetaAdsRows(rows, filters, windows.previous),
    [filters, rows, windows]
  );

  const summary = useMemo(() => buildMetaAdsSummary(filteredRows), [filteredRows]);
  const previousSummary = useMemo(() => buildMetaAdsSummary(previousRows), [previousRows]);
  const trendRows = useMemo(
    () => buildTrendRows(filteredRows, filters.grouping, filters.trendMetric),
    [filteredRows, filters.grouping, filters.trendMetric]
  );
  const campaignRows = useMemo(() => {
    const search = campaignSearch.trim().toLowerCase();
    const groupedRows = aggregateByCampaign(filteredRows).filter((row) =>
      search ? row.campaignName.toLowerCase().includes(search) : true
    );

    return sortRows(groupedRows, campaignSort.key, campaignSort.direction);
  }, [campaignSearch, campaignSort, filteredRows]);
  const deliveryRows = useMemo(() => buildDeliveryRows(filteredRows), [filteredRows]);
  const insights = useMemo(
    () =>
      buildInsights({
        campaigns: aggregateByCampaign(filteredRows),
        summary,
      }),
    [filteredRows, summary]
  );

  const handleCampaignSort = (key) => {
    setCampaignSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "desc" ? "asc" : "desc",
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCampaignSearch("");
    setCampaignSort({ key: "amountSpent", direction: "desc" });
  };

  return (
    <main className="analytics-shell meta-ads-shell">
      <MetaAdsFilters
        filters={filters}
        options={filterOptions}
        onChange={setFilters}
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
          No Meta Ads rows are available from the published sheet yet.
        </section>
      ) : null}

      {!loading && usingFallback ? (
        <section className="analytics-breakdown-card meta-ads-state-card">
          Development fallback data is currently being displayed.
        </section>
      ) : null}

      {!loading && rows.length > 0 ? (
        <>
          <MetaAdsKpiGrid
            summary={summary}
            previousSummary={previousSummary}
            comparePrevious={filters.comparePrevious}
          />

          <section className="analytics-main-grid meta-ads-main-grid">
            <MetaAdsTrendChart rows={trendRows} metricKey={filters.trendMetric} />
            <MetaAdsFunnel summary={summary} />
          </section>

          <MetaAdsCampaignTable
            rows={campaignRows}
            search={campaignSearch}
            sort={campaignSort}
            onSearch={setCampaignSearch}
            onSort={handleCampaignSort}
          />

          <section className="analytics-main-grid meta-ads-main-grid">
            <MetaAdsDeliveryBreakdown rows={deliveryRows} />
            <MetaAdsInsights insights={insights} />
          </section>
        </>
      ) : null}
    </main>
  );
}
