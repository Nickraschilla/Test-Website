export function CampaignAssessment({ assessment }) {
  const rows = [
    ["Overall result", assessment.overallResult],
    ["Primary strength", assessment.primaryStrength],
    ["Primary weakness", assessment.primaryWeakness],
    ["Recommended next action", assessment.recommendedNextAction],
  ];

  return (
    <section className="analytics-table-card meta-campaign-detail-card">
      <div className="analytics-card-header">
        <strong>Campaign assessment</strong>
      </div>
      <div className="meta-campaign-assessment-list">
        {rows.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
