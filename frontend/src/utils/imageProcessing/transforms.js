/**
 * Image Transformations for CT/X-Ray Processing
 * Implements transformations from document (ردیف 36-45, 56-59)
 */

/**
 * Apply Gamma correction
 * I_out = c * I_in^γ
 *
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} gamma - Gamma value (< 1 brightens, > 1 darkens)
 * @param {number} c - Constant multiplier (default 1.0)
 * @returns {ImageData} Gamma-corrected image
 */
export const applyGammaCorrection = (imageData, gamma, c = 1.0) => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const normalized = data[i + channel] / 255;
      const corrected = c * Math.pow(normalized, gamma);
      output.data[i + channel] = Math.min(255, Math.max(0, corrected * 255));
    }
    output.data[i + 3] = data[i + 3]; // Copy alpha
  }

  return output;
};

/**
 * Normalize image histogram
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} minOut - Minimum output value (default 0)
 * @param {number} maxOut - Maximum output value (default 255)
 * @returns {ImageData} Normalized image
 */
export const normalizeHistogram = (imageData, minOut = 0, maxOut = 255) => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);

  // Find min and max for each channel
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;

  for (let i = 0; i < data.length; i += 4) {
    minR = Math.min(minR, data[i]);
    maxR = Math.max(maxR, data[i]);
    minG = Math.min(minG, data[i + 1]);
    maxG = Math.max(maxG, data[i + 1]);
    minB = Math.min(minB, data[i + 2]);
    maxB = Math.max(maxB, data[i + 2]);
  }

  // Normalize each channel
  for (let i = 0; i < data.length; i += 4) {
    output.data[i] = normalize(data[i], minR, maxR, minOut, maxOut);
    output.data[i + 1] = normalize(data[i + 1], minG, maxG, minOut, maxOut);
    output.data[i + 2] = normalize(data[i + 2], minB, maxB, minOut, maxOut);
    output.data[i + 3] = data[i + 3];
  }

  return output;
};

/**
 * Normalize single value
 */
const normalize = (value, min, max, minOut, maxOut) => {
  if (max === min) return minOut;
  return ((value - min) / (max - min)) * (maxOut - minOut) + minOut;
};

/**
 * Histogram equalization
 * @param {ImageData} imageData - Canvas ImageData
 * @returns {ImageData} Equalized image
 */
export const equalizeHistogram = (imageData) => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const totalPixels = width * height;

  // Convert to grayscale and calculate histogram
  const histogram = new Array(256).fill(0);
  const grayData = [];

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
    grayData.push(gray);
    histogram[gray]++;
  }

  // Calculate cumulative distribution function (CDF)
  const cdf = new Array(256).fill(0);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }

  // Find minimum non-zero CDF value
  const cdfMin = cdf.find(val => val > 0);

  // Create equalization lookup table
  const lut = new Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255);
  }

  // Apply equalization
  for (let i = 0; i < data.length; i += 4) {
    const grayIdx = Math.floor(i / 4);
    const equalizedValue = lut[grayData[grayIdx]];

    output.data[i] = equalizedValue;
    output.data[i + 1] = equalizedValue;
    output.data[i + 2] = equalizedValue;
    output.data[i + 3] = data[i + 3];
  }

  return output;
};

/**
 * Invert image (Positive/Negative)
 * Using logarithm: -log(I/I0)
 *
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} maxIntensity - Maximum intensity (I0)
 * @returns {ImageData} Inverted image
 */
export const invertImage = (imageData, maxIntensity = 255) => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const intensity = data[i + channel];
      const ratio = intensity / maxIntensity;
      const inverted = -Math.log(ratio + 0.001); // Add small value to avoid log(0)
      const normalized = (inverted / 7) * 255; // Normalize to 0-255
      output.data[i + channel] = Math.min(255, Math.max(0, normalized));
    }
    output.data[i + 3] = data[i + 3];
  }

  return output;
};

/**
 * Simple invert (255 - value)
 * @param {ImageData} imageData - Canvas ImageData
 * @returns {ImageData} Inverted image
 */
export const invertImageSimple = (imageData) => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    output.data[i] = 255 - data[i];
    output.data[i + 1] = 255 - data[i + 1];
    output.data[i + 2] = 255 - data[i + 2];
    output.data[i + 3] = data[i + 3];
  }

  return output;
};

/**
 * Apply window/level adjustment (narrow & wide)
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} windowCenter - Window center (level)
 * @param {number} windowWidth - Window width
 * @returns {ImageData} Windowed image
 */
