import {
  formatDateLabel,
  formatMetricValue,
  getPercentageChange,
} from "../../../utils/metaAdsAnalytics";

const metrics = [
  { key: "amountSpent", label: "Spend", format: "currency" },
  { key: "results", label: "Leads", format: "number" },
  { key: "costPerResult", label: "Cost per lead", format: "currency" },
  { key: "leadsPer100", label: "Leads per $100", format: "decimal" },
  { key: "conversionRate", label: "Conversion rate", format: "percent" },
  { key: "costPerConvertedLead", label: "Cost per converted lead", format: "currency" },
  { key: "reach", label: "Reach", format: "number" },
  { key: "frequency", label: "Frequency", format: "decimal" },
];

export function PreviousCampaignComparison({ current, previousCampaign }) {
  return (
    <section className="analytics-table-card meta-campaign-detail-card">
      <div className="analytics-card-header">
        <strong>Previous comparable campaign</strong>
        {previousCampaign ? (
          <span>{previousCampaign.campaignName} · {formatDateLabel(previousCampaign.reportingStarts || previousCampaign.startDateKey)}</span>
        ) : null}
      </div>
      {!previousCampaign ? (
        <p className="meta-ads-empty-copy">No earlier comparable campaign is available.</p>
      ) : (
        <div className="analytics-table-scroll">
          <table className="analytics-table meta-campaign-comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Selected</th>
                <th>Previous campaign</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const change = getPercentageChange(current[metric.key], previousCampaign[metric.key]);
                return (
                  <tr key={metric.key}>
                    <td>{metric.label}</td>
                    <td>{formatMetricValue(current[metric.key], metric.format)}</td>
                    <td>{formatMetricValue(previousCampaign[metric.key], metric.format)}</td>
                    <td>{change === null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
