export function MetaAdsCampaignScore({ score, comparisonReason }) {
  return (
    <section className="analytics-breakdown-card meta-ads-score-card">
      <div>
        <span>Campaign Score</span>
        <strong>{score.label}</strong>
      </div>
      <p>{score.explanation}</p>
      {score.limited ? <small>Score based on limited data.</small> : null}
      {comparisonReason ? <small>{comparisonReason}</small> : null}
    </section>
  );
}
