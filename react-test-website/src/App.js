import { useMemo, useState } from "react";
import "./App.css";
import { ClipModal } from "./components/ClipModal";
import { ContributorSummary } from "./components/ContributorSummary";
import { DashboardHero } from "./components/DashboardHero";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { useReelsData } from "./hooks/useReelsData";
import {
  calculateTotals,
  formatNumber,
  getClipPresentation,
  getImpactScore,
  sortReels,
} from "./utils/reels";

function App() {
  const { reels, loading, error, lastUpdated } = useReelsData();
  const [sortKey, setSortKey] = useState("score");
  const [ascending, setAscending] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState("all");
  const [activeClip, setActiveClip] = useState(null);

  const contributors = useMemo(
    () =>
      [...new Set(reels.map((reel) => reel.name).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [reels]
  );

  const filteredReels = useMemo(
    () =>
      selectedContributor === "all"
        ? reels
        : reels.filter((reel) => reel.name === selectedContributor),
    [reels, selectedContributor]
  );

  const sortedReels = useMemo(
    () => sortReels(filteredReels, sortKey, ascending),
    [filteredReels, sortKey, ascending]
  );

  const fullRanking = useMemo(() => sortReels(reels, "score", false), [reels]);
  const totals = useMemo(() => calculateTotals(filteredReels), [filteredReels]);
  const overallTotals = useMemo(() => calculateTotals(reels), [reels]);
  const topPerformer = sortedReels[0];
  const overallTopPerformer = fullRanking[0];
  const activeClipPresentation = activeClip
    ? getClipPresentation(activeClip.clipUrl)
    : null;
  const shouldAnimateHeadlineStats = selectedContributor === "all";

  const handleSort = (key) => {
    if (sortKey === key) {
      setAscending((currentValue) => !currentValue);
      return;
    }

    setSortKey(key);
    setAscending(false);
  };

  const sortArrow = (key) => {
    if (sortKey !== key) return "↕";
    return ascending ? "↑" : "↓";
  };

  if (loading) {
    return <div className="dashboard-message">Loading data...</div>;
  }

  if (error) {
    return <div className="dashboard-message">{error}</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-grid" aria-hidden="true" />
      <div className="dashboard-glow dashboard-glow-one" />
      <div className="dashboard-glow dashboard-glow-two" />

      <main className="dashboard-shell">
        <DashboardHero
          reelCount={reels.length}
          lastUpdated={lastUpdated}
          topPerformer={overallTopPerformer}
          totals={overallTotals}
          formatNumber={formatNumber}
          getImpactScore={getImpactScore}
          animateHeadlineStats={shouldAnimateHeadlineStats}
          animationKey={lastUpdated}
        />

        <section className="leaderboard-stage">
          <div className="leaderboard-stage-top">
            <div className="leaderboard-stage-copy">
              <div className="section-kicker">Performance ranking</div>
              <h2 className="leaderboard-heading">Live leaderboard</h2>
              <p className="leaderboard-subheading">
                {selectedContributor === "all"
                  ? "Live social impact rankings sorted by weighted impact score."
                  : `Focused view for ${selectedContributor}, still ranked by weighted impact score.`}
              </p>
            </div>

            <div className="leaderboard-stage-actions">
              <div className="leaderboard-status-pill">
                <span className="status-dot" aria-hidden="true" />
                {reels.length} live reels
              </div>

              {selectedContributor !== "all" ? (
                <button
                  type="button"
                  className="home-button"
                  onClick={() => setSelectedContributor("all")}
                >
                  Back to leaderboard
                </button>
              ) : null}

              <label className="filter-control">
                <span className="filter-label">Coder</span>
                <select
                  className="filter-select"
                  value={selectedContributor}
                  onChange={(event) => setSelectedContributor(event.target.value)}
                >
                  <option value="all">All coders</option>
                  {contributors.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {selectedContributor !== "all" ? (
            <ContributorSummary
              selectedContributor={selectedContributor}
              filteredReels={filteredReels}
              totals={totals}
              topPerformer={topPerformer}
              formatNumber={formatNumber}
              getImpactScore={getImpactScore}
            />
          ) : null}

          <div className="leaderboard-table-frame">
            <LeaderboardTable
              sortedReels={sortedReels}
              sortArrow={sortArrow}
              handleSort={handleSort}
              selectedContributor={selectedContributor}
              setSelectedContributor={setSelectedContributor}
              setActiveClip={setActiveClip}
              formatNumber={formatNumber}
              getImpactScore={getImpactScore}
            />
          </div>
        </section>
      </main>

      <ClipModal
        activeClip={activeClip}
        activeClipPresentation={activeClipPresentation}
        onClose={() => setActiveClip(null)}
      />
    </div>
  );
}

export default App;
