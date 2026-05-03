import { MiniStat } from "./MiniStat";

export function DashboardHero({
  reelCount,
  topPerformer,
  totals,
  formatNumber,
  getImpactScore,
  animateHeadlineStats = false,
  animationKey,
}) {
  const topName = topPerformer ? topPerformer.name || "Unnamed" : "No data";
  const topReel = topPerformer ? topPerformer.reelName || "Untitled reel" : "";
  const topImpact = topPerformer ? formatNumber(Math.round(getImpactScore(topPerformer))) : "0";
  const topViews = topPerformer ? formatNumber(topPerformer.views) : "0";
  const topShares = topPerformer ? formatNumber(topPerformer.reshares) : "0";

  return (
    <section className="hero">
      <div className="hero-brand-card">
        <div className="hero-card-topbar" aria-hidden="true" />
        <div className="hero-brand-stack">
          <div className="hero-brand-intro">
            <div className="hero-brand-header">
              <div className="hero-card-label-pill">Social performance board</div>
              <h1 className="hero-title">
                <span className="hero-title-primary">Coders</span>
                <span className="hero-title-accent">Social</span>
                <span className="hero-title-accent">Impact</span>
              </h1>
              <p className="hero-copy">
                A shared board for the coding team to see what is landing, celebrate standout reels,
                and help Premier Data turn every post into stronger reach for the brand.
              </p>
            </div>

            <div className="hero-meta-pills">
              <div className="hero-meta-pill">{reelCount} reels tracked</div>
              <div className="hero-meta-pill">Refreshes every 15 minutes</div>
            </div>
          </div>

          <div className="hero-brand-story-grid">
            <div className="hero-brand-note hero-brand-note-strong">
              <span className="hero-brand-note-label">Built for the team</span>
              <p>
                From first upload to strongest performer, the board gives the group one place to back each other,
                learn what is resonating, and build a stronger sense of shared momentum.
              </p>
            </div>

            <div className="hero-brand-points hero-brand-points-compact">
              <div className="hero-brand-point">
                <span className="hero-brand-point-label">Shared momentum</span>
                <strong>See which reels are helping lift the board each refresh.</strong>
              </div>
              <div className="hero-brand-point">
                <span className="hero-brand-point-label">Bigger reach</span>
                <strong>Track how the team's output is expanding Premier Data's social footprint.</strong>
              </div>
            </div>
          </div>

          <div className="hero-leader-spotlight hero-leader-spotlight-inline">
            <div className="hero-leader-copy">
              <div className="hero-card-label">Team spotlight</div>
              <div className="hero-feature-rank">Current leading reel</div>
              <div className="hero-card-name">{topName}</div>
              <div className="hero-card-reel">{topReel}</div>
            </div>

            <div className="hero-leader-stats">
              <div className="hero-brand-metric hero-brand-metric-featured">
                <span className="hero-brand-metric-label">Impact score</span>
                <strong>{topImpact}</strong>
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
        <div className="hero-card-topbar" aria-hidden="true" />
        <div className="hero-feature-header hero-totals-header">
          <div>
            <div className="hero-card-label">Board totals</div>
            <div className="hero-feature-rank">Live social reach across the team</div>
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
