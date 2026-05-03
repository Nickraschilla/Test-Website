import { useAnimatedNumber } from "../hooks/useAnimatedNumber";

export function StatCard({
  label,
  value,
  accent = false,
  animateValue = false,
  animationKey,
  formatValue = defaultFormatter,
}) {
  const numericValue = Number(value || 0);
  const { displayValue, animationState } = useAnimatedNumber(numericValue, {
    enabled: animateValue,
    changeKey: animationKey,
  });
  const isNumeric = typeof value === "number";
  const renderedValue = animateValue && isNumeric ? formatValue(displayValue) : value;
  const showTrend = animateValue && isNumeric && animationState !== "idle";

  return (
    <div className={`stat-card ${accent ? "stat-card-accent" : ""}`}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value-row">
        <div className="stat-card-value">{renderedValue}</div>
        {showTrend ? <TrendIndicator animationState={animationState} /> : null}
      </div>
    </div>
  );
}

function TrendIndicator({ animationState }) {
  const isIncrease = animationState === "increase";

  return (
    <span
      className={`trend-indicator trend-indicator-${animationState}`}
      aria-label={isIncrease ? "Value increased" : "Value decreased"}
      title={isIncrease ? "Value increased" : "Value decreased"}
    >
      {isIncrease ? "▲" : "▼"}
    </span>
  );
}

function defaultFormatter(value) {
  return Math.round(value).toLocaleString();
}