export const applyWindowLevel = (imageData, windowCenter, windowWidth) => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);

  const windowMin = windowCenter - windowWidth / 2;
  const windowMax = windowCenter + windowWidth / 2;

  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;

    let adjusted;
    if (gray <= windowMin) {
      adjusted = 0;
    } else if (gray >= windowMax) {
      adjusted = 255;
    } else {
      adjusted = ((gray - windowMin) / windowWidth) * 255;
    }

    output.data[i] = adjusted;
    output.data[i + 1] = adjusted;
    output.data[i + 2] = adjusted;
    output.data[i + 3] = data[i + 3];
  }

  return output;
};

/**
 * Pixel binning (reduce resolution)
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} binSize - Binning size (2, 3, 4)
 * @returns {ImageData} Binned image
 */
export const applyPixelBinning = (imageData, binSize = 2) => {
  const { width, height, data } = imageData;
  const newWidth = Math.floor(width / binSize);
  const newHeight = Math.floor(height / binSize);

  const output = new ImageData(newWidth, newHeight);

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      let r = 0, g = 0, b = 0, count = 0;

      // Average pixels in bin
      for (let by = 0; by < binSize; by++) {
        for (let bx = 0; bx < binSize; bx++) {
          const srcX = x * binSize + bx;
          const srcY = y * binSize + by;

          if (srcX < width && srcY < height) {
            const srcIdx = (srcY * width + srcX) * 4;
            r += data[srcIdx];
            g += data[srcIdx + 1];
            b += data[srcIdx + 2];
            count++;
          }
        }
      }

      const outIdx = (y * newWidth + x) * 4;
      output.data[outIdx] = r / count;
      output.data[outIdx + 1] = g / count;
      output.data[outIdx + 2] = b / count;
      output.data[outIdx + 3] = 255;
    }
  }

  return output;
};

/**
 * Rotate image
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} angle - Rotation angle (90, 180, 270)
 * @returns {ImageData} Rotated image
 */
export const rotateImage = (imageData, angle) => {
  const { width, height, data } = imageData;

  if (angle === 90 || angle === 270) {
    // Swap dimensions
    const output = new ImageData(height, width);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        let destX, destY;

        if (angle === 90) {
          destX = height - 1 - y;
          destY = x;
        } else {
          destX = y;
          destY = width - 1 - x;
        }

        const destIdx = (destY * height + destX) * 4;
        output.data[destIdx] = data[srcIdx];
        output.data[destIdx + 1] = data[srcIdx + 1];
        output.data[destIdx + 2] = data[srcIdx + 2];
        output.data[destIdx + 3] = data[srcIdx + 3];
      }
    }

    return output;
  } else if (angle === 180) {
    const output = new ImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const destX = width - 1 - x;
        const destY = height - 1 - y;
        const destIdx = (destY * width + destX) * 4;

        output.data[destIdx] = data[srcIdx];
        output.data[destIdx + 1] = data[srcIdx + 1];
        output.data[destIdx + 2] = data[srcIdx + 2];
        output.data[destIdx + 3] = data[srcIdx + 3];
      }
    }

    return output;
  }

  return imageData;
};

/**
 * Mirror image (flip)
 * @param {ImageData} imageData - Canvas ImageData
 * @param {string} direction - 'horizontal' or 'vertical'
 * @returns {ImageData} Mirrored image
 */
export const mirrorImage = (imageData, direction = 'horizontal') => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      let destX, destY;

      if (direction === 'horizontal') {
        destX = width - 1 - x;
        destY = y;
      } else {
        destX = x;
        destY = height - 1 - y;
      }

      const destIdx = (destY * width + destX) * 4;
      output.data[destIdx] = data[srcIdx];
      output.data[destIdx + 1] = data[srcIdx + 1];
      output.data[destIdx + 2] = data[srcIdx + 2];
      output.data[destIdx + 3] = data[srcIdx + 3];
    }
  }

  return output;
};

/**
 * Create HDR image from multiple exposures
 * @param {Array<ImageData>} images - Array of images at different exposures
 * @param {Array<number>} exposureTimes - Exposure times for each image
 * @returns {ImageData} HDR image
 */
export const createHDR = (images, exposureTimes) => {
  if (images.length === 0) return null;

  const { width, height } = images[0];
  const output = new ImageData(width, height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    let r = 0, g = 0, b = 0, weight = 0;

    for (let j = 0; j < images.length; j++) {
      const data = images[j].data;
      const exposure = exposureTimes[j];

      // Simple weight based on distance from middle gray
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const w = 1 - Math.abs(gray - 128) / 128;

      r += (data[idx] / exposure) * w;
      g += (data[idx + 1] / exposure) * w;
      b += (data[idx + 2] / exposure) * w;
      weight += w;
    }

    if (weight > 0) {
      output.data[idx] = Math.min(255, (r / weight) * exposureTimes[0]);
      output.data[idx + 1] = Math.min(255, (g / weight) * exposureTimes[0]);
      output.data[idx + 2] = Math.min(255, (b / weight) * exposureTimes[0]);
      output.data[idx + 3] = 255;
    }
  }

  return output;
};
