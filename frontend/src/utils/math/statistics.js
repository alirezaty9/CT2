/**
 * Statistical calculations for image analysis
 * Supports 8-bit and 16-bit images
 */

/**
 * Calculate mean (average) of pixel values
 * @param {Array|Uint8Array|Uint16Array} data - Pixel data
 * @returns {number} Mean value
 */
export const calculateMean = (data) => {
  if (!data || data.length === 0) return 0;
  const sum = data.reduce((acc, val) => acc + val, 0);
  return sum / data.length;
};

/**
 * Calculate minimum value
 * @param {Array|Uint8Array|Uint16Array} data - Pixel data
 * @returns {number} Minimum value
 */
export const calculateMin = (data) => {
  if (!data || data.length === 0) return 0;
  let min = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i] < min) min = data[i];
  }
  return min;
};

/**
 * Calculate maximum value
 * @param {Array|Uint8Array|Uint16Array} data - Pixel data
 * @returns {number} Maximum value
 */
export const calculateMax = (data) => {
  if (!data || data.length === 0) return 0;
  let max = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i] > max) max = data[i];
  }
  return max;
};

/**
 * Calculate standard deviation
 * @param {Array|Uint8Array|Uint16Array} data - Pixel data
 * @param {number} mean - Pre-calculated mean (optional)
 * @returns {number} Standard deviation
 */
export const calculateStdDev = (data, mean = null) => {
  if (!data || data.length === 0) return 0;

  const avg = mean !== null ? mean : calculateMean(data);
  const squaredDiffs = data.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;

  return Math.sqrt(variance);
};

/**
 * Calculate median
 * @param {Array|Uint8Array|Uint16Array} data - Pixel data
 * @returns {number} Median value
 */
export const calculateMedian = (data) => {
  if (!data || data.length === 0) return 0;

  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

/**
 * Calculate all basic statistics at once
 * @param {Array|Uint8Array|Uint16Array} data - Pixel data
 * @returns {Object} Statistics object
 */
export const calculateStatistics = (data) => {
  if (!data || data.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      variance: 0,
      count: 0
    };
  }

  const mean = calculateMean(data);
  const min = calculateMin(data);
  const max = calculateMax(data);
  const median = calculateMedian(data);
  const stdDev = calculateStdDev(data, mean);
  const variance = stdDev * stdDev;

  return {
    mean,
    median,
    min,
    max,
    stdDev,
    variance,
    count: data.length
  };
};

/**
 * Calculate histogram from image data
 * @param {Array|Uint8Array|Uint16Array} data - Pixel data
 * @param {number} bins - Number of bins (256 for 8-bit, 65536 for 16-bit)
 * @param {number} maxValue - Maximum possible value (255 for 8-bit, 65535 for 16-bit)
 * @returns {Array} Histogram array
 */
export const calculateHistogram = (data, bins = 256, maxValue = 255) => {
  const histogram = new Array(bins).fill(0);

  for (let i = 0; i < data.length; i++) {
    const binIndex = Math.floor((data[i] / maxValue) * (bins - 1));
    histogram[binIndex]++;
  }

  return histogram;
};

/**
 * Normalize data to 0-1 range
 * @param {Array|Uint8Array|Uint16Array} data - Pixel data
 * @param {number} min - Minimum value (optional, auto-calculated if not provided)
 * @param {number} max - Maximum value (optional, auto-calculated if not provided)
 * @returns {Array} Normalized data
 */
export const normalizeData = (data, min = null, max = null) => {
  if (!data || data.length === 0) return [];

  const minVal = min !== null ? min : calculateMin(data);
  const maxVal = max !== null ? max : calculateMax(data);
  const range = maxVal - minVal;

  if (range === 0) return data.map(() => 0);

  return data.map(val => (val - minVal) / range);
};

/**
 * Calculate percentile
 * @param {Array|Uint8Array|Uint16Array} data - Pixel data
 * @param {number} percentile - Percentile to calculate (0-100)
 * @returns {number} Percentile value
 */
export const calculatePercentile = (data, percentile) => {
  if (!data || data.length === 0) return 0;
  if (percentile < 0 || percentile > 100) return 0;

  const sorted = [...data].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;

  return sorted[Math.max(0, index)];
};
