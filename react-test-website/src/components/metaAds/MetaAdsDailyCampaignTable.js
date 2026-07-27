import {
  buildMetaAdsSummary,
  dedupeMetaAdsRows,
  formatDateLabel,
  formatMetricValue,
} from "../../utils/metaAdsAnalytics";

const columns = [
  { key: "date", label: "Date" },
  { key: "amountSpent", label: "Spend", format: "currency" },
  { key: "results", label: "Leads", format: "number" },
  { key: "costPerResult", label: "Cost / lead", format: "currency" },
  { key: "reach", label: "Reach", format: "number" },
  { key: "impressions", label: "Impressions", format: "number" },
];

export function MetaAdsDailyCampaignTable({ rows }) {
  const dailyRows = dedupeMetaAdsRows(rows)
    .map((row) => ({
      ...row,
      date: row.reportingStarts || row.date || row.reportingEnds,
      costPerResult: buildMetaAdsSummary([row]).costPerResult,
    }))
    .sort((first, second) => String(second.date || "").localeCompare(String(first.date || "")));

  return (
    <section className="analytics-table-card meta-ads-table-card">
      <div className="analytics-card-header">
        <strong>Daily performance</strong>
      </div>
      <div className="analytics-table-scroll">
        <table className="analytics-table meta-ads-daily-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dailyRows.length === 0 ? (
              <tr>
                <td className="analytics-empty-row" colSpan={columns.length}>
                  No daily rows are available for this campaign.
                </td>
              </tr>
            ) : null}
            {dailyRows.map((row) => (
              <tr key={`${row.id || row.campaignId || row.campaignName}-${row.date}`}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.key === "date"
                      ? formatDateLabel(row.date)
                      : formatMetricValue(row[column.key], column.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
