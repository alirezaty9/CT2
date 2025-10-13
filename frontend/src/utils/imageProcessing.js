// utils/imageProcessing.js - واقعی‌سازی پردازش تصویر با image-js
import { Image } from 'image-js';

/**
 * کلاس پردازش تصویر واقعی
 */
class ImageProcessor {
  constructor() {
    this.originalImage = null;
    this.processedImage = null;
  }

  /**
   * بارگذاری تصویر از URL یا ArrayBuffer
   */
  async loadImage(source) {
    try {
      if (typeof source === 'string') {
        // بارگذاری از URL
        this.originalImage = await Image.load(source);
      } else if (source instanceof ArrayBuffer) {
        // بارگذاری از ArrayBuffer
        this.originalImage = await Image.load(source);
      } else if (source instanceof Uint8Array) {
        // بارگذاری از Uint8Array
        const blob = new Blob([source]);
        const url = URL.createObjectURL(blob);
        this.originalImage = await Image.load(url);
        URL.revokeObjectURL(url);
      }
      this.processedImage = this.originalImage.clone();
      return this.originalImage;
    } catch (error) {
      console.error('Error loading image:', error);
      throw error;
    }
  }

  /**
   * ریست تصویر به حالت اولیه
   */
  reset() {
    if (this.originalImage) {
      this.processedImage = this.originalImage.clone();
    }
  }

  /**
   * دریافت تصویر به صورت Data URL
   */
  getImageDataURL(useProcessed = true) {
    const image = useProcessed ? this.processedImage : this.originalImage;
    if (!image) return null;
    return image.toDataURL();
  }

