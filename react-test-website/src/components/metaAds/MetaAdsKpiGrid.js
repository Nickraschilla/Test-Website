import {
  formatMetricValue,
  getComparisonClass,
  getComparisonLabel,
  getPercentageChange,
  KPI_METRICS,
} from "../../utils/metaAdsAnalytics";

export function MetaAdsKpiGrid({ summary, previousSummary, comparePrevious }) {
  return (
    <section className="analytics-kpi-grid meta-ads-kpi-grid">
      {KPI_METRICS.map((metric) => {
        const value = summary[metric.key];
        const change = comparePrevious
          ? getPercentageChange(value, previousSummary[metric.key])
          : null;

        return (
          <article className="analytics-kpi-card meta-ads-kpi-card" key={metric.key}>
            <div className="meta-ads-kpi-icon" aria-hidden="true">
              {metric.label.slice(0, 1)}
            </div>
            <div>
              <span>{metric.label}</span>
              <strong>{formatMetricValue(value, metric.format)}</strong>
              {comparePrevious ? (
                <small className={`meta-ads-comparison ${getComparisonClass(metric, change)}`}>
                  {getComparisonLabel(metric, change)}
                </small>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}
