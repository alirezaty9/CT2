import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import imageProcessor from '../utils/imageProcessing';
import { useWebSocket } from './WebSocketContext';

const ImageProcessingContext = createContext();

export const useImageProcessing = () => {
  const context = useContext(ImageProcessingContext);
  if (!context) {
    throw new Error('useImageProcessing must be used within ImageProcessingProvider');
  }
  return context;
};

export const ImageProcessingProvider = ({ children }) => {
  const { lastMessage } = useWebSocket();

  // State ها
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageStats, setImageStats] = useState(null);
  const [histogram, setHistogram] = useState(null);
  const [processingHistory, setProcessingHistory] = useState([]);

  // دریافت تصویر از WebSocket
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);

        // اگر پیام شامل تصویر است
        if (data.type === 'image' && data.imageData) {
          loadImageFromBase64(data.imageData);
        }
        // اگر پیام شامل binary data است
        else if (data.type === 'binary' && data.buffer) {
          loadImageFromBuffer(data.buffer);
        }
      } catch (error) {
        // اگر پیام JSON نیست، ممکن است خود تصویر باشد
        if (lastMessage.data instanceof ArrayBuffer) {
          loadImageFromBuffer(lastMessage.data);
        } else if (typeof lastMessage.data === 'string' && lastMessage.data.startsWith('data:image')) {
          loadImageFromBase64(lastMessage.data);
        }
      }
    }
  }, [lastMessage]);

  /**
   * بارگذاری تصویر از Base64
   */
  const loadImageFromBase64 = useCallback(async (base64Data) => {
    setIsProcessing(true);
    try {
      await imageProcessor.loadImage(base64Data);
      const dataUrl = imageProcessor.getImageDataURL(false);
      setOriginalImage(dataUrl);
      setProcessedImage(dataUrl);

      // محاسبه آمار
      const stats = imageProcessor.calculateStatistics();
      setImageStats(stats);

      // محاسبه هیستوگرام
      const hist = imageProcessor.calculateHistogram();
      setHistogram(hist);

      // ریست history
      setProcessingHistory([]);
    } catch (error) {
      console.error('Error loading image from base64:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * بارگذاری تصویر از Buffer
   */
  const loadImageFromBuffer = useCallback(async (buffer) => {
    setIsProcessing(true);
    try {
      await imageProcessor.loadImage(buffer);
      const dataUrl = imageProcessor.getImageDataURL(false);
      setOriginalImage(dataUrl);
      setProcessedImage(dataUrl);

      // محاسبه آمار
      const stats = imageProcessor.calculateStatistics();
      setImageStats(stats);

      // محاسبه هیستوگرام
      const hist = imageProcessor.calculateHistogram();
      setHistogram(hist);

      // ریست history
      setProcessingHistory([]);
    } catch (error) {
      console.error('Error loading image from buffer:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * بارگذاری تصویر از URL
   */
  const loadImageFromUrl = useCallback(async (url) => {
    setIsProcessing(true);
    try {
      await imageProcessor.loadImage(url);
      const dataUrl = imageProcessor.getImageDataURL(false);
      setOriginalImage(dataUrl);
      setProcessedImage(dataUrl);

      // محاسبه آمار
      const stats = imageProcessor.calculateStatistics();
      setImageStats(stats);

      // محاسبه هیستوگرام
      const hist = imageProcessor.calculateHistogram();
      setHistogram(hist);

      // ریست history
      setProcessingHistory([]);
    } catch (error) {
      console.error('Error loading image from URL:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * بارگذاری تصویر از File
   */
  const loadImageFromFile = useCallback(async (file) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        await imageProcessor.loadImage(e.target.result);
        const dataUrl = imageProcessor.getImageDataURL(false);
        setOriginalImage(dataUrl);
        setProcessedImage(dataUrl);

        // محاسبه آمار
        const stats = imageProcessor.calculateStatistics();
        setImageStats(stats);

        // محاسبه هیستوگرام
        const hist = imageProcessor.calculateHistogram();
        setHistogram(hist);

        // ریست history
        setProcessingHistory([]);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error loading image from file:', error);
      setIsProcessing(false);
    }
  }, []);

  /**
   * اعمال فیلتر
   */
  const applyFilter = useCallback(async (filterType, params = {}) => {
    if (!originalImage) {
      console.warn('No image loaded');
      return;
    }

    setIsProcessing(true);
    try {
      let result;

      switch (filterType) {
        case 'gaussian':
          result = imageProcessor.applyGaussianFilter(params.sigma || 1.0);
          break;
        case 'median':
          result = imageProcessor.applyMedianFilter(params.kernelSize || 3);
          break;
        case 'mean':
          result = imageProcessor.applyMeanFilter(params.kernelSize || 3);
          break;
        case 'sobel':
          result = imageProcessor.applySobelFilter();
          break;
        case 'gradient':
          result = imageProcessor.applyGradientFilter();
          break;
        case 'sharpen':
          result = imageProcessor.applySharpen(params.factor || 1);
          break;
        case 'histogramEqualization':
          result = imageProcessor.applyHistogramEqualization();
          break;
        case 'invert':
          result = imageProcessor.applyInvert();
          break;
        case 'rotation':
          result = imageProcessor.applyRotation(params.angle || 0);
          break;
        case 'flipHorizontal':
          result = imageProcessor.applyFlipHorizontal();
          break;
        case 'flipVertical':
          result = imageProcessor.applyFlipVertical();
          break;
        case 'brightness':
          result = imageProcessor.adjustBrightness(params.value || 0);
          break;
        case 'contrast':
          result = imageProcessor.adjustContrast(params.value || 0);
          break;
        case 'threshold':
          result = imageProcessor.applyThreshold(params.threshold || 128);
          break;
        case 'grayscale':
          result = imageProcessor.convertToGrayscale();
          break;
        case 'erosion':
          result = imageProcessor.applyErosion(params.kernelSize || 3);
          break;
        case 'dilation':
          result = imageProcessor.applyDilation(params.kernelSize || 3);
          break;
        default:
          console.warn('Unknown filter type:', filterType);
          setIsProcessing(false);
          return;
      }

      setProcessedImage(result);

      // اضافه کردن به history
      setProcessingHistory(prev => [...prev, {
        filter: filterType,
        params,
        timestamp: new Date().toISOString()
      }]);

      // به‌روزرسانی آمار
      const stats = imageProcessor.calculateStatistics();
      setImageStats(stats);

      // به‌روزرسانی هیستوگرام
      const hist = imageProcessor.calculateHistogram();
      setHistogram(hist);

    } catch (error) {
      console.error('Error applying filter:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage]);

  /**
   * ریست به تصویر اصلی
   */
  const resetToOriginal = useCallback(() => {
    if (originalImage) {
      imageProcessor.reset();
      setProcessedImage(originalImage);
      setProcessingHistory([]);

      // به‌روزرسانی آمار
      const stats = imageProcessor.calculateStatistics();
      setImageStats(stats);

      // به‌روزرسانی هیستوگرام
      const hist = imageProcessor.calculateHistogram();
      setHistogram(hist);
    }
  }, [originalImage]);

  /**
   * ذخیره تصویر
   */
  const saveImage = useCallback(async (filename) => {
    if (!processedImage) {
      console.warn('No processed image to save');
      return;
    }

    try {
      await imageProcessor.saveImage(filename);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  }, [processedImage]);

  /**
   * Crop تصویر
   */
  const cropImage = useCallback(async (x, y, width, height) => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const result = imageProcessor.cropImage(x, y, width, height);
      setProcessedImage(result);

      // اضافه کردن به history
      setProcessingHistory(prev => [...prev, {
        filter: 'crop',
        params: { x, y, width, height },
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage]);

  /**
   * Resize تصویر
   */
  const resizeImage = useCallback(async (width, height) => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const result = imageProcessor.resizeImage(width, height);
      setProcessedImage(result);

      // اضافه کردن به history
      setProcessingHistory(prev => [...prev, {
        filter: 'resize',
        params: { width, height },
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Error resizing image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage]);

  const value = {
    // State
    originalImage,
    processedImage,
    isProcessing,
    imageStats,
    histogram,
    processingHistory,

    // Functions
    loadImageFromBase64,
    loadImageFromBuffer,
    loadImageFromUrl,
    loadImageFromFile,
    applyFilter,
    resetToOriginal,
    saveImage,
    cropImage,
    resizeImage
  };

  return (
    <ImageProcessingContext.Provider value={value}>
      {children}
    </ImageProcessingContext.Provider>
  );
};
