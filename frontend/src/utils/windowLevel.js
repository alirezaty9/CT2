/**
 * Window/Level Utilities
 *
 * این فایل شامل توابع کاربردی برای اعمال Window/Level به تصاویر است.
 * Window/Level یک تکنیک استاندارد در Medical Imaging است که برای
 * تنظیم contrast و brightness تصاویر استفاده می‌شود.
 */

/**
 * اعمال LUT (Look-Up Table) به یک تصویر
 *
 * @param {HTMLCanvasElement | fabric.Canvas} canvas - Canvas که تصویر روی اون هست
 * @param {Uint16Array} lut - جدول LUT برای تبدیل مقادیر
 * @param {number} bitDepth - عمق بیت تصویر (8 یا 16)
 * @returns {ImageData} - داده تصویر پردازش شده
 */
export function applyLUTToCanvas(canvas, lut, bitDepth = 8) {
  if (!canvas || !lut) {
    console.warn('Canvas or LUT is null');
    return null;
  }

  // دریافت context - چک کردن اینکه fabric.Canvas هست یا HTML Canvas
  let ctx;
  let width, height;

  if (canvas.getContext) {
    // HTML Canvas
    ctx = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
  } else if (canvas.lowerCanvasEl) {
    // Fabric Canvas
    ctx = canvas.lowerCanvasEl.getContext('2d');
    width = canvas.width;
    height = canvas.height;
  } else {
    console.error('Invalid canvas type');
    return null;
  }

  // دریافت داده‌های تصویر
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // اعمال LUT به هر پیکسل
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // تبدیل به grayscale (اگر نیاز باشه)
    // یا می‌تونیم مستقیم LUT رو روی هر کانال اعمال کنیم

    // روش 1: اعمال LUT به هر کانال جداگانه
    data[i] = lut[r] || r;         // Red
    data[i + 1] = lut[g] || g;     // Green
    data[i + 2] = lut[b] || b;     // Blue
    // Alpha تغییر نمیکنه
  }

  return imageData;
}

/**
 * اعمال Window/Level به یک Canvas
 *
 * @param {HTMLCanvasElement | fabric.Canvas} canvas - Canvas
 * @param {number} minLevel - حداقل سطح
 * @param {number} maxLevel - حداکثر سطح
 * @param {number} bitDepth - عمق بیت (8 یا 16)
 */
export function applyWindowLevelToCanvas(canvas, minLevel, maxLevel, bitDepth = 8) {
  if (!canvas) {
    console.warn('Canvas is null');
    return;
  }

  // ایجاد LUT
  const maxValue = bitDepth === 16 ? 65535 : 255;
  const lut = new Uint16Array(maxValue + 1);
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

  // اعمال LUT
  const imageData = applyLUTToCanvas(canvas, lut, bitDepth);

  if (imageData) {
    // نوشتن داده‌های پردازش شده به canvas
    let ctx;
    if (canvas.getContext) {
      ctx = canvas.getContext('2d');
    } else if (canvas.lowerCanvasEl) {
      ctx = canvas.lowerCanvasEl.getContext('2d');
    }

    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
    }
  }
}

/**
 * اعمال Window/Level به یک Fabric.Image object
 *
 * @param {fabric.Image} imageObject - Fabric image object
 * @param {number} minLevel - حداقل سطح
 * @param {number} maxLevel - حداکثر سطح
 * @param {number} bitDepth - عمق بیت
 */
export function applyWindowLevelToFabricImage(imageObject, minLevel, maxLevel, bitDepth = 8) {
  if (!imageObject || !imageObject._element) {
    console.warn('Invalid fabric image object');
    return;
  }

  // ایجاد یک canvas موقت
  const tempCanvas = document.createElement('canvas');
  const img = imageObject._element;

  tempCanvas.width = img.width || imageObject.width;
  tempCanvas.height = img.height || imageObject.height;

  const ctx = tempCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // اعمال Window/Level
  applyWindowLevelToCanvas(tempCanvas, minLevel, maxLevel, bitDepth);

  // تبدیل به image و تنظیم دوباره
  const newImage = new Image();
  newImage.onload = () => {
    imageObject.setElement(newImage);
    imageObject.canvas?.renderAll();
  };
  newImage.src = tempCanvas.toDataURL();
}

/**
 * ذخیره تصویر اصلی قبل از اعمال Window/Level
 *
 * @param {HTMLCanvasElement | fabric.Canvas} canvas
 * @returns {ImageData} - کپی از داده‌های اصلی تصویر
 */
export function saveOriginalImage(canvas) {
  let ctx, width, height;

  if (canvas.getContext) {
    ctx = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
  } else if (canvas.lowerCanvasEl) {
    ctx = canvas.lowerCanvasEl.getContext('2d');
    width = canvas.width;
    height = canvas.height;
  }

  if (ctx) {
    return ctx.getImageData(0, 0, width, height);
  }

  return null;
}

/**
 * بازگرداندن تصویر به حالت اصلی
 *
 * @param {HTMLCanvasElement | fabric.Canvas} canvas
 * @param {ImageData} originalImageData - داده‌های اصلی تصویر
 */
export function restoreOriginalImage(canvas, originalImageData) {
  if (!canvas || !originalImageData) {
    console.warn('Canvas or original image data is null');
    return;
  }

  let ctx;
  if (canvas.getContext) {
    ctx = canvas.getContext('2d');
  } else if (canvas.lowerCanvasEl) {
    ctx = canvas.lowerCanvasEl.getContext('2d');
  }

  if (ctx) {
    ctx.putImageData(originalImageData, 0, 0);
  }
}

/**
 * ایجاد Fabric Filter برای Window/Level
 * این روش بهتره چون با سیستم filter های Fabric سازگاره
 *
 * @param {number} minLevel
 * @param {number} maxLevel
 * @param {number} bitDepth
 * @returns {fabric.Image.filters.BaseFilter}
 */
export function createWindowLevelFilter(minLevel, maxLevel, bitDepth = 8) {
  // استفاده از Brightness/Contrast filter های Fabric
  // یا ساخت یک Custom Filter

  return new fabric.Image.filters.ColorMatrix({
    matrix: calculateWindowLevelMatrix(minLevel, maxLevel, bitDepth)
  });
}

/**
 * محاسبه Color Matrix برای Window/Level
 *
 * @param {number} minLevel
 * @param {number} maxLevel
 * @param {number} bitDepth
 * @returns {Array<number>} - 5x4 matrix
 */
function calculateWindowLevelMatrix(minLevel, maxLevel, bitDepth) {
  const maxValue = bitDepth === 16 ? 65535 : 255;
  const range = maxLevel - minLevel;
  const scale = 255 / range;
  const offset = -minLevel * scale;

  // Color matrix که Window/Level رو پیاده می‌کنه
  return [
    scale, 0, 0, 0, offset / 255,
    0, scale, 0, 0, offset / 255,
    0, 0, scale, 0, offset / 255,
    0, 0, 0, 1, 0
  ];
}

export default {
  applyLUTToCanvas,
  applyWindowLevelToCanvas,
  applyWindowLevelToFabricImage,
  saveOriginalImage,
  restoreOriginalImage,
  createWindowLevelFilter,
};
