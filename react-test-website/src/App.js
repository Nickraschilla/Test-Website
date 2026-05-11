import { useMemo, useState } from "react";
import "./App.css";
import { ClipModal } from "./components/ClipModal";
import { ContributorSummary } from "./components/ContributorSummary";
import { DashboardHero } from "./components/DashboardHero";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { useReelsData } from "./hooks/useReelsData";
import {
  buildMonthOptions,
  buildContributorLeaders,
  calculateTotals,
  formatMonthKey,
  formatNumber,
  getClipPresentation,
  getMomentumScore,
  getMonthKey,
  isInstagramReel,
  isPublishedInYear,
  sortReels,
} from "./utils/reels";

const DISPLAY_YEAR = 2026;

function App() {
  const { reels, loading, error, lastUpdated } = useReelsData();
  const [sortKey, setSortKey] = useState("score");
  const [ascending, setAscending] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [activeClip, setActiveClip] = useState(null);

  const yearFilteredReels = useMemo(
    () => reels.filter((reel) => isPublishedInYear(reel, DISPLAY_YEAR)),
    [reels]
  );

  const monthOptions = useMemo(
    () => buildMonthOptions(yearFilteredReels),
    [yearFilteredReels]
  );

  const monthFilteredReels = useMemo(
    () =>
      selectedMonth === "all"
        ? yearFilteredReels
        : yearFilteredReels.filter((reel) => getMonthKey(reel) === selectedMonth),
    [yearFilteredReels, selectedMonth]
  );

  const contributors = useMemo(
    () =>
      [...new Set(monthFilteredReels.map((reel) => reel.name).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [monthFilteredReels]
  );

  const filteredReels = useMemo(
    () =>
      selectedContributor === "all"
        ? monthFilteredReels
        : monthFilteredReels.filter((reel) => reel.name === selectedContributor),
    [monthFilteredReels, selectedContributor]
  );

  const tableReels = useMemo(
    () => filteredReels.filter(isInstagramReel),
    [filteredReels]
  );

  const sortedReels = useMemo(
    () => sortReels(tableReels, sortKey, ascending),
    [tableReels, sortKey, ascending]
  );

  const fullRanking = useMemo(
    () => sortReels(monthFilteredReels, "score", false),
    [monthFilteredReels]
  );
  const monthLeaders = useMemo(
    () => buildContributorLeaders(monthFilteredReels.filter(isInstagramReel)),
    [monthFilteredReels]
  );
  const totals = useMemo(() => calculateTotals(filteredReels), [filteredReels]);
  const overallTotals = useMemo(
    () => calculateTotals(monthFilteredReels),
    [monthFilteredReels]
  );
  const topPerformer = sortedReels[0];
  const overallTopPerformer = fullRanking[0];
  const monthLeader = monthLeaders[0];
  const activeClipPresentation = activeClip
    ? getClipPresentation(activeClip.clipUrl)
    : null;
  const shouldAnimateHeadlineStats = selectedContributor === "all";
  const selectedMonthLabel =
    selectedMonth === "all" ? "All months" : formatMonthKey(selectedMonth);

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
          reelCount={monthFilteredReels.length}
          lastUpdated={lastUpdated}
          topPerformer={overallTopPerformer}
          totals={overallTotals}
          formatNumber={formatNumber}
          getMomentumScore={getMomentumScore}
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
                  ? `Momentum rankings for ${selectedMonthLabel.toLowerCase()}.`
                  : `${selectedContributor} performance for ${selectedMonthLabel.toLowerCase()}.`}
              </p>
            </div>

            <div className="leaderboard-stage-actions">
              <div className="leaderboard-status-pill">
                <span className="status-dot" aria-hidden="true" />
                {tableReels.length} reels
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

              <label className="filter-control">
                <span className="filter-label">Date</span>
                <select
                  className="filter-select filter-select-date"
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(event.target.value);
                    setSelectedContributor("all");
                  }}
                >
                  <option value="all">All months</option>
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
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
              getMomentumScore={getMomentumScore}
            />
          ) : null}

          {selectedContributor === "all" && monthLeader ? (
            <section className="month-leader-card">
              <div className="month-leader-copy">
                <div className="section-kicker">
                  {selectedMonth === "all" ? "Overall leader" : `${selectedMonthLabel} leader`}
                </div>
                <div className="month-leader-name">{monthLeader.name}</div>
                <p className="month-leader-text">
                  {monthLeader.reelCount} reel{monthLeader.reelCount === 1 ? "" : "s"} tracked
                  with {formatNumber(monthLeader.totals.views)} views and a {formatNumber(Math.round(monthLeader.score))} momentum score.
                </p>
              </div>

              <div className="month-leader-stats">
                <div className="month-leader-stat">
                  <span>Momentum</span>
                  <strong>{formatNumber(Math.round(monthLeader.score))}</strong>
                </div>
                <div className="month-leader-stat">
                  <span>Views</span>
                  <strong>{formatNumber(monthLeader.totals.views)}</strong>
                </div>
                <div className="month-leader-stat">
                  <span>Top reel</span>
                  <strong>{monthLeader.topReel?.reelName || "-"}</strong>
                </div>
              </div>
            </section>
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
              getMomentumScore={getMomentumScore}
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
