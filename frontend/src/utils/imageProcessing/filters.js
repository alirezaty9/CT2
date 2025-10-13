/**
 * Image Filters for CT/X-Ray Processing
 * Implements filters from document (ردیف 47-54)
 * Uses image-js for lightweight operations
 */

/**
 * Apply Gaussian filter
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} sigma - Gaussian sigma parameter (default: 1.0)
 * @returns {ImageData} Filtered image data
 */
export const applyGaussianFilter = (imageData, sigma = 1.0) => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);

  // Calculate kernel size based on sigma
  const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
  const kernel = generateGaussianKernel(kernelSize, sigma);

  // Apply convolution
  applyConvolution(data, output.data, width, height, kernel, kernelSize);

  return output;
};

/**
 * Generate Gaussian kernel
 * @param {number} size - Kernel size (must be odd)
 * @param {number} sigma - Standard deviation
 * @returns {Array} 2D kernel
 */
const generateGaussianKernel = (size, sigma) => {
  const kernel = [];
  const center = Math.floor(size / 2);
  let sum = 0;

  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      kernel[y][x] = value;
      sum += value;
    }
  }

  // Normalize kernel
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }

  return kernel;
};

/**
 * Apply Median filter (noise reduction)
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} kernelSize - Kernel size (3, 5, 7, etc.)
 * @returns {ImageData} Filtered image data
 */
export const applyMedianFilter = (imageData, kernelSize = 3) => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const radius = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rValues = [];
      const gValues = [];
      const bValues = [];

      // Collect neighborhood values
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const ny = Math.min(Math.max(y + ky, 0), height - 1);
          const nx = Math.min(Math.max(x + kx, 0), width - 1);
          const idx = (ny * width + nx) * 4;

          rValues.push(data[idx]);
          gValues.push(data[idx + 1]);
          bValues.push(data[idx + 2]);
        }
      }

      // Calculate median
      const outIdx = (y * width + x) * 4;
      output.data[outIdx] = median(rValues);
      output.data[outIdx + 1] = median(gValues);
      output.data[outIdx + 2] = median(bValues);
      output.data[outIdx + 3] = data[outIdx + 3]; // Copy alpha
    }
  }

  return output;
};

/**
 * Calculate median of array
 */
const median = (arr) => {
  const sorted = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * Apply Mean filter (blur)
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} kernelSize - Kernel size
 * @returns {ImageData} Filtered image data
 */
export const applyMeanFilter = (imageData, kernelSize = 3) => {
  const kernel = [];
  const value = 1 / (kernelSize * kernelSize);

  for (let y = 0; y < kernelSize; y++) {
    kernel[y] = [];
    for (let x = 0; x < kernelSize; x++) {
      kernel[y][x] = value;
    }
  }

  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  applyConvolution(data, output.data, width, height, kernel, kernelSize);

  return output;
};

/**
 * Apply Sobel edge detection
 * @param {ImageData} imageData - Canvas ImageData
 * @returns {ImageData} Edge-detected image
 */
export const applySobelEdgeDetection = (imageData) => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);

  // Sobel kernels
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  // Convert to grayscale first
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.round((data[idx] + data[idx + 1] + data[idx + 2]) / 3);
  }

  // Apply Sobel
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx));
          gx += gray[idx] * sobelX[ky + 1][kx + 1];
          gy += gray[idx] * sobelY[ky + 1][kx + 1];
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const outIdx = (y * width + x) * 4;
      output.data[outIdx] = magnitude;
      output.data[outIdx + 1] = magnitude;
      output.data[outIdx + 2] = magnitude;
      output.data[outIdx + 3] = 255;
    }
  }

  return output;
};

/**
 * Apply Laplacian edge detection
 * @param {ImageData} imageData - Canvas ImageData
 * @returns {ImageData} Edge-detected image
 */
