import { DATE_RANGE_OPTIONS } from "../../utils/metaAdsAnalytics";

export function MetaAdsFilters({
  filters,
  activePeriod,
  onChange,
  onReset,
}) {
  const updateFilter = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <section className="analytics-hero-panel meta-ads-hero-panel">
      <div className="analytics-hero-copy">
        <div className="analytics-kicker">Paid Social Analytics</div>
        <div className="analytics-title-row">
          <h2>Meta Ads Reporting</h2>
        </div>
        <p>Baseline campaign data view while the report structure is being rebuilt.</p>
        <small className="meta-ads-active-period">{activePeriod}</small>
      </div>

      <div className="analytics-filter-card meta-ads-filter-card">
        <label>
          <span>Date Range</span>
          <select
            value={filters.dateRange}
            onChange={(event) => updateFilter("dateRange", event.target.value)}
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {filters.dateRange === "custom" ? (
          <>
            <label>
              <span>Start Date</span>
              <input
                type="date"
                value={filters.customStart}
                onChange={(event) => updateFilter("customStart", event.target.value)}
              />
            </label>
            <label>
              <span>End Date</span>
              <input
                type="date"
                value={filters.customEnd}
                min={filters.customStart || undefined}
                onChange={(event) => updateFilter("customEnd", event.target.value)}
              />
            </label>
          </>
        ) : null}

        <label>
          <span>Search</span>
          <input
            type="search"
            value={filters.search}
            placeholder="Campaign name"
            onChange={(event) => updateFilter("search", event.target.value)}
          />
        </label>

        <div className="analytics-filter-meta meta-ads-filter-meta">
          <button type="button" onClick={onReset}>
            Reset View
          </button>
        </div>
      </div>
    </section>
  );
}
