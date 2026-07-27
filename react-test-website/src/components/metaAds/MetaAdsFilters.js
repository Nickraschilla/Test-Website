import {
  DATE_RANGE_OPTIONS,
  GROUPING_OPTIONS,
  PLATFORM_OPTIONS,
  TREND_METRICS,
} from "../../utils/metaAdsAnalytics";

export function MetaAdsFilters({
  filters,
  options,
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
          <span>Objective</span>
          <select
            value={filters.objective}
            onChange={(event) => updateFilter("objective", event.target.value)}
          >
            <option value="all">All objectives</option>
            {options.objectives.map((objective) => (
              <option key={objective} value={objective}>
                {objective}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Status</span>
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="all">All statuses</option>
            {options.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Platform</span>
          <select
            value={filters.platform}
            onChange={(event) => updateFilter("platform", event.target.value)}
          >
            {PLATFORM_OPTIONS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Metric</span>
          <select
            value={filters.trendMetric}
            onChange={(event) => updateFilter("trendMetric", event.target.value)}
          >
            {TREND_METRICS.map((metric) => (
              <option key={metric.key} value={metric.key}>
                {metric.label}
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
