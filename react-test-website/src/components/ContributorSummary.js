import { MiniStat } from "./MiniStat";

export function ContributorSummary({
  selectedContributor,
  filteredReels,
  totals,
  topPerformer,
  formatNumber,
  getImpactScore,
}) {
  if (selectedContributor === "all" || !topPerformer) {
    return null;
  }

  return (
    <div className="contributor-summary">
      <div className="contributor-summary-shell">
        <div className="contributor-summary-copy">
          <div className="contributor-summary-label">Coder profile</div>
          <div className="contributor-summary-name">{selectedContributor}</div>
          <p className="contributor-summary-text">
            {filteredReels.length} reel{filteredReels.length === 1 ? "" : "s"} tracked with {formatNumber(totals.views)} views, {formatNumber(totals.likes)} likes, {formatNumber(totals.comments)} comments and {formatNumber(totals.reshares)} shares.
          </p>
          <div className="contributor-summary-highlight">
            <span className="contributor-summary-highlight-label">Best-performing reel</span>
            <span className="contributor-summary-highlight-value">{topPerformer.reelName || "-"}</span>
          </div>
        </div>

        <div className="contributor-summary-stats">
          <MiniStat
            label="Top impact"
            value={getImpactScore(topPerformer)}
            formatValue={(value) => formatNumber(Math.round(value))}
          />
          <MiniStat label="Total comments" value={totals.comments} formatValue={formatNumber} />
          <MiniStat label="Total likes" value={totals.likes} formatValue={formatNumber} />
          <MiniStat label="Total shares" value={totals.reshares} formatValue={formatNumber} />
        </div>
      </div>
    </div>
  );
}
