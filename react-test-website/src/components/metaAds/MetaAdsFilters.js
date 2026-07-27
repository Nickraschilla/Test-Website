export function MetaAdsFilters({
  campaigns,
  selectedCampaignId,
  selectedCampaign,
  selectedPeriod,
  onSelectCampaign,
}) {
  return (
    <section className="analytics-hero-panel meta-ads-hero-panel">
      <div className="analytics-hero-copy">
        <div className="analytics-kicker">Paid Social Analytics</div>
        <div className="analytics-title-row">
          <h2>Meta Ads Reporting</h2>
        </div>
        <p>{selectedCampaign?.campaignName || "Select a campaign to review."}</p>
        <small className="meta-ads-active-period">
          {selectedCampaign?.campaignDelivery || "No status"} · {selectedPeriod}
        </small>
      </div>

      <div className="analytics-filter-card meta-ads-filter-card">
        <label>
          <span>Campaign</span>
          <select
            value={selectedCampaignId}
            onChange={(event) => onSelectCampaign(event.target.value)}
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
