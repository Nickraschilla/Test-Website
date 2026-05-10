import { useAnimatedNumber } from "../hooks/useAnimatedNumber";

const ICONS = {
  impact: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l2.25 4.56 5.03.73-3.64 3.55.86 5.01L12 14.5l-4.5 2.38.86-5.01-3.64-3.55 5.03-.73L12 3z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  views: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.4 12c2.14-3.65 5.53-5.47 9.6-5.47S19.46 8.35 21.6 12c-2.14 3.65-5.53 5.47-9.6 5.47S4.54 15.65 2.4 12zm9.6 3.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  shares: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 5l6 6-6 6v-4h-2.4c-2.7 0-4.89.87-6.58 2.62C7.1 11.3 10.2 9 14.7 9H15V5z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  comments: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v7a2.5 2.5 0 01-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 014 12.5v-7z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
};

export function MiniStat({
  label,
  value,
  animateValue = false,
  formatValue = defaultFormatter,
  icon = null,
}) {
  const numericValue = Number(value || 0);
  const { displayValue, animationState } = useAnimatedNumber(numericValue, {
    enabled: animateValue,
  });
  const isNumeric = typeof value === "number";
  const renderedValue = isNumeric
    ? formatValue(animateValue ? displayValue : numericValue)
    : value;
  const showTrend = animateValue && isNumeric && animationState !== "idle";
  const iconMarkup = icon && ICONS[icon] ? ICONS[icon] : null;

  return (
    <div className="mini-stat">
      <div className="mini-stat-head">
        {iconMarkup ? <div className="mini-stat-icon">{iconMarkup}</div> : null}
        <div className="mini-stat-label">{label}</div>
      </div>
      <div className="mini-stat-value-row">
        <div className="mini-stat-value">{renderedValue}</div>
        {showTrend ? (
          <TrendIndicator animationState={animationState} />
        ) : null}
      </div>
      <svg className="mini-stat-sparkline" viewBox="0 0 128 32" aria-hidden="true">
        <path className="mini-stat-sparkline-base" d="M2 24 C 20 18, 27 21, 42 14 S 68 10, 80 17 S 105 24, 126 8" />
        <path className="mini-stat-sparkline-line" d="M2 24 C 20 18, 27 21, 42 14 S 68 10, 80 17 S 105 24, 126 8" />
      </svg>
    </div>
  );
}

function TrendIndicator({ animationState }) {
  const isIncrease = animationState === "increase";

  return (
    <span
      className={`stat-trend stat-trend-${animationState}`}
      aria-label={isIncrease ? "Metric increased" : "Metric decreased"}
    >
      {isIncrease ? "▲" : "▼"}
    </span>
  );
}

function defaultFormatter(value) {
  return new Intl.NumberFormat("en-AU").format(Math.round(value));
}
