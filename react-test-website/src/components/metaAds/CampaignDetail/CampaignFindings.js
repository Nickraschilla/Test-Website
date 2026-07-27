export function CampaignFindings({ findings }) {
  const sections = [
    ["What worked", findings.worked],
    ["What needs attention", findings.attention],
  ];

  return (
    <section className="meta-campaign-findings-grid">
      {sections.map(([title, items]) => (
        <article className="analytics-table-card meta-campaign-detail-card" key={title}>
          <div className="analytics-card-header">
            <strong>{title}</strong>
          </div>
          {items.length ? (
            <ul className="meta-campaign-finding-list">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="meta-ads-empty-copy">No supported findings from the current measurable data.</p>
          )}
        </article>
      ))}
    </section>
  );
}
