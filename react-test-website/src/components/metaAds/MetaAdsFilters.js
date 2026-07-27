export function MetaAdsFilters({
  campaigns,
  selectedCampaignId,
  activePeriod,
  onSelectCampaign,
  onReset,
}) {
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

        <div className="analytics-filter-meta meta-ads-filter-meta">
          <button type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
