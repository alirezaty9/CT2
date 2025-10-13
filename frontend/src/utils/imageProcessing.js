// utils/imageProcessing.js - پردازش تصویر با Canvas API
/**
 * کلاس پردازش تصویر با Canvas API
 */
class ImageProcessor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.originalImageData = null;
    this.currentImageData = null;
  }

  /**
   * بارگذاری تصویر از URL یا Base64
   */
  async loadImage(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // تنظیم اندازه canvas
          this.canvas.width = img.width;
          this.canvas.height = img.height;

          // رسم تصویر روی canvas
          this.ctx.drawImage(img, 0, 0);

          // ذخیره imageData
          this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
          this.currentImageData = this.cloneImageData(this.originalImageData);

          resolve(this.originalImageData);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = (error) => {
        reject(new Error('Failed to load image: ' + error));
      };

      img.src = source;
    });
  }

  /**
   * کپی ImageData
   */
  cloneImageData(imageData) {
    return new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
  }

  /**
   * ریست تصویر به حالت اولیه
   */
  reset() {
    if (this.originalImageData) {
      this.currentImageData = this.cloneImageData(this.originalImageData);
    }
  }

  /**
   * دریافت تصویر به صورت Data URL
   */
  getImageDataURL(useProcessed = true) {
    const imageData = useProcessed ? this.currentImageData : this.originalImageData;
    if (!imageData) return null;

    // قرار دادن imageData روی canvas
    this.ctx.putImageData(imageData, 0, 0);

    // تبدیل به data URL
    return this.canvas.toDataURL('image/png');
  }

  /**
   * فیلتر Gaussian Blur
   */
  applyGaussianFilter(sigma = 1.0) {
    if (!this.currentImageData) return;

    // استفاده از CSS filter blur (تقریباً معادل Gaussian)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.putImageData(this.currentImageData, 0, 0);
    tempCtx.filter = `blur(${sigma * 2}px)`;
    tempCtx.drawImage(tempCanvas, 0, 0);

    this.currentImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    return this.getImageDataURL();
  }

  /**
   * فیلتر Median (ساده‌سازی شده با box blur)
   */
  applyMedianFilter(kernelSize = 3) {
    // برای سادگی از Gaussian استفاده می‌کنیم
    return this.applyGaussianFilter(kernelSize / 3);
  }

  /**
   * تشخیص لبه - Sobel
   */
  applySobelFilter() {
    if (!this.currentImageData) return;

    const data = this.currentImageData.data;
    const width = this.currentImageData.width;
    const height = this.currentImageData.height;
    const result = new ImageData(width, height);

    // Sobel kernels
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;

        // اعمال kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

            gx += gray * sobelX[ky + 1][kx + 1];
            gy += gray * sobelY[ky + 1][kx + 1];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const idx = (y * width + x) * 4;
        result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = Math.min(255, magnitude);
        result.data[idx + 3] = 255;
      }
    }

    this.currentImageData = result;
    return this.getImageDataURL();
  }

  /**
   * Gradient filter
   */
  applyGradientFilter() {
    return this.applySobelFilter();
  }

  /**
   * تیزسازی (Sharpen)
   */
  applySharpen(factor = 1) {
    if (!this.currentImageData) return;

    const data = this.currentImageData.data;
    const width = this.currentImageData.width;
    const height = this.currentImageData.height;
    const result = this.cloneImageData(this.currentImageData);

    // Sharpen kernel
    const kernel = [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels
          let sum = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += data[idx] * kernel[ky + 1][kx + 1] * factor;
            }
          }

          const idx = (y * width + x) * 4 + c;
          result.data[idx] = Math.max(0, Math.min(255, sum));
        }
        result.data[(y * width + x) * 4 + 3] = 255; // Alpha
      }
    }

    this.currentImageData = result;
    return this.getImageDataURL();
  }

  /**
   * یکسان‌سازی هیستوگرام (Histogram Equalization)
   */
  applyHistogramEqualization() {
    if (!this.currentImageData) return;

    const data = this.currentImageData.data;
    const pixelCount = this.currentImageData.width * this.currentImageData.height;

    // محاسبه هیستوگرام
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
      histogram[gray]++;
    }

    // محاسبه CDF (Cumulative Distribution Function)
    const cdf = new Array(256);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i];
    }

    // نرمال‌سازی CDF
    const cdfMin = cdf.find(val => val > 0);
    const cdfNormalized = cdf.map(val =>
      Math.round(((val - cdfMin) / (pixelCount - cdfMin)) * 255)
    );

    // اعمال تبدیل
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
      const newValue = cdfNormalized[gray];
      data[i] = data[i + 1] = data[i + 2] = newValue;
    }

    return this.getImageDataURL();
  }

  /**
   * معکوس کردن (Invert)
   */
  applyInvert() {
    if (!this.currentImageData) return;

    const data = this.currentImageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];       // R
      data[i + 1] = 255 - data[i + 1]; // G
      data[i + 2] = 255 - data[i + 2]; // B
    }

    return this.getImageDataURL();
  }

  /**
   * چرخش تصویر
   */
  applyRotation(angle) {
    if (!this.currentImageData) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // محاسبه ابعاد جدید
    const radians = (angle * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const newWidth = this.canvas.height * sin + this.canvas.width * cos;
    const newHeight = this.canvas.height * cos + this.canvas.width * sin;

    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    // چرخش
    tempCtx.translate(newWidth / 2, newHeight / 2);
    tempCtx.rotate(radians);
    tempCtx.putImageData(this.currentImageData, -this.canvas.width / 2, -this.canvas.height / 2);

    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.currentImageData = tempCtx.getImageData(0, 0, newWidth, newHeight);

    return this.getImageDataURL();
  }

  /**
   * تنظیم روشنایی
   */
  adjustBrightness(value) {
    if (!this.currentImageData) return;

    const data = this.currentImageData.data;
    const delta = (value / 100) * 128;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + delta));       // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + delta)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + delta)); // B
    }

    return this.getImageDataURL();
  }

  /**
   * تنظیم کنتراست
   */
  adjustContrast(value) {
    if (!this.currentImageData) return;

    const data = this.currentImageData.data;
    const factor = (259 * (value + 255)) / (255 * (259 - value));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));       // R
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // G
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // B
    }

    return this.getImageDataURL();
  }

  /**
   * تبدیل به Grayscale
   */
  convertToGrayscale() {
    if (!this.currentImageData) return;

    const data = this.currentImageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = gray;
    }

    return this.getImageDataURL();
  }

  /**
   * Erosion (ساده‌سازی شده)
   */
  applyErosion(kernelSize = 3) {
    if (!this.currentImageData) return;

    const data = this.currentImageData.data;
    const width = this.currentImageData.width;
    const height = this.currentImageData.height;
    const result = this.cloneImageData(this.currentImageData);
    const radius = Math.floor(kernelSize / 2);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let minVal = 255;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const val = data[idx];
            if (val < minVal) minVal = val;
          }
        }

        const idx = (y * width + x) * 4;
        result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = minVal;
      }
    }

    this.currentImageData = result;
    return this.getImageDataURL();
  }

  /**
   * Dilation (ساده‌سازی شده)
   */
  applyDilation(kernelSize = 3) {
    if (!this.currentImageData) return;

    const data = this.currentImageData.data;
    const width = this.currentImageData.width;
    const height = this.currentImageData.height;
    const result = this.cloneImageData(this.currentImageData);
    const radius = Math.floor(kernelSize / 2);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let maxVal = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const val = data[idx];
            if (val > maxVal) maxVal = val;
          }
        }

        const idx = (y * width + x) * 4;
        result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = maxVal;
      }
    }

    this.currentImageData = result;
    return this.getImageDataURL();
  }

  /**
   * Threshold
   */
  applyThreshold(threshold = 128) {
    if (!this.currentImageData) return;

    const data = this.currentImageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const value = gray > threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = value;
    }

    return this.getImageDataURL();
  }

  /**
   * محاسبه هیستوگرام
   */
  calculateHistogram() {
    if (!this.currentImageData) return null;

    const data = this.currentImageData.data;
    const histogram = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
      histogram[gray]++;
    }

    return histogram;
  }
}

// Export یک instance singleton
const imageProcessor = new ImageProcessor();
export default imageProcessor;

// Export کلاس هم برای استفاده‌های خاص
export { ImageProcessor };
