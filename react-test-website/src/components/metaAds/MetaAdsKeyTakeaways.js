export function MetaAdsKeyTakeaways({ takeaways }) {
  const worked = takeaways.worked.length ? takeaways.worked : ["No clear positive signal is available yet."];
  const attention = takeaways.attention.length ? takeaways.attention : ["No clear attention item is available yet."];

  return (
    <section className="analytics-breakdown-card meta-ads-takeaways">
      <div className="analytics-card-header">
        <strong>Key takeaways</strong>
      </div>
      <div className="meta-ads-takeaway-grid">
        <article>
          <h3>What Worked</h3>
          <ul>
            {worked.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article>
          <h3>Needs Attention</h3>
          <ul>
            {attention.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </div>
    </section>
  );
}
