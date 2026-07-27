import { formatMetricValue } from "../../utils/metaAdsAnalytics";

export function MetaAdsDeliveryBreakdown({ rows }) {
  return (
    <section className="analytics-table-card meta-ads-table-card">
      <div className="analytics-card-header">
        <strong>Delivery Breakdown</strong>
      </div>
      <div className="analytics-table-scroll">
        <table className="analytics-table meta-ads-delivery-table">
          <thead>
            <tr>
              <th>Campaign Delivery</th>
              <th>Spend</th>
              <th>Results</th>
              <th>Cost / Result</th>
              <th>Reach</th>
              <th>Impressions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="analytics-empty-row" colSpan="6">
                  No delivery data for this selection.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{formatMetricValue(row.amountSpent, "currency")}</td>
                <td>{formatMetricValue(row.results)}</td>
                <td>{formatMetricValue(row.costPerResult, "currency")}</td>
                <td>{formatMetricValue(row.reach)}</td>
                <td>{formatMetricValue(row.impressions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
