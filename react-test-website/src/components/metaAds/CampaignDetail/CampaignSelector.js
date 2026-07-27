export function CampaignSelector({
  campaigns,
  selectedCampaignId,
  onChange,
}) {
  if (campaigns.length === 0) {
    return (
      <div className="meta-campaign-selector meta-campaign-selector-empty">
        No campaigns available
      </div>
    );
  }

  const selectedValue = selectedCampaignId || campaigns[0]?.campaignId || "";

  return (
    <label className="meta-campaign-selector">
      <span>Campaign review</span>
      <select
        value={selectedValue}
        onChange={(event) => onChange(event.target.value)}
      >
        {campaigns.map((campaign) => (
          <option value={campaign.campaignId} key={campaign.campaignId}>
            {campaign.label}
          </option>
        ))}
      </select>
    </label>
  );
}
