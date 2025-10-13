/**
 * FFT (Fast Fourier Transform) Operations
 * For frequency domain analysis (ردیف 47-48)
 * Uses fft.js library
 */

import FFT from 'fft.js';

/**
 * Perform 1D FFT on array
 * @param {Array|Float32Array} data - Input data
 * @returns {Object} {real, imaginary, magnitude, phase}
 */
export const fft1D = (data) => {
  const size = data.length;
  const fft = new FFT(size);

  const out = fft.createComplexArray();
  const input = fft.toComplexArray(data);

  fft.transform(out, input);

  // Extract real and imaginary parts
  const real = [];
  const imaginary = [];
  const magnitude = [];
  const phase = [];

  for (let i = 0; i < size; i++) {
    const re = out[i * 2];
    const im = out[i * 2 + 1];

    real.push(re);
    imaginary.push(im);
    magnitude.push(Math.sqrt(re * re + im * im));
    phase.push(Math.atan2(im, re));
  }

  return {
    real,
    imaginary,
    magnitude,
    phase
  };
};

/**
 * Perform 1D Inverse FFT
 * @param {Array} real - Real part
 * @param {Array} imaginary - Imaginary part
 * @returns {Array} Reconstructed signal
 */
export const ifft1D = (real, imaginary) => {
  const size = real.length;
  const fft = new FFT(size);

  const input = [];
  for (let i = 0; i < size; i++) {
    input.push(real[i]);
    input.push(imaginary[i]);
  }

  const out = fft.createComplexArray();
  fft.inverseTransform(out, input);

  const result = [];
  for (let i = 0; i < size; i++) {
    result.push(out[i * 2]); // Take only real part
  }

  return result;
};

/**
 * Perform 2D FFT on image data
 * @param {ImageData} imageData - Canvas ImageData
 * @param {string} channel - Channel to process ('gray', 'r', 'g', 'b')
 * @returns {Object} {real, imaginary, magnitude, phase, width, height}
 */
export const fft2D = (imageData, channel = 'gray') => {
  const { width, height, data } = imageData;

  // Extract channel data
  const input = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    if (channel === 'gray') {
      input[i] = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    } else if (channel === 'r') {
      input[i] = data[idx];
    } else if (channel === 'g') {
      input[i] = data[idx + 1];
    } else if (channel === 'b') {
      input[i] = data[idx + 2];
    }
  }

  // Perform row-wise FFT
  const rowFFT = [];
  for (let y = 0; y < height; y++) {
    const row = input.slice(y * width, (y + 1) * width);
    const fftResult = fft1D(row);
    rowFFT.push(fftResult);
  }

  // Perform column-wise FFT on the result
  const real = new Float32Array(width * height);
  const imaginary = new Float32Array(width * height);
  const magnitude = new Float32Array(width * height);
  const phase = new Float32Array(width * height);

  for (let x = 0; x < width; x++) {
    const colReal = [];
    const colImag = [];

    for (let y = 0; y < height; y++) {
      colReal.push(rowFFT[y].real[x]);
      colImag.push(rowFFT[y].imaginary[x]);
    }

    const colFFT = fft1D(colReal);

    for (let y = 0; y < height; y++) {
      const idx = y * width + x;
      real[idx] = colFFT.real[y];
      imaginary[idx] = colFFT.imaginary[y];
      magnitude[idx] = colFFT.magnitude[y];
      phase[idx] = colFFT.phase[y];
    }
  }

  return {
    real,
    imaginary,
    magnitude,
    phase,
    width,
    height
  };
};

/**
 * Perform 2D Inverse FFT
 * @param {Object} fftData - FFT data from fft2D
 * @returns {Float32Array} Reconstructed image data
 */
