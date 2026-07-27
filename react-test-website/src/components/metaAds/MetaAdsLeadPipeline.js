import { useMemo } from "react";
import { MANUAL_LEAD_STATUSES, buildManualLeadSummary } from "../../utils/metaAdsCampaignReview";
import { formatMetricValue } from "../../utils/metaAdsAnalytics";

export function MetaAdsLeadPipeline({ campaignId, leads, loading, refreshing, error, campaignSpend }) {
  const campaignLeads = useMemo(
    () => leads.filter((lead) => lead.campaignId === campaignId),
    [campaignId, leads]
  );
  const summary = useMemo(() => buildManualLeadSummary(campaignLeads), [campaignLeads]);
  const costPerConvertedCustomer = summary.convertedCount
    ? campaignSpend / summary.convertedCount
    : null;

  return (
    <section className="analytics-breakdown-card meta-ads-lead-section">
      <div className="analytics-card-header">
        <strong>Lead pipeline</strong>
        {refreshing ? <span>Refreshing...</span> : null}
      </div>

      {error ? (
        <div className="dashboard-warning meta-ads-warning" role="alert">
          {error}
        </div>
      ) : null}

      <div className="meta-ads-pipeline-summary">
        {MANUAL_LEAD_STATUSES.map((status) => (
          <div key={status}>
            <span>{status}</span>
            <strong>{summary.counts[status]}</strong>
          </div>
        ))}
      </div>

      <div className="meta-ads-pipeline-metrics">
        <div>
          <span>Contact Rate</span>
          <strong>{formatMetricValue(summary.contactRate, "percent")}</strong>
        </div>
        <div>
          <span>Conversion Rate</span>
          <strong>{formatMetricValue(summary.conversionRate, "percent")}</strong>
        </div>
        <div>
          <span>Cost Per Converted Customer</span>
          <strong>{formatMetricValue(costPerConvertedCustomer, "currency")}</strong>
        </div>
      </div>

      <div className="analytics-table-scroll">
        <table className="analytics-table meta-ads-lead-table">
          <thead>
            <tr>
              <th>Lead Name</th>
              <th>Position</th>
              <th>Club</th>
              <th>League</th>
              <th>Contacted</th>
              <th>Converted</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="analytics-empty-row" colSpan="6">
                  Loading lead pipeline...
                </td>
              </tr>
            ) : null}
            {!loading && campaignLeads.length === 0 ? (
              <tr>
                <td className="analytics-empty-row" colSpan="6">
                  No lead pipeline rows match this campaign ID.
                </td>
              </tr>
            ) : null}
            {!loading && campaignLeads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.name}</td>
                <td>{lead.position || "—"}</td>
                <td>{lead.club || "—"}</td>
                <td>{lead.league || "—"}</td>
                <td>{lead.contacted ? "Yes" : "No"}</td>
                <td>{lead.converted ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
