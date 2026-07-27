import { useMemo, useState } from "react";
import { MetaAdsCampaignTable } from "../components/metaAds/MetaAdsCampaignTable";
import { MetaAdsCreativePerformance } from "../components/metaAds/MetaAdsCreativePerformance";
import { MetaAdsFilters } from "../components/metaAds/MetaAdsFilters";
import { MetaAdsFunnel } from "../components/metaAds/MetaAdsFunnel";
import { MetaAdsInsights } from "../components/metaAds/MetaAdsInsights";
import { MetaAdsKpiGrid } from "../components/metaAds/MetaAdsKpiGrid";
import { MetaAdsTrendChart } from "../components/metaAds/MetaAdsTrendChart";
import { metaAdsFixtures } from "../data/metaAdsFixtures";
import {
  aggregateByCampaign,
  aggregateByCreative,
  buildDateWindows,
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
  objective: "all",
  status: "all",
  platform: "Combined",
  trendMetric: "amountSpent",
  grouping: "Daily",
  comparePrevious: false,
};

export function MetaAdsReportingPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignSort, setCampaignSort] = useState({
    key: "amountSpent",
    direction: "desc",
  });
  const [creativeSortKey, setCreativeSortKey] = useState("leads");

  const filterOptions = useMemo(
    () => getMetaAdsFilterOptions(metaAdsFixtures),
    []
  );

  const windows = useMemo(
    () => buildDateWindows(filters.dateRange, metaAdsFixtures),
    [filters.dateRange]
  );

  const filteredRows = useMemo(
    () => filterMetaAdsRows(metaAdsFixtures, filters, windows.current),
    [filters, windows]
  );

  const previousRows = useMemo(
    () => filterMetaAdsRows(metaAdsFixtures, filters, windows.previous),
    [filters, windows]
  );

  const summary = useMemo(() => buildMetaAdsSummary(filteredRows), [filteredRows]);
  const previousSummary = useMemo(() => buildMetaAdsSummary(previousRows), [previousRows]);
  const trendRows = useMemo(
    () => buildTrendRows(filteredRows, filters.grouping, filters.trendMetric),
    [filteredRows, filters.grouping, filters.trendMetric]
  );
  const campaignRows = useMemo(() => {
    const search = campaignSearch.trim().toLowerCase();
    const rows = aggregateByCampaign(filteredRows).filter((row) =>
      search ? row.campaignName.toLowerCase().includes(search) : true
    );

    return sortRows(rows, campaignSort.key, campaignSort.direction);
  }, [campaignSearch, campaignSort, filteredRows]);
  const creativeRows = useMemo(() => {
    const direction = creativeSortKey === "costPerLead" ? "asc" : "desc";
    return sortRows(aggregateByCreative(filteredRows), creativeSortKey, direction);
  }, [creativeSortKey, filteredRows]);
  const insights = useMemo(
    () =>
      buildInsights({
        campaigns: aggregateByCampaign(filteredRows),
        creatives: aggregateByCreative(filteredRows),
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

  return (
    <main className="analytics-shell meta-ads-shell">
      <MetaAdsFilters
        filters={filters}
        options={filterOptions}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setCampaignSearch("");
          setCampaignSort({ key: "amountSpent", direction: "desc" });
          setCreativeSortKey("leads");
        }}
      />

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
        <MetaAdsCreativePerformance
          rows={creativeRows}
          sortKey={creativeSortKey}
          onSortKeyChange={setCreativeSortKey}
        />
        <MetaAdsInsights insights={insights} />
      </section>
    </main>
  );
}
