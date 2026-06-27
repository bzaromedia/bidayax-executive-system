export function formatScore(value: number) {
  return `${Math.round(value)}`;
}

export function formatImprovementLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPercentFromRate(value: number) {
  return `${Math.round(value * 100)}%`;
}
