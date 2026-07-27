import {
  aggregateByCampaign,
  buildMetaAdsSummary,
  dedupeMetaAdsRows,
  formatDateLabel,
  formatMetricValue,
  getCampaignIdentity,
  hasNumber,
} from "../../utils/metaAdsAnalytics";

const averageMetric = (rows, key) => {
  const values = rows.map((row) => row[key]).filter(hasNumber);
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + Number(value), 0) / values.length;
};

const getBestLeadDay = (rows) =>
  dedupeMetaAdsRows(rows)
    .map((row) => ({
      ...row,
      dailySummary: buildMetaAdsSummary([row]),
    }))
    .filter((row) => hasNumber(row.dailySummary.results))
    .sort((first, second) => Number(second.dailySummary.results) - Number(first.dailySummary.results))[0];

const getPrimaryResultType = (rows, fallback = "Leads") =>
  rows.find((row) => row.resultIndicator && !/^actions:/i.test(row.resultIndicator))?.resultIndicator ||
  fallback;

export function MetaAdsCampaignAnalysis({ allRows, campaign, rows, summary }) {
  const uniqueRows = dedupeMetaAdsRows(rows);
  const selectedCampaignId = getCampaignIdentity(campaign || {});
  const otherCampaigns = aggregateByCampaign(allRows).filter(
    (item) => getCampaignIdentity(item) !== selectedCampaignId
  );
  const bestLeadDay = getBestLeadDay(uniqueRows);
  const activeDays = uniqueRows.filter((row) => row.reportingStarts || row.date).length;
  const resultType = getPrimaryResultType(uniqueRows, campaign?.resultIndicator || "Leads");
  const leadsPer100 = hasNumber(summary.results) && hasNumber(summary.amountSpent)
    ? (Number(summary.results) / Number(summary.amountSpent)) * 100
    : null;
  const comparisonRows = [
    { label: "Leads", key: "results", format: "number" },
    { label: "Cost / lead", key: "costPerResult", format: "currency" },
    { label: "Reach", key: "reach", format: "number" },
    { label: "Impressions", key: "impressions", format: "number" },
  ].map((metric) => ({
    ...metric,
    campaignValue: summary[metric.key],
    averageValue: averageMetric(otherCampaigns, metric.key),
  }));

  return (
    <section className="meta-ads-analysis-grid">
      <article className="analytics-breakdown-card meta-ads-analysis-card meta-ads-read-card">
        <div className="analytics-card-header">
          <strong>Campaign read</strong>
        </div>
        <div className="meta-ads-read-body">
          <div className="meta-ads-read-lede">
            <span>{resultType}</span>
            <strong>
              {formatMetricValue(summary.results)} from {formatMetricValue(summary.amountSpent, "currency")}
            </strong>
          </div>
          <div className="meta-ads-read-stats">
            <div>
              <span>Active days</span>
              <strong>{formatMetricValue(activeDays)}</strong>
            </div>
            <div>
              <span>Leads / $100</span>
              <strong>{formatMetricValue(leadsPer100, "decimal")}</strong>
            </div>
            <div>
              <span>Best day</span>
              <strong>
                {bestLeadDay
                  ? `${formatMetricValue(bestLeadDay.dailySummary.results)} on ${formatDateLabel(
                      bestLeadDay.reportingStarts || bestLeadDay.date
                    )}`
                  : "—"}
              </strong>
            </div>
          </div>
          <p>
            {hasNumber(summary.costPerResult)
              ? `This campaign is averaging ${formatMetricValue(summary.costPerResult, "currency")} per lead across the selected campaign history.`
              : "There is not enough spend and lead data yet to calculate a cost per lead."}
          </p>
        </div>
      </article>

      <article className="analytics-table-card meta-ads-analysis-card meta-ads-comparison-card">
        <div className="analytics-card-header">
          <strong>Campaign vs other campaigns</strong>
        </div>
        <div className="analytics-table-scroll">
          <table className="analytics-table meta-ads-comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Campaign</th>
                <th>Others avg.</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td>{formatMetricValue(row.campaignValue, row.format)}</td>
                  <td>{formatMetricValue(row.averageValue, row.format)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
