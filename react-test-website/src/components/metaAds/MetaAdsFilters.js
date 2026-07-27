import {
  DATE_RANGE_OPTIONS,
  GROUPING_OPTIONS,
} from "../../utils/metaAdsAnalytics";

export function MetaAdsFilters({
  filters,
  options,
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
        <p>Campaign performance, lead generation and creative analysis.</p>
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

        <label>
          <span>Campaign</span>
          <select
            value={filters.campaign}
            onChange={(event) => updateFilter("campaign", event.target.value)}
          >
            <option value="all">All campaigns</option>
            {options.campaigns.map((campaign) => (
              <option key={campaign} value={campaign}>
                {campaign}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Delivery</span>
          <select
            value={filters.delivery}
            onChange={(event) => updateFilter("delivery", event.target.value)}
          >
            <option value="all">All delivery</option>
            {options.deliveries.map((delivery) => (
              <option key={delivery} value={delivery}>
                {delivery}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Result Type</span>
          <select
            value={filters.resultIndicator}
            onChange={(event) => updateFilter("resultIndicator", event.target.value)}
          >
            <option value="all">All lead types</option>
            {options.resultIndicators.map((indicator) => (
              <option key={indicator} value={indicator}>
                {indicator}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Group By</span>
          <select
            value={filters.grouping}
            onChange={(event) => updateFilter("grouping", event.target.value)}
          >
            <option value="auto">Auto</option>
            {GROUPING_OPTIONS.map((grouping) => (
              <option key={grouping} value={grouping}>
                {grouping}
              </option>
            ))}
          </select>
        </label>

        <div className="analytics-filter-meta meta-ads-filter-meta">
          <button
            type="button"
            className={filters.comparePrevious ? "meta-ads-filter-active" : ""}
            aria-pressed={filters.comparePrevious}
            onClick={() => updateFilter("comparePrevious", !filters.comparePrevious)}
          >
            Compare previous period
          </button>
          <button type="button" onClick={onReset}>
            Reset Filters
          </button>
        </div>
      </div>
    </section>
  );
}
