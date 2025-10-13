/**
 * ROI (Region of Interest) Analysis Tools
 * Supports Rectangle, Circle, and custom shape ROIs
 */

import { calculateStatistics } from '../math/statistics.js';
import { calculateAllMetrics } from '../math/imageMetrics.js';

/**
 * Extract pixel data from rectangular ROI
 * @param {ImageData|Object} imageData - Canvas ImageData or custom image object
 * @param {Object} roi - ROI definition {x, y, width, height}
 * @param {string} channel - Channel to extract ('gray', 'r', 'g', 'b', 'alpha')
 * @returns {Array} Pixel values array
 */
export const extractRectangleROI = (imageData, roi, channel = 'gray') => {
  const { x, y, width, height } = roi;
  const pixels = [];

  const data = imageData.data;
  const imgWidth = imageData.width;

  for (let j = y; j < y + height; j++) {
    for (let i = x; i < x + width; i++) {
      const index = (j * imgWidth + i) * 4;

      if (channel === 'gray') {
        // Convert to grayscale
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        pixels.push(Math.round((r + g + b) / 3));
      } else if (channel === 'r') {
        pixels.push(data[index]);
      } else if (channel === 'g') {
        pixels.push(data[index + 1]);
      } else if (channel === 'b') {
        pixels.push(data[index + 2]);
      } else if (channel === 'alpha') {
        pixels.push(data[index + 3]);
      }
    }
  }

  return pixels;
};

/**
 * Extract pixel data from circular ROI
 * @param {ImageData|Object} imageData - Canvas ImageData
 * @param {Object} roi - ROI definition {centerX, centerY, radius}
 * @param {string} channel - Channel to extract
 * @returns {Array} Pixel values array
 */
export const extractCircleROI = (imageData, roi, channel = 'gray') => {
  const { centerX, centerY, radius } = roi;
  const pixels = [];

  const data = imageData.data;
  const imgWidth = imageData.width;

  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(imageData.width, Math.ceil(centerX + radius));
  const minY = Math.max(0, Math.floor(centerY - radius));
  const maxY = Math.min(imageData.height, Math.ceil(centerY + radius));

  for (let j = minY; j < maxY; j++) {
    for (let i = minX; i < maxX; i++) {
      const dx = i - centerX;
      const dy = j - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius) {
        const index = (j * imgWidth + i) * 4;

        if (channel === 'gray') {
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          pixels.push(Math.round((r + g + b) / 3));
        } else if (channel === 'r') {
          pixels.push(data[index]);
        } else if (channel === 'g') {
          pixels.push(data[index + 1]);
        } else if (channel === 'b') {
          pixels.push(data[index + 2]);
        }
      }
    }
  }

  return pixels;
};

/**
 * Calculate ROI area in pixels
 * @param {string} shape - 'rectangle' or 'circle'
 * @param {Object} roi - ROI parameters
 * @returns {number} Area in pixels
 */
export const calculateROIArea = (shape, roi) => {
  if (shape === 'rectangle') {
    return roi.width * roi.height;
  } else if (shape === 'circle') {
    return Math.PI * roi.radius * roi.radius;
  }
  return 0;
};

/**
 * Perform complete ROI analysis
 * @param {ImageData} imageData - Canvas ImageData
 * @param {Object} roi - ROI definition
 * @param {string} shape - ROI shape ('rectangle', 'circle')
 * @param {Object} options - Analysis options
 * @returns {Object} Complete analysis results
 */
export const analyzeROI = (imageData, roi, shape = 'rectangle', options = {}) => {
  const {
    channel = 'gray',
    calculateMetrics = true,
    backgroundROI = null,
    referenceIntensity = null
  } = options;

  // Extract pixel data
  let pixelData;
  if (shape === 'rectangle') {
    pixelData = extractRectangleROI(imageData, roi, channel);
  } else if (shape === 'circle') {
    pixelData = extractCircleROI(imageData, roi, channel);
  } else {
    return null;
  }

  // Calculate basic statistics
  const statistics = calculateStatistics(pixelData);

  // Calculate area
  const area = calculateROIArea(shape, roi);

  // Build result object
  const result = {
    shape,
    roi,
    channel,
    area,
    pixelCount: pixelData.length,
    statistics
  };

  // Calculate image quality metrics if requested
  if (calculateMetrics) {
    let backgroundData = null;
    if (backgroundROI) {
      if (shape === 'rectangle') {
        backgroundData = extractRectangleROI(imageData, backgroundROI, channel);
      } else if (shape === 'circle') {
        backgroundData = extractCircleROI(imageData, backgroundROI, channel);
      }
    }

    const metrics = calculateAllMetrics({
      roiData: pixelData,
      backgroundData,
      referenceIntensity
    });

    result.metrics = metrics;
  }

  return result;
};

/**
 * Extract line profile from image
 * @param {ImageData} imageData - Canvas ImageData
 * @param {Object} line - Line definition {x1, y1, x2, y2}
 * @param {string} channel - Channel to extract
 * @returns {Array} Profile data with {x, y, distance, value}
 */
export const extractLineProfile = (imageData, line, channel = 'gray') => {
  const { x1, y1, x2, y2 } = line;
  const profile = [];

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(length);

  const data = imageData.data;
  const imgWidth = imageData.width;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x1 + dx * t);
    const y = Math.round(y1 + dy * t);

    if (x >= 0 && x < imageData.width && y >= 0 && y < imageData.height) {
      const index = (y * imgWidth + x) * 4;

      let value;
      if (channel === 'gray') {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        value = Math.round((r + g + b) / 3);
      } else if (channel === 'r') {
        value = data[index];
      } else if (channel === 'g') {
        value = data[index + 1];
      } else if (channel === 'b') {
        value = data[index + 2];
      }

      profile.push({
        x,
        y,
        distance: i,
        value
      });
    }
  }

  return profile;
};

/**
 * Compare two ROIs
 * @param {Object} roiAnalysis1 - First ROI analysis result
 * @param {Object} roiAnalysis2 - Second ROI analysis result
 * @returns {Object} Comparison results
 */
export const compareROIs = (roiAnalysis1, roiAnalysis2) => {
  const stats1 = roiAnalysis1.statistics;
  const stats2 = roiAnalysis2.statistics;

  return {
    meanDifference: Math.abs(stats1.mean - stats2.mean),
    meanRatio: stats1.mean / stats2.mean,
    contrastRatio: Math.abs(stats1.mean - stats2.mean) / stats2.stdDev,
    areaDifference: Math.abs(roiAnalysis1.area - roiAnalysis2.area),
    areaRatio: roiAnalysis1.area / roiAnalysis2.area
  };
};

/**
 * Create ROI mask for advanced processing
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} roi - ROI definition
 * @param {string} shape - ROI shape
 * @returns {Uint8Array} Binary mask (1 inside ROI, 0 outside)
 */
export const createROIMask = (width, height, roi, shape) => {
  const mask = new Uint8Array(width * height);

  if (shape === 'rectangle') {
    const { x, y, width: w, height: h } = roi;
    for (let j = y; j < y + h && j < height; j++) {
      for (let i = x; i < x + w && i < width; i++) {
        mask[j * width + i] = 1;
      }
    }
  } else if (shape === 'circle') {
    const { centerX, centerY, radius } = roi;
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const dx = i - centerX;
        const dy = j - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          mask[j * width + i] = 1;
        }
      }
    }
  }

  return mask;
};
