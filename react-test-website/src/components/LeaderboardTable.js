export function LeaderboardTable({
  sortedReels,
  sortArrow,
  handleSort,
  selectedContributor,
  setSelectedContributor,
  setActiveClip,
  formatNumber,
  getMomentumScore,
}) {
  return (
    <div className="table-wrapper">
      <table className="leaderboard-table">
        <colgroup>
          <col className="col-rank" />
          <col className="col-coder" />
          <col className="col-reel" />
          <col className="col-clip" />
          <col className="col-metric" />
          <col className="col-metric" />
          <col className="col-metric col-metric-wide" />
          <col className="col-metric" />
          <col className="col-score" />
        </colgroup>
        <thead>
          <tr>
            <th className="th-rank">#</th>
            <th className="th-text" onClick={() => handleSort("name")}><span className="th-content"><span className="th-label">Coder</span><span className="th-arrow">{sortArrow("name")}</span></span></th>
            <th className="th-text" onClick={() => handleSort("reelName")}><span className="th-content"><span className="th-label">Reel</span><span className="th-arrow">{sortArrow("reelName")}</span></span></th>
            <th className="th-clip"><span className="th-content"><span className="th-label">Clip</span></span></th>
            <th className="th-metric" onClick={() => handleSort("views")}><span className="th-content"><span className="th-label">Views</span><span className="th-arrow">{sortArrow("views")}</span></span></th>
            <th className="th-metric" onClick={() => handleSort("likes")}><span className="th-content"><span className="th-label">Likes</span><span className="th-arrow">{sortArrow("likes")}</span></span></th>
            <th className="th-metric" onClick={() => handleSort("comments")}><span className="th-content"><span className="th-label">Comments</span><span className="th-arrow">{sortArrow("comments")}</span></span></th>
            <th className="th-metric" onClick={() => handleSort("reshares")}><span className="th-content"><span className="th-label">Shares</span><span className="th-arrow">{sortArrow("reshares")}</span></span></th>
            <th
              className="th-score"
              onClick={() => handleSort("score")}
              title="Time-adjusted score based on views, likes, comments, shares, saves, and days live."
            >
              <span className="th-content"><span className="th-label">Momentum score</span><span className="th-arrow">{sortArrow("score")}</span></span>
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedReels.map((reel, index) => {
            const isTopRow = index === 0;
            return (
              <tr
                key={`${reel.name}-${reel.reelName}-${index}`}
                className={`leaderboard-row ${
                  index < 3 ? `leaderboard-row-top-${index + 1}` : ""
                }`}
              >
                <td className="rank-cell">
                  {index < 3 ? (
                    <span className={`rank-badge rank-badge-${index + 1}`}>
                      {index === 0 ? "1ST" : index === 1 ? "2ND" : "3RD"}
                    </span>
                  ) : (
                    <span className="rank-number">{index + 1}</span>
                  )}
                </td>
                <td className="name-cell">
                  <div className="name-wrap">
                    <span className={`row-status-dot ${isTopRow ? "row-status-dot-live" : ""}`} aria-hidden="true" />
                    <button
                      type="button"
                      className={`profile-link ${
                        selectedContributor === reel.name ? "profile-link-active" : ""
                      }`}
                      onClick={() => setSelectedContributor(reel.name)}
                    >
                      {reel.name}
                    </button>
                  </div>
                </td>
                <td className="reel-cell">
                  <div className="reel-title">{reel.reelName}</div>
                  <div className="reel-meta">Live ranked reel</div>
                </td>
                <td className="clip-cell">
                  {reel.clipUrl ? (
                    <button
                      type="button"
                      className="clip-button"
                      onClick={() => setActiveClip(reel)}
                      aria-label={`Play ${reel.reelName || "clip"} by ${
                        reel.name || "this contributor"
                      }`}
                    >
                      <span className="clip-button-icon" aria-hidden="true">
                        ▶
                      </span>
                      <span className="clip-button-label">Play</span>
                    </button>
                  ) : (
                    <span className="clip-button clip-button-disabled">No clip</span>
                  )}
                </td>
                <td><span className="metric-value">{formatNumber(reel.views)}</span></td>
                <td><span className="metric-value">{formatNumber(reel.likes)}</span></td>
                <td><span className="metric-value">{formatNumber(reel.comments)}</span></td>
                <td><span className="metric-value">{formatNumber(reel.reshares)}</span></td>
                <td className="score-cell">
                  <span className="score-cell-value">
                    {formatNumber(Math.round(getMomentumScore(reel)))}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
