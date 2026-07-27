import { formatDateLabel, formatMetricValue, getCampaignIdentity } from "../../utils/metaAdsAnalytics";

const columns = [
  { key: "campaignName", label: "Campaign" },
  { key: "latestDate", label: "Date" },
  { key: "campaignDelivery", label: "Status" },
  { key: "amountSpent", label: "Amount Spent", format: "currency" },
  { key: "results", label: "Total Leads", sortKey: "results" },
  { key: "costPerResult", label: "Cost Per Lead", format: "currency", sortKey: "costPerResult" },
];

export function MetaAdsCampaignComparison({
  rows,
  sort,
  comparisonLimited,
  onSort,
  onSelectCampaign,
}) {
  const sortArrow = (key) => {
    if (sort.key !== key) return "";
    return sort.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <section className="analytics-table-card meta-ads-table-card meta-ads-comparison-section">
      <div className="analytics-card-header">
        <strong>Campaign comparison</strong>
        {comparisonLimited ? <span>Limited comparison</span> : null}
      </div>
      <div className="analytics-table-scroll">
        <table className="analytics-table meta-ads-comparison-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {column.sortKey ? (
                    <button type="button" onClick={() => onSort(column.sortKey)}>
                      {column.label}{sortArrow(column.sortKey)}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="analytics-empty-row" colSpan={columns.length}>
                  Insufficient data for campaign comparison.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr
                className={row.isSelected ? "meta-ads-selected-row" : ""}
                key={getCampaignIdentity(row)}
                onClick={() => onSelectCampaign(getCampaignIdentity(row))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectCampaign(getCampaignIdentity(row));
                  }
                }}
                tabIndex="0"
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.key === "latestDate"
                      ? formatDateLabel(row.latestDate)
                      : column.key === "campaignDelivery"
                          ? row.campaignDelivery || "—"
                          : column.key === "campaignName"
                            ? row.campaignName
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
