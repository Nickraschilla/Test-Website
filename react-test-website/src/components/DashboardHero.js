import { MiniStat } from "./MiniStat";

export function DashboardHero({
  reelCount,
  topPerformer,
  totals,
  formatNumber,
  getMomentumScore,
  animateHeadlineStats = false,
  animationKey,
}) {
  const topName = topPerformer ? topPerformer.name || "Unnamed" : "No data";
  const topReel = topPerformer ? topPerformer.reelName || "Untitled reel" : "";
  const topMomentum = topPerformer ? formatNumber(Math.round(getMomentumScore(topPerformer))) : "0";
  const topViews = topPerformer ? formatNumber(topPerformer.views) : "0";
  const topShares = topPerformer ? formatNumber(topPerformer.reshares) : "0";
  const topInitials = topName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <section className="hero">
      <div className="hero-brand-card">
        <div className="hero-brand-stack">
          <div className="hero-brand-intro">
            <div className="hero-brand-header">
              <div className="hero-card-label-pill">Premier Data Social</div>
              <h1 className="hero-title">
                <span className="hero-title-primary">Coders</span>
                <span className="hero-title-accent">Social Impact</span>
              </h1>
              <p className="hero-copy">
                Performance intelligence for every reel, ranked by reach, response and momentum.
              </p>
            </div>

            <div className="hero-meta-pills">
              <div className="hero-meta-pill">{reelCount} reels tracked</div>
              <div className="hero-meta-pill hero-meta-pill-live">IG live</div>
              <div className="hero-meta-pill">FB weekly</div>
            </div>
          </div>

          <div className="hero-leader-spotlight">
            <div className="hero-player-portrait" aria-hidden="true">
              <span>{topInitials || "PD"}</span>
            </div>

            <div className="hero-leader-copy">
              <div className="hero-card-label">Team spotlight</div>
              <div className="hero-feature-rank">Current leading reel</div>
              <div className="hero-card-name">{topName}</div>
              <div className="hero-card-reel">{topReel}</div>
            </div>

            <div className="hero-leader-stats">
              <div className="hero-brand-metric">
                <span className="hero-brand-metric-label">Momentum score</span>
                <strong>{topMomentum}</strong>
              </div>
              <div className="hero-brand-metric">
                <span className="hero-brand-metric-label">Views</span>
                <strong>{topViews}</strong>
              </div>
              <div className="hero-brand-metric">
                <span className="hero-brand-metric-label">Shares</span>
                <strong>{topShares}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-feature-card hero-totals-card">
        <div className="hero-feature-header hero-totals-header">
          <div>
            <div className="hero-card-label">Board totals</div>
            <div className="hero-feature-rank">Team reach</div>
          </div>
          <div className="hero-rank-chip">Live</div>
        </div>

        <div className="hero-stats-grid hero-stats-grid-totals">
          <MiniStat
            label="Total views"
            icon="views"
            value={totals.views}
            formatValue={formatNumber}
          />
          <MiniStat
            label="Total likes"
            icon="impact"
            value={totals.likes}
            formatValue={formatNumber}
          />
          <MiniStat
            label="Total shares"
            icon="shares"
            value={totals.reshares}
            formatValue={formatNumber}
          />
          <MiniStat
            label="Total comments"
            icon="comments"
            value={totals.comments}
            formatValue={formatNumber}
          />
        </div>
      </div>
    </section>
  );
}
