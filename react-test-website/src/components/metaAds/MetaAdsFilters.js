import { DATE_RANGE_OPTIONS } from "../../utils/metaAdsAnalytics";

export function MetaAdsFilters({
  filters,
  campaigns,
  selectedCampaignId,
  activePeriod,
  onChange,
  onSelectCampaign,
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
        <p>Campaign review, lead quality and practical performance analysis.</p>
        <small className="meta-ads-active-period">{activePeriod}</small>
      </div>

      <div className="analytics-filter-card meta-ads-filter-card meta-ads-review-selector">
        <label>
          <span>Campaign</span>
          <select
            value={selectedCampaignId}
            onChange={(event) => onSelectCampaign(event.target.value)}
          >
            {campaigns.length === 0 ? <option value="">No campaigns available</option> : null}
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.label}
              </option>
            ))}
          </select>
        </label>

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

        <div className="analytics-filter-meta meta-ads-filter-meta">
          <button type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
