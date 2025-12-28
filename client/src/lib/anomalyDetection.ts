/**
 * Simple anomaly detection using statistical methods
 */

export interface AnomalyResult {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  zScore: number;
}

/**
 * Detect anomalies using Z-score method
 * @param value - Current value to check
 * @param dataset - Historical dataset for comparison
 * @param threshold - Z-score threshold (default: 2 for 95% confidence)
 */
export function detectAnomaly(
  value: number,
  dataset: number[],
  threshold: number = 2
): AnomalyResult {
  if (dataset.length < 3) {
    return { isAnomaly: false, severity: 'low', zScore: 0 };
  }

  // Calculate mean
  const mean = dataset.reduce((sum, val) => sum + val, 0) / dataset.length;

  // Calculate standard deviation
  const variance =
    dataset.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    dataset.length;
  const stdDev = Math.sqrt(variance);

  // Avoid division by zero
  if (stdDev === 0) {
    return { isAnomaly: false, severity: 'low', zScore: 0 };
  }

  // Calculate Z-score
  const zScore = Math.abs((value - mean) / stdDev);

  // Determine if anomaly and severity
  const isAnomaly = zScore > threshold;
  let severity: 'low' | 'medium' | 'high' = 'low';

  if (zScore > threshold * 2) {
    severity = 'high';
  } else if (zScore > threshold * 1.5) {
    severity = 'medium';
  }

  return { isAnomaly, severity, zScore };
}

/**
 * Detect trend anomalies (sudden changes in direction)
 */
export function detectTrendAnomaly(
  currentValue: number,
  previousValue: number,
  historicalChanges: number[]
): AnomalyResult {
  const change = currentValue - previousValue;
  const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  return detectAnomaly(percentChange, historicalChanges, 1.5);
}

/**
 * Get anomaly indicator color
 */
export function getAnomalyColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return 'text-red-500 bg-red-500/10 border-red-500/50';
    case 'medium':
      return 'text-orange-500 bg-orange-500/10 border-orange-500/50';
    default:
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/50';
  }
}
