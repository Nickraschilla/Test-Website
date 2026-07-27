import { useMemo, useState } from "react";
import { MetaAdsCampaignTable } from "../components/metaAds/MetaAdsCampaignTable";
import { MetaAdsFilters } from "../components/metaAds/MetaAdsFilters";
import { useMetaAdsData } from "../hooks/useMetaAdsData";
import {
  aggregateByCampaign,
  buildDateWindows,
  describeDateWindow,
  filterMetaAdsRows,
  sortRows,
} from "../utils/metaAdsAnalytics";

const DEFAULT_FILTERS = {
  dateRange: "30",
  campaign: "all",
  delivery: "all",
  resultIndicator: "all",
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

  const filteredRows = useMemo(
    () => filterMetaAdsRows(rows, filters, windows.current),
    [filters, rows, windows]
  );
  const campaignRows = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    const groupedRows = aggregateByCampaign(filteredRows).filter((row) =>
      searchTerm ? row.campaignName.toLowerCase().includes(searchTerm) : true
    );

    return sortRows(groupedRows, campaignSort.key, campaignSort.direction);
  }, [campaignSort, filteredRows, filters.search]);

  const handleCampaignSort = (key) => {
    setCampaignSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "desc" ? "asc" : "desc",
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCampaignSort({ key: "amountSpent", direction: "desc" });
  };

  return (
    <main className="analytics-shell meta-ads-shell">
      <MetaAdsFilters
        filters={filters}
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
          {filteredRows.length === 0 ? (
            <section className="analytics-breakdown-card meta-ads-state-card">
              No Meta Ads rows match this reporting period.
            </section>
          ) : null}

          <MetaAdsCampaignTable
            rows={campaignRows}
            sort={campaignSort}
            onSort={handleCampaignSort}
          />
        </>
      ) : null}
    </main>
  );
}
