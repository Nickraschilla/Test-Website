import { MiniStat } from "./MiniStat";

export function DashboardHero({
  totals,
  platformLabel,
  formatNumber,
}) {
  const metricPrefix = platformLabel === "Total" ? "Total" : platformLabel;

  return (
    <section className="hero">
      <div className="hero-feature-card hero-totals-card">
        <div className="hero-feature-header hero-totals-header">
          <div>
            <div className="hero-card-label">Board totals</div>
            <div className="hero-feature-rank">{platformLabel} team reach</div>
          </div>
          <div className="hero-rank-chip">Live</div>
        </div>

        <div className="hero-stats-grid hero-stats-grid-totals">
          <MiniStat
            label={`${metricPrefix} views`}
            icon="views"
            value={totals.views}
            formatValue={formatNumber}
          />
          <MiniStat
            label={`${metricPrefix} likes`}
            icon="impact"
            value={totals.likes}
            formatValue={formatNumber}
          />
          <MiniStat
            label={`${metricPrefix} shares`}
            icon="shares"
            value={totals.reshares}
            formatValue={formatNumber}
          />
          <MiniStat
            label={`${metricPrefix} comments`}
            icon="comments"
            value={totals.comments}
            formatValue={formatNumber}
          />
        </div>
      </div>
    </section>
  );
}