  /**
   * فیلتر کاهش نویز - Gaussian
   */
  applyGaussianFilter(sigma = 1.0) {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.gaussianFilter({ sigma });
      return this.getImageDataURL();
    } catch (error) {
      console.error('Gaussian filter error:', error);
      throw error;
    }
  }

  /**
   * فیلتر میانه (Median)
   */
  applyMedianFilter(kernelSize = 3) {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.medianFilter({
        borderType: Image.BORDER_REPLICATE
      });
      return this.getImageDataURL();
    } catch (error) {
      console.error('Median filter error:', error);
      throw error;
    }
  }

  /**
   * فیلتر میانگین (Mean/Box Blur)
   */
  applyMeanFilter(kernelSize = 3) {
    if (!this.processedImage) return;
    try {
      const radius = Math.floor(kernelSize / 2);
      this.processedImage = this.processedImage.blurFilter({ radius });
      return this.getImageDataURL();
    } catch (error) {
      console.error('Mean filter error:', error);
      throw error;
    }
  }

  /**
   * تشخیص لبه - Sobel
   */
  applySobelFilter() {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.sobelFilter();
      return this.getImageDataURL();
    } catch (error) {
      console.error('Sobel filter error:', error);
      throw error;
    }
  }

  /**
   * تشخیص لبه - Gradient
   */
  applyGradientFilter() {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.gradientFilter();
      return this.getImageDataURL();
    } catch (error) {
      console.error('Gradient filter error:', error);
      throw error;
    }
  }

  /**
   * تیزسازی (Sharpen)
   */
  applySharpen(factor = 1) {
    if (!this.processedImage) return;
    try {
      // Unsharp mask technique
      const blurred = this.processedImage.gaussianFilter({ sigma: 1.0 });

      // تفاضل
      const sharpened = this.processedImage.clone();
      for (let i = 0; i < sharpened.data.length; i++) {
        const diff = this.processedImage.data[i] - blurred.data[i];
        sharpened.data[i] = Math.max(0, Math.min(255,
          this.processedImage.data[i] + factor * diff
        ));
      }

      this.processedImage = sharpened;
      return this.getImageDataURL();
    } catch (error) {
      console.error('Sharpen error:', error);
      throw error;
    }
  }

  /**
   * یکسان‌سازی هیستوگرام (Histogram Equalization)
   */
  applyHistogramEqualization() {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.equalize();
      return this.getImageDataURL();
    } catch (error) {
      console.error('Histogram equalization error:', error);
      throw error;
    }
  }

  /**
   * معکوس کردن (Invert)
   */
  applyInvert() {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.invert();
      return this.getImageDataURL();
    } catch (error) {
      console.error('Invert error:', error);
      throw error;
    }
  }

  /**
   * چرخش تصویر
   */
  applyRotation(angle) {
    if (!this.processedImage) return;
    try {
      // تبدیل زاویه به رادیان
      const radians = (angle * Math.PI) / 180;
      this.processedImage = this.processedImage.rotate(radians);
      return this.getImageDataURL();
    } catch (error) {
      console.error('Rotation error:', error);
      throw error;
    }
  }

  /**
   * آینه کردن افقی
   */
  applyFlipHorizontal() {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.flipX();
      return this.getImageDataURL();
    } catch (error) {
      console.error('Flip horizontal error:', error);
      throw error;
    }
  }

  /**
   * آینه کردن عمودی
   */
  applyFlipVertical() {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.flipY();
      return this.getImageDataURL();
    } catch (error) {
      console.error('Flip vertical error:', error);
      throw error;
    }
  }

  /**
   * تنظیم روشنایی
   */
  adjustBrightness(value) {
    if (!this.processedImage) return;
    try {
      // value: -100 to 100
      const adjusted = this.processedImage.clone();
      const delta = (value / 100) * 128; // تبدیل به مقیاس 0-128

      for (let i = 0; i < adjusted.data.length; i++) {
        adjusted.data[i] = Math.max(0, Math.min(255, adjusted.data[i] + delta));
      }

      this.processedImage = adjusted;
      return this.getImageDataURL();
    } catch (error) {
      console.error('Brightness adjustment error:', error);
      throw error;
    }
  }

  /**
   * تنظیم کنتراست
   */
  adjustContrast(value) {
    if (!this.processedImage) return;
    try {
      // value: -100 to 100
      const factor = (259 * (value + 255)) / (255 * (259 - value));
      const adjusted = this.processedImage.clone();

      for (let i = 0; i < adjusted.data.length; i++) {
        const newValue = factor * (adjusted.data[i] - 128) + 128;
        adjusted.data[i] = Math.max(0, Math.min(255, newValue));
      }

      this.processedImage = adjusted;
      return this.getImageDataURL();
    } catch (error) {
      console.error('Contrast adjustment error:', error);
      throw error;
    }
  }

  /**
   * Threshold (آستانه‌گذاری)
   */
  applyThreshold(threshold = 128) {
    if (!this.processedImage) return;
    try {
      // تبدیل به grayscale اگر نیست
      let gray = this.processedImage.grey();

      const binary = gray.clone();
      for (let i = 0; i < binary.data.length; i++) {
        binary.data[i] = binary.data[i] > threshold ? 255 : 0;
      }

      this.processedImage = binary;
      return this.getImageDataURL();
    } catch (error) {
      console.error('Threshold error:', error);
      throw error;
    }
  }

  /**
   * تبدیل به Grayscale
   */
  convertToGrayscale() {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.grey();
      return this.getImageDataURL();
    } catch (error) {
      console.error('Grayscale conversion error:', error);
      throw error;
    }
  }

  /**
   * Morphological Operations - Erosion
   */
  applyErosion(kernelSize = 3) {
    if (!this.processedImage) return;
    try {
      // ساده‌سازی شده - برای morphology واقعی باید از OpenCV استفاده شود
      this.processedImage = this.processedImage.erode({
        iterations: 1
      });
      return this.getImageDataURL();
    } catch (error) {
      console.error('Erosion error:', error);
      throw error;
    }
  }

  /**
   * Morphological Operations - Dilation
   */
  applyDilation(kernelSize = 3) {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.dilate({
        iterations: 1
      });
      return this.getImageDataURL();
    } catch (error) {
      console.error('Dilation error:', error);
      throw error;
    }
  }

  /**
   * Crop تصویر
   */
  cropImage(x, y, width, height) {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.crop({
        x: Math.floor(x),
        y: Math.floor(y),
        width: Math.floor(width),
        height: Math.floor(height)
      });
      return this.getImageDataURL();
    } catch (error) {
      console.error('Crop error:', error);
      throw error;
    }
  }

  /**
   * Resize تصویر
   */
  resizeImage(width, height) {
    if (!this.processedImage) return;
    try {
      this.processedImage = this.processedImage.resize({
        width: Math.floor(width),
        height: Math.floor(height)
      });
      return this.getImageDataURL();
    } catch (error) {
      console.error('Resize error:', error);
      throw error;
    }
  }

  /**
   * محاسبه هیستوگرام
   */
  calculateHistogram() {
    if (!this.processedImage) return null;
    try {
      const histogram = this.processedImage.getHistogram();
      return histogram;
    } catch (error) {
      console.error('Histogram calculation error:', error);
      return null;
    }
  }

  /**
   * محاسبه آمار تصویر
   */
  calculateStatistics() {
    if (!this.processedImage) return null;
    try {
      const stats = {
        width: this.processedImage.width,
        height: this.processedImage.height,
        channels: this.processedImage.channels,
        bitDepth: this.processedImage.bitDepth,
        mean: this.processedImage.mean,
        median: this.processedImage.median,
        min: this.processedImage.min,
        max: this.processedImage.max,
        std: this.processedImage.std
      };
      return stats;
    } catch (error) {
      console.error('Statistics calculation error:', error);
      return null;
    }
  }

  /**
   * ذخیره تصویر
   */
  async saveImage(filename = 'processed_image.png') {
    if (!this.processedImage) return;
    try {
      const dataUrl = this.getImageDataURL();

      // تبدیل data URL به blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // ایجاد لینک دانلود
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Save image error:', error);
      throw error;
    }
  }
}

// Export یک instance singleton
const imageProcessor = new ImageProcessor();
export default imageProcessor;

// Export کلاس هم برای استفاده‌های خاص
export { ImageProcessor };
