import { useCallback, useEffect, useMemo, useState } from "react";
import { CampaignDetailPanel } from "../components/metaAds/CampaignDetail/CampaignDetailPanel";
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
  describeDateWindow,
  filterMetaAdsRows,
  getDefaultGrouping,
  getCampaignIdentity,
  getMetaAdsFilterOptions,
  sortRows,
} from "../utils/metaAdsAnalytics";
import {
  buildCampaignSelectionOptions,
  getValidCampaignSelection,
} from "../utils/metaAdsCampaignSelection";

const DEFAULT_FILTERS = {
  dateRange: "30",
  campaign: "all",
  delivery: "all",
  resultIndicator: "all",
  grouping: "auto",
  comparePrevious: false,
  search: "",
  customStart: "",
  customEnd: "",
};

export function MetaAdsReportingPage() {
  const { rows, loading, refreshing, error, usingFallback } = useMetaAdsData();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [campaignSort, setCampaignSort] = useState({
    key: "amountSpent",
    direction: "desc",
  });
  const [selectedCampaignKey, setSelectedCampaignKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("campaign") || "";
  });

  const filterOptions = useMemo(() => getMetaAdsFilterOptions(rows), [rows]);
  const windows = useMemo(
    () =>
      buildDateWindows(filters.dateRange, rows, {
        start: filters.customStart,
        end: filters.customEnd,
      }),
    [filters.customEnd, filters.customStart, filters.dateRange, rows]
  );
  const activePeriod = useMemo(
    () => describeDateWindow(windows.current),
    [windows]
  );
  const chartGrouping = useMemo(
    () =>
      filters.grouping === "auto"
        ? getDefaultGrouping(windows.current)
        : filters.grouping,
    [filters.grouping, windows]
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
    () => ({
      amountSpent: buildTrendRows(filteredRows, chartGrouping, "amountSpent"),
      results: buildTrendRows(filteredRows, chartGrouping, "results"),
      costPerResult: buildTrendRows(filteredRows, chartGrouping, "costPerResult"),
    }),
    [chartGrouping, filteredRows]
  );
  const campaignRows = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    const groupedRows = aggregateByCampaign(filteredRows).filter((row) =>
      searchTerm ? row.campaignName.toLowerCase().includes(searchTerm) : true
    );

    return sortRows(groupedRows, campaignSort.key, campaignSort.direction);
  }, [campaignSort, filteredRows, filters.search]);
  const campaignOptions = useMemo(
    () => buildCampaignSelectionOptions(rows),
    [rows]
  );
  const selectedCampaign = useMemo(
    () =>
      selectedCampaignKey
        ? aggregateByCampaign(filteredRows).find(
            (campaign) => getCampaignIdentity(campaign) === selectedCampaignKey
          ) ||
          aggregateByCampaign(rows).find(
            (campaign) => getCampaignIdentity(campaign) === selectedCampaignKey
          )
        : null,
    [filteredRows, rows, selectedCampaignKey]
  );
  const deliveryRows = useMemo(() => buildDeliveryRows(filteredRows), [filteredRows]);
  const insights = useMemo(
    () =>
      buildInsights({
        campaigns: aggregateByCampaign(filteredRows),
        summary,
        previousSummary,
      }),
    [filteredRows, previousSummary, summary]
  );

  const handleCampaignSort = (key) => {
    setCampaignSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "desc" ? "asc" : "desc",
    }));
  };

  const selectCampaign = useCallback((campaignKey) => {
    setSelectedCampaignKey(campaignKey);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (campaignKey) {
        url.searchParams.set("campaign", campaignKey);
      } else {
        url.searchParams.delete("campaign");
      }
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCampaignSort({ key: "amountSpent", direction: "desc" });
  };

  useEffect(() => {
    if (rows.length === 0) return;

    const validSelection = getValidCampaignSelection(rows, selectedCampaignKey);

    if (validSelection && validSelection !== selectedCampaignKey) {
      selectCampaign(validSelection);
    }
  }, [rows, selectedCampaignKey, selectCampaign]);

  return (
    <main className="analytics-shell meta-ads-shell">
      <MetaAdsFilters
        filters={filters}
        options={filterOptions}
        activePeriod={activePeriod}
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
          <CampaignDetailPanel
            campaign={selectedCampaign}
            campaigns={campaignOptions}
            selectedCampaignId={selectedCampaignKey}
            allRows={rows}
            currentRows={filteredRows}
            previousRows={previousRows}
            activePeriod={activePeriod}
            onSelectCampaign={selectCampaign}
            onBack={() => {
              document
                .querySelector(".meta-ads-table-card")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />

          <MetaAdsKpiGrid
            summary={summary}
            previousSummary={previousSummary}
            comparePrevious={filters.comparePrevious}
          />

          {filteredRows.length === 0 ? (
            <section className="analytics-breakdown-card meta-ads-state-card">
              No Meta Ads rows match this reporting period.
            </section>
          ) : null}

          <MetaAdsCampaignTable
            rows={campaignRows}
            sort={campaignSort}
            onSort={handleCampaignSort}
            selectedCampaignId={selectedCampaignKey}
            onSelectCampaign={(campaign) =>
              selectCampaign(getCampaignIdentity(campaign))
            }
          />

          <MetaAdsTrendChart rowsByMetric={trendRows} grouping={chartGrouping} />

          <section className="analytics-main-grid meta-ads-main-grid">
            <MetaAdsFunnel summary={summary} />
            <MetaAdsDeliveryBreakdown rows={deliveryRows} />
            <MetaAdsInsights insights={insights} />
          </section>
        </>
      ) : null}
    </main>
  );
}
