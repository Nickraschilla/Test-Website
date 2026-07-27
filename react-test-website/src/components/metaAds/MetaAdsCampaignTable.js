import { formatDateLabel, formatMetricValue } from "../../utils/metaAdsAnalytics";

const columns = [
  { key: "campaignName", label: "Campaign", numeric: false },
  { key: "amountSpent", label: "Spend", format: "currency", numeric: true },
  { key: "results", label: "Results", numeric: true },
  { key: "costPerResult", label: "Cost / Result", format: "currency", numeric: true },
  { key: "reach", label: "Reach", numeric: true },
  { key: "impressions", label: "Impressions", numeric: true },
  { key: "reportingStarts", label: "Starts", numeric: false, date: true },
  { key: "reportingEnds", label: "Ends", numeric: false, date: true },
];

export function MetaAdsCampaignTable({
  rows,
  sort,
  onSort,
}) {
  const sortArrow = (key) => {
    if (sort.key !== key) return "";
    return sort.direction === "asc" ? " ↑" : " ↓";
  };
  const getResultContext = (row) => {
    if (!row.resultIndicator || row.resultIndicator === "—") return "";
    if (/^\d+\s+types$/i.test(row.resultIndicator)) return "Mixed result types";
    return row.resultIndicator;
  };

  return (
    <section className="analytics-table-card meta-ads-table-card">
      <div className="analytics-card-header">
        <strong>Campaign Performance</strong>
      </div>
      <div className="analytics-table-scroll">
        <table className="analytics-table meta-ads-campaign-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {column.numeric || column.key === "campaignName" ? (
                    <button type="button" onClick={() => onSort(column.key)}>
                      {column.label}{sortArrow(column.key)}
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
                  No campaigns match this selection.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.campaignName}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.date
                      ? formatDateLabel(row[column.key])
                      : column.key === "campaignName"
                        ? row.campaignName
                        : column.key === "results"
                          ? (
                            <>
                              {formatMetricValue(row[column.key], column.format)}
                              {getResultContext(row) ? (
                                <span className="analytics-row-note meta-ads-result-note">
                                  {getResultContext(row)}
                                </span>
                              ) : null}
                            </>
                          )
                        : column.numeric
                          ? formatMetricValue(row[column.key], column.format)
                          : row[column.key] || "—"}
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
