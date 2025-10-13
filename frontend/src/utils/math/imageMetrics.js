/**
 * Image quality metrics for CT/X-Ray analysis
 * Based on CT Scanner document requirements (ردیف 27, 34, 35)
 */

import { calculateMean, calculateStdDev } from './statistics.js';

/**
 * Calculate Signal-to-Noise Ratio (SNR)
 * SNR = Mean / StdDev
 *
 * @param {Array|Uint8Array|Uint16Array} roiData - ROI pixel data
 * @returns {number} SNR value
 */
export const calculateSNR = (roiData) => {
  if (!roiData || roiData.length === 0) return 0;

  const mean = calculateMean(roiData);
  const stdDev = calculateStdDev(roiData, mean);

  if (stdDev === 0) return Infinity;

  return mean / stdDev;
};

/**
 * Calculate Contrast-to-Noise Ratio (CNR)
 * CNR = |Mean_a - Mean_b| / StdDev_b
 *
 * @param {Array|Uint8Array|Uint16Array} roiA - First ROI (signal)
 * @param {Array|Uint8Array|Uint16Array} roiB - Second ROI (background)
 * @returns {number} CNR value
 */
export const calculateCNR = (roiA, roiB) => {
  if (!roiA || roiA.length === 0 || !roiB || roiB.length === 0) return 0;

  const meanA = calculateMean(roiA);
  const meanB = calculateMean(roiB);
  const stdDevB = calculateStdDev(roiB);

  if (stdDevB === 0) return Infinity;

  return Math.abs(meanA - meanB) / stdDevB;
};

/**
 * Calculate Transmission Percentage
 * Transmission% = (I / I0) * 100
 *
 * @param {number} intensity - Current intensity (I)
 * @param {number} referenceIntensity - Reference intensity (I0)
 * @returns {number} Transmission percentage
 */
export const calculateTransmission = (intensity, referenceIntensity) => {
  if (referenceIntensity === 0) return 0;
  return (intensity / referenceIntensity) * 100;
};

/**
 * Calculate Transmission% for ROI
 * @param {Array|Uint8Array|Uint16Array} roiData - ROI pixel data
 * @param {Array|Uint8Array|Uint16Array} referenceData - Reference ROI data (I0)
 * @returns {number} Average transmission percentage
 */
export const calculateROITransmission = (roiData, referenceData) => {
  if (!roiData || !referenceData || roiData.length === 0 || referenceData.length === 0) {
    return 0;
  }

  const meanI = calculateMean(roiData);
  const meanI0 = calculateMean(referenceData);

  return calculateTransmission(meanI, meanI0);
};

/**
 * Calculate minimum transmission in ROI
 * @param {Array|Uint8Array|Uint16Array} roiData - ROI pixel data
 * @param {number} referenceIntensity - Reference intensity (I0)
 * @returns {number} Minimum transmission percentage
 */
export const calculateMinTransmission = (roiData, referenceIntensity) => {
  if (!roiData || roiData.length === 0 || referenceIntensity === 0) return 0;

  const minIntensity = Math.min(...roiData);
  return calculateTransmission(minIntensity, referenceIntensity);
};

/**
 * Calculate attenuation coefficient
 * μ = -ln(I/I0) / thickness
 *
 * @param {number} intensity - Transmitted intensity
 * @param {number} referenceIntensity - Incident intensity
 * @param {number} thickness - Material thickness (optional)
 * @returns {number} Attenuation value
 */
export const calculateAttenuation = (intensity, referenceIntensity, thickness = 1) => {
  if (referenceIntensity === 0 || intensity === 0) return 0;

  const ratio = intensity / referenceIntensity;
  return -Math.log(ratio) / thickness;
};

/**
 * Calculate all image metrics at once
 * @param {Object} params - Parameters object
 * @param {Array} params.roiData - ROI pixel data
 * @param {Array} params.backgroundData - Background ROI data (optional)
 * @param {Array} params.referenceData - Reference data for transmission (optional)
 * @param {number} params.referenceIntensity - Reference intensity value (optional)
 * @returns {Object} All metrics
 */
export const calculateAllMetrics = ({
  roiData,
  backgroundData = null,
  referenceData = null,
  referenceIntensity = null
}) => {
  const metrics = {
    snr: 0,
    cnr: 0,
    transmission: 0,
    minTransmission: 0,
    attenuation: 0
  };

  if (!roiData || roiData.length === 0) return metrics;

  // Calculate SNR
  metrics.snr = calculateSNR(roiData);

  // Calculate CNR if background data is provided
  if (backgroundData && backgroundData.length > 0) {
    metrics.cnr = calculateCNR(roiData, backgroundData);
  }

  // Calculate Transmission if reference data is provided
  if (referenceData && referenceData.length > 0) {
    metrics.transmission = calculateROITransmission(roiData, referenceData);
  } else if (referenceIntensity !== null) {
    const meanI = calculateMean(roiData);
    metrics.transmission = calculateTransmission(meanI, referenceIntensity);
    metrics.minTransmission = calculateMinTransmission(roiData, referenceIntensity);
  }

  // Calculate Attenuation
  if (referenceIntensity !== null) {
    const meanI = calculateMean(roiData);
    metrics.attenuation = calculateAttenuation(meanI, referenceIntensity);
  }

  return metrics;
};

/**
 * Calculate image quality index
 * Simple quality metric based on SNR and contrast
 *
 * @param {Array} roiData - ROI pixel data
 * @returns {Object} Quality metrics
 */
export const calculateQualityIndex = (roiData) => {
  if (!roiData || roiData.length === 0) {
    return {
      snr: 0,
      quality: 'N/A',
      score: 0
    };
  }

  const snr = calculateSNR(roiData);
  let quality = 'Poor';
  let score = 0;

  if (snr > 20) {
    quality = 'Excellent';
    score = 5;
  } else if (snr > 10) {
    quality = 'Good';
    score = 4;
  } else if (snr > 5) {
    quality = 'Fair';
    score = 3;
  } else if (snr > 2) {
    quality = 'Acceptable';
    score = 2;
  } else if (snr > 1) {
    quality = 'Poor';
    score = 1;
  }

  return {
    snr,
    quality,
    score
  };
};