export const ifft2D = (fftData) => {
  const { real, imaginary, width, height } = fftData;

  // Perform column-wise inverse FFT
  const colIFFT = [];
  for (let x = 0; x < width; x++) {
    const colReal = [];
    const colImag = [];

    for (let y = 0; y < height; y++) {
      const idx = y * width + x;
      colReal.push(real[idx]);
      colImag.push(imaginary[idx]);
    }

    const ifftResult = ifft1D(colReal, colImag);
    colIFFT.push(ifftResult);
  }

  // Perform row-wise inverse FFT
  const output = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const rowReal = [];
    for (let x = 0; x < width; x++) {
      rowReal.push(colIFFT[x][y]);
    }

    const rowImag = new Array(width).fill(0);
    const rowIFFT = ifft1D(rowReal, rowImag);

    for (let x = 0; x < width; x++) {
      output[y * width + x] = rowIFFT[x];
    }
  }

  return output;
};

/**
 * Apply frequency domain filter
 * @param {Object} fftData - FFT data
 * @param {Function} filterFunc - Filter function (radius, width, height) => multiplier
 * @returns {Object} Filtered FFT data
 */
export const applyFrequencyFilter = (fftData, filterFunc) => {
  const { real, imaginary, width, height } = fftData;
  const centerX = width / 2;
  const centerY = height / 2;

  const filteredReal = new Float32Array(width * height);
  const filteredImag = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const dx = x - centerX;
      const dy = y - centerY;
      const radius = Math.sqrt(dx * dx + dy * dy);

      const multiplier = filterFunc(radius, width, height);

      filteredReal[idx] = real[idx] * multiplier;
      filteredImag[idx] = imaginary[idx] * multiplier;
    }
  }

  return {
    real: filteredReal,
    imaginary: filteredImag,
    width,
    height
  };
};

/**
 * Low-pass filter (removes high frequencies)
 * @param {number} cutoffRadius - Cutoff radius in pixels
 * @returns {Function} Filter function
 */
export const createLowPassFilter = (cutoffRadius) => {
  return (radius) => {
    return radius <= cutoffRadius ? 1 : 0;
  };
};

/**
 * High-pass filter (removes low frequencies)
 * @param {number} cutoffRadius - Cutoff radius in pixels
 * @returns {Function} Filter function
 */
export const createHighPassFilter = (cutoffRadius) => {
  return (radius) => {
    return radius >= cutoffRadius ? 1 : 0;
  };
};

/**
 * Band-pass filter (keeps specific frequency range)
 * @param {number} lowCutoff - Low cutoff radius
 * @param {number} highCutoff - High cutoff radius
 * @returns {Function} Filter function
 */
export const createBandPassFilter = (lowCutoff, highCutoff) => {
  return (radius) => {
    return (radius >= lowCutoff && radius <= highCutoff) ? 1 : 0;
  };
};

/**
 * Gaussian filter in frequency domain
 * @param {number} sigma - Standard deviation
 * @returns {Function} Filter function
 */
export const createGaussianFrequencyFilter = (sigma) => {
  return (radius) => {
    return Math.exp(-(radius * radius) / (2 * sigma * sigma));
  };
};

/**
 * Convert FFT magnitude to displayable image
 * @param {Float32Array} magnitude - FFT magnitude
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {ImageData} Displayable FFT spectrum
 */
export const fftToImage = (magnitude, width, height) => {
  // Apply log transform for better visualization
  const logMagnitude = magnitude.map(m => Math.log(1 + m));

  // Normalize to 0-255
  const max = Math.max(...logMagnitude);
  const normalized = logMagnitude.map(m => (m / max) * 255);

  // Create ImageData
  const imageData = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const val = normalized[i];
    imageData.data[i * 4] = val;
    imageData.data[i * 4 + 1] = val;
    imageData.data[i * 4 + 2] = val;
    imageData.data[i * 4 + 3] = 255;
  }

  return imageData;
};

/**
 * Shift FFT to center (for visualization)
 * @param {Float32Array} data - FFT data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Float32Array} Centered FFT data
 */
export const fftShift = (data, width, height) => {
  const output = new Float32Array(width * height);
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const newX = (x + halfW) % width;
      const newY = (y + halfH) % height;
      output[newY * width + newX] = data[y * width + x];
    }
  }

  return output;
};
