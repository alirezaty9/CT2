/**
 * useWindowLevel Hook
 *
 * این hook برای اتصال Window/Level adjustment به Canvas استفاده میشه
 */

import { useEffect, useRef } from 'react';
import { useHistogram } from '../contexts/HistogramContext';

/**
 * Hook برای اعمال Window/Level به یک Canvas
 *
 * @param {React.RefObject} canvasRef - Reference به Canvas element یا Fabric Canvas
 * @param {boolean} enabled - آیا Window/Level فعال باشه؟
 */
export function useWindowLevel(canvasRef, enabled = true) {
  const {
    minLevel,
    maxLevel,
    bitDepth,
    isWindowLevelApplied,
  } = useHistogram();

  // ذخیره تصویر اصلی
  const originalImageDataRef = useRef(null);

  // اعمال Window/Level
  useEffect(() => {
    const defaultMax = bitDepth === 16 ? 65535 : 255;
    const isDefaultRange = (minLevel === 0 && maxLevel === defaultMax);

    console.log('🎯 useWindowLevel effect triggered:', {
      enabled,
      hasCanvas: !!canvasRef.current,
      isWindowLevelApplied,
      minLevel,
      maxLevel,
      bitDepth,
      isDefaultRange,
      hasOriginalImage: !!originalImageDataRef.current
    });

    if (!enabled || !canvasRef.current || !isWindowLevelApplied || isDefaultRange) {
      // اگر غیرفعال شد یا به حالت default برگشتیم، تصویر اصلی رو برگردون
      if (canvasRef.current && originalImageDataRef.current) {
        console.log('⏮️ Restoring original image (disabled or default range)');
        restoreOriginalImage(canvasRef.current, originalImageDataRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;

    // ذخیره تصویر اصلی (اگر هنوز ذخیره نشده)
    if (!originalImageDataRef.current) {
      console.log('💾 Saving original image for first time');
      originalImageDataRef.current = saveOriginalImage(canvas);
    }

    // اعمال Window/Level
    console.log('✨ Applying Window/Level:', { minLevel, maxLevel, bitDepth });
    applyWindowLevel(canvas, minLevel, maxLevel, bitDepth, originalImageDataRef.current);

  }, [canvasRef, minLevel, maxLevel, bitDepth, isWindowLevelApplied, enabled]);

  // پاک کردن هنگام unmount
  useEffect(() => {
    return () => {
      if (canvasRef.current && originalImageDataRef.current) {
        restoreOriginalImage(canvasRef.current, originalImageDataRef.current);
      }
    };
  }, [canvasRef]);
}

/**
 * ذخیره تصویر اصلی
 */
function saveOriginalImage(canvas) {
  console.log('💾 Saving original image...');

  // اگر Fabric Canvas با backgroundImage
  if (canvas.backgroundImage) {
    const bgImg = canvas.backgroundImage;
    const originalSrc = bgImg.getSrc();
    console.log('✅ Saved original Fabric backgroundImage src');
    return { type: 'fabric', src: originalSrc };
  }

  // HTML Canvas معمولی
  let ctx, width, height;

  if (canvas.getContext) {
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    width = canvas.width;
    height = canvas.height;
  } else if (canvas.lowerCanvasEl) {
    ctx = canvas.lowerCanvasEl.getContext('2d', { willReadFrequently: true });
    width = canvas.width;
    height = canvas.height;
  }

  if (ctx && width && height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    console.log('✅ Saved original HTML Canvas imageData');
    return { type: 'html', imageData };
  }

  console.warn('⚠️ Could not save original image');
  return null;
}

/**
 * بازگرداندن تصویر اصلی
 */
function restoreOriginalImage(canvas, originalData) {
  if (!originalData) return;

  console.log('🔄 Restoring original image...', originalData.type);

  // اگر Fabric Canvas با backgroundImage
  if (originalData.type === 'fabric' && canvas.backgroundImage) {
    const bgImg = canvas.backgroundImage;
    bgImg.setSrc(originalData.src, () => {
      console.log('✅ Original Fabric backgroundImage restored');
      canvas.renderAll();
    });
    return;
  }

  // HTML Canvas معمولی
  if (originalData.type === 'html' && originalData.imageData) {
    let ctx;
    if (canvas.getContext) {
      ctx = canvas.getContext('2d', { willReadFrequently: true });
    } else if (canvas.lowerCanvasEl) {
      ctx = canvas.lowerCanvasEl.getContext('2d', { willReadFrequently: true });
    }

    if (ctx) {
      ctx.putImageData(originalData.imageData, 0, 0);
      console.log('✅ Original HTML Canvas imageData restored');

      // اگر Fabric Canvas هست، renderAll رو صدا بزن
      if (canvas.renderAll) {
        canvas.renderAll();
      }
    }
  }
}

/**
 * پردازش داده‌های تصویر با Window/Level
 */
function processImageData(tempCtx, tempCanvas, minLevel, maxLevel, bitDepth, canvas, bgImg) {
  // دریافت داده‌های تصویر
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imageData.data;

  // برای 16-bit، Canvas همیشه 8-bit هست، پس باید scale کنیم
  if (bitDepth === 16) {
    console.log('🔢 16-bit mode: scaling levels from 16-bit to 8-bit range');
    // Scale کردن مقادیر 16-bit (0-65535) به 8-bit (0-255)
    const scaledMin = Math.round((minLevel / 65535) * 255);
    const scaledMax = Math.round((maxLevel / 65535) * 255);

    console.log(`   Original: ${minLevel}-${maxLevel}`);
    console.log(`   Scaled: ${scaledMin}-${scaledMax}`);

    const range = scaledMax - scaledMin;
    if (range === 0) {
      console.warn('⚠️ Range is zero, skipping Window/Level');
      return;
    }

    // اعمال Window/Level با مقادیر scaled
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // اعمال Window/Level به هر کانال
      if (r <= scaledMin) {
        data[i] = 0;
      } else if (r >= scaledMax) {
        data[i] = 255;
      } else {
        data[i] = Math.round(((r - scaledMin) / range) * 255);
      }

      if (g <= scaledMin) {
        data[i + 1] = 0;
      } else if (g >= scaledMax) {
        data[i + 1] = 255;
      } else {
        data[i + 1] = Math.round(((g - scaledMin) / range) * 255);
      }

      if (b <= scaledMin) {
        data[i + 2] = 0;
      } else if (b >= scaledMax) {
        data[i + 2] = 255;
      } else {
        data[i + 2] = Math.round(((b - scaledMin) / range) * 255);
      }
    }
  } else {
    // 8-bit mode: استفاده از LUT برای سرعت بیشتر
    console.log('🔢 8-bit mode: using LUT');
    const lut = new Uint8Array(256);
    const range = maxLevel - minLevel;

    if (range === 0) {
      console.warn('⚠️ Range is zero, skipping Window/Level');
      return;
    }

    for (let i = 0; i <= 255; i++) {
      if (i <= minLevel) {
        lut[i] = 0;
      } else if (i >= maxLevel) {
        lut[i] = 255;
      } else {
        lut[i] = Math.round(((i - minLevel) / range) * 255);
      }
    }

    // اعمال LUT به هر پیکسل
    for (let i = 0; i < data.length; i += 4) {
      data[i] = lut[data[i]];         // Red
      data[i + 1] = lut[data[i + 1]]; // Green
      data[i + 2] = lut[data[i + 2]]; // Blue
      // Alpha (data[i + 3]) تغییر نمیکنه
    }
  }

  // نوشتن داده‌های پردازش شده
  tempCtx.putImageData(imageData, 0, 0);

  // بروزرسانی تصویر پس‌زمینه با تصویر پردازش شده
  bgImg.setSrc(tempCanvas.toDataURL(), () => {
    console.log('✅ Window/Level applied successfully');
    canvas.renderAll();
  });
}

/**
 * اعمال Window/Level
 */
function applyWindowLevel(canvas, minLevel, maxLevel, bitDepth, originalImageData) {
  console.log('🎨 applyWindowLevel called:', { minLevel, maxLevel, bitDepth, hasOriginal: !!originalImageData });

  // اگر Fabric Canvas هست و backgroundImage داره
  if (canvas.backgroundImage) {
    console.log('✅ Fabric Canvas with backgroundImage detected');
    const bgImg = canvas.backgroundImage;

    // ایجاد یک canvas موقت برای پردازش
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = bgImg.width;
    tempCanvas.height = bgImg.height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    // ⚡ CRITICAL: استفاده از تصویر اصلی (نه تصویر فعلی که process شده)
    if (originalImageData && originalImageData.type === 'fabric' && originalImageData.src) {
      // Load کردن تصویر اصلی
      const originalImg = new Image();
      originalImg.onload = () => {
        console.log('✅ Original image loaded, applying Window/Level');
        // رسم تصویر اصلی روی canvas موقت
        tempCtx.drawImage(originalImg, 0, 0);

        // ادامه پردازش با کد موجود
        processImageData(tempCtx, tempCanvas, minLevel, maxLevel, bitDepth, canvas, bgImg);
      };
      originalImg.src = originalImageData.src;
      return; // منتظر load شدن تصویر
    } else {
      // اگر تصویر اصلی نداریم، از تصویر فعلی استفاده کن
      console.warn('⚠️ No original image found, using current image (may cause degradation)');
      tempCtx.drawImage(bgImg.getElement(), 0, 0);
    }

    // پردازش تصویر
    processImageData(tempCtx, tempCanvas, minLevel, maxLevel, bitDepth, canvas, bgImg);

    return;
  }

  // روش قدیمی برای HTML Canvas معمولی
  let ctx, width, height;

  if (canvas.getContext) {
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    width = canvas.width;
    height = canvas.height;
  } else if (canvas.lowerCanvasEl) {
    ctx = canvas.lowerCanvasEl.getContext('2d', { willReadFrequently: true });
    width = canvas.width;
    height = canvas.height;
  }

  if (!ctx) return;

  // دریافت داده‌های تصویر
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // ایجاد LUT
  const maxValue = bitDepth === 16 ? 65535 : 255;
  const lut = new Uint8Array(maxValue + 1);
  const range = maxLevel - minLevel;

  for (let i = 0; i <= maxValue; i++) {
    if (i <= minLevel) {
      lut[i] = 0;
    } else if (i >= maxLevel) {
      lut[i] = 255;
    } else {
      lut[i] = Math.round(((i - minLevel) / range) * 255);
    }
  }

  // اعمال LUT به هر پیکسل
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];         // Red
    data[i + 1] = lut[data[i + 1]]; // Green
    data[i + 2] = lut[data[i + 2]]; // Blue
    // Alpha (data[i + 3]) تغییر نمیکنه
  }

  // نوشتن داده‌های پردازش شده
  ctx.putImageData(imageData, 0, 0);

  // اگر Fabric Canvas هست، renderAll رو صدا بزن
  if (canvas.renderAll) {
    canvas.renderAll();
  }
}

export default useWindowLevel;