export const applyLaplacianEdgeDetection = (imageData) => {
  const kernel = [
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0]
  ];

  const { width, height, data } = imageData;
  const output = new ImageData(width, height);

  // Convert to grayscale
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.round((data[idx] + data[idx + 1] + data[idx + 2]) / 3);
  }

  // Apply Laplacian
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx));
          sum += gray[idx] * kernel[ky + 1][kx + 1];
        }
      }

      const value = Math.abs(sum);
      const outIdx = (y * width + x) * 4;
      output.data[outIdx] = value;
      output.data[outIdx + 1] = value;
      output.data[outIdx + 2] = value;
      output.data[outIdx + 3] = 255;
    }
  }

  return output;
};

/**
 * Apply Unsharp Masking (Sharpening)
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} amount - Sharpening amount (0-2, default 1.0)
 * @param {number} sigma - Gaussian blur sigma (default 1.0)
 * @returns {ImageData} Sharpened image
 */
export const applyUnsharpMask = (imageData, amount = 1.0, sigma = 1.0) => {
  const { width, height, data } = imageData;

  // Create blurred version
  const blurred = applyGaussianFilter(imageData, sigma);

  // Sharpen: original + amount * (original - blurred)
  const output = new ImageData(width, height);

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const original = data[i + c];
      const blur = blurred.data[i + c];
      const sharpened = original + amount * (original - blur);
      output.data[i + c] = Math.min(255, Math.max(0, sharpened));
    }
    output.data[i + 3] = data[i + 3]; // Copy alpha
  }

  return output;
};

/**
 * Apply custom convolution kernel
 * @param {Uint8ClampedArray} input - Input pixel data
 * @param {Uint8ClampedArray} output - Output pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Array} kernel - 2D kernel
 * @param {number} kernelSize - Kernel size
 */
const applyConvolution = (input, output, width, height, kernel, kernelSize) => {
  const radius = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;

      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const ny = Math.min(Math.max(y + ky - radius, 0), height - 1);
          const nx = Math.min(Math.max(x + kx - radius, 0), width - 1);
          const idx = (ny * width + nx) * 4;
          const weight = kernel[ky][kx];

          r += input[idx] * weight;
          g += input[idx + 1] * weight;
          b += input[idx + 2] * weight;
        }
      }

      const outIdx = (y * width + x) * 4;
      output[outIdx] = Math.min(255, Math.max(0, r));
      output[outIdx + 1] = Math.min(255, Math.max(0, g));
      output[outIdx + 2] = Math.min(255, Math.max(0, b));
      output[outIdx + 3] = input[outIdx + 3];
    }
  }
};

/**
 * Apply variance filter
 * @param {ImageData} imageData - Canvas ImageData
 * @param {number} kernelSize - Kernel size
 * @returns {ImageData} Filtered image
 */
export const applyVarianceFilter = (imageData, kernelSize = 3) => {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const radius = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const values = [];

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const ny = Math.min(Math.max(y + ky, 0), height - 1);
          const nx = Math.min(Math.max(x + kx, 0), width - 1);
          const idx = (ny * width + nx) * 4;
          values.push((data[idx] + data[idx + 1] + data[idx + 2]) / 3);
        }
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;

      const outIdx = (y * width + x) * 4;
      const val = Math.sqrt(variance);
      output.data[outIdx] = val;
      output.data[outIdx + 1] = val;
      output.data[outIdx + 2] = val;
      output.data[outIdx + 3] = 255;
    }
  }

  return output;
};

/**
 * Get available filters list
 * @returns {Array} List of available filters
 */
export const getAvailableFilters = () => {
  return [
    { id: 'gaussian', name: 'Gaussian Blur', params: ['sigma'] },
    { id: 'median', name: 'Median Filter', params: ['kernelSize'] },
    { id: 'mean', name: 'Mean Filter', params: ['kernelSize'] },
    { id: 'sobel', name: 'Sobel Edge Detection', params: [] },
    { id: 'laplacian', name: 'Laplacian Edge Detection', params: [] },
    { id: 'unsharp', name: 'Unsharp Mask (Sharpen)', params: ['amount', 'sigma'] },
    { id: 'variance', name: 'Variance Filter', params: ['kernelSize'] }
  ];
};
