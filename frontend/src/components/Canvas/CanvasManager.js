import fabric from 'fabric';

// Dynamic imports برای کتابخانه‌های اختیاری
let Cropper = null;
let Croppie = null;

// تلاش برای import کتابخانه‌ها
try {
  // این خطوط را بعد از نصب کتابخانه‌ها uncomment کنید:
  // Cropper = (await import('cropperjs')).default;
  // Croppie = (await import('croppie')).default;
} catch (error) {
  console.warn('برخی کتابخانه‌های اختیاری در دسترس نیستند:', error.message);
}

/**
 * مدیر کلی Canvas - ترکیب بهترین ویژگی‌های کتابخانه‌های مختلف
 * Fabric.js: برای رسم و ابزارهای پیشرفته
 * Cropper.js: برای crop حرفه‌ای
 * Croppie: برای crop ساده و سریع
 */
export class CanvasManager {
  constructor(canvasElement, options = {}) {
    this.canvasElement = canvasElement;
    this.options = {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      enableRetinaScaling: true,
      ...options
    };
    
    // حالت‌های مختلف کار
    this.modes = {
      DRAW: 'draw',
      CROP: 'crop',
      SELECT: 'select',
      PAN: 'pan'
    };
    
    this.currentMode = this.modes.DRAW;
    this.fabricCanvas = null;
    this.cropper = null;
    this.croppie = null;
    this.backgroundImage = null;
    
    // تنظیمات ابزارهای رسم
    this.drawingSettings = {
      brush: {
        color: '#000000',
        width: 5,
        opacity: 1,
        shadowBlur: 0,
        shadowColor: '#000000'
      },
      pencil: {
        color: '#000000',
        width: 2,
        opacity: 1
      },
      eraser: {
        width: 10
      }
    };
    
    this.initFabricCanvas();
    this.setupEventListeners();
  }

  /**
   * راه‌اندازی Fabric.js Canvas
   */
  initFabricCanvas() {
    this.fabricCanvas = new fabric.Canvas(this.canvasElement, {
      width: this.options.width,
      height: this.options.height,
      backgroundColor: this.options.backgroundColor,
      enableRetinaScaling: this.options.enableRetinaScaling,
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      skipTargetFind: false,
      hoverCursor: 'move',
      moveCursor: 'move',
      defaultCursor: 'default'
    });

    // تنظیم brush پیش‌فرض
    this.setupBrush();
  }

  /**
   * تنظیم ابزار برس با قابلیت‌های پیشرفته
   */
  setupBrush() {
    const brush = new fabric.PencilBrush(this.fabricCanvas);
    
    // تنظیمات پیشرفته برس
    brush.color = this.drawingSettings.brush.color;
    brush.width = this.drawingSettings.brush.width;
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
    brush.strokeDashArray = null;
    
    // افکت‌های ویژه
    brush.shadow = new fabric.Shadow({
      color: this.drawingSettings.brush.shadowColor,
      blur: this.drawingSettings.brush.shadowBlur,
      offsetX: 0,
      offsetY: 0
    });
    
    this.fabricCanvas.freeDrawingBrush = brush;
  }

  /**
   * تنظیم رویدادها
   */
  setupEventListeners() {
    // رویدادهای Fabric Canvas
    this.fabricCanvas.on('path:created', (e) => {
      this.onPathCreated(e);
    });

    this.fabricCanvas.on('selection:created', (e) => {
      this.onSelectionCreated(e);
    });

    this.fabricCanvas.on('object:modified', (e) => {
      this.onObjectModified(e);
    });

    // رویدادهای ماوس برای حالت‌های مختلف
    this.fabricCanvas.on('mouse:down', (e) => {
      this.onMouseDown(e);
    });

    this.fabricCanvas.on('mouse:move', (e) => {
      this.onMouseMove(e);
    });

    this.fabricCanvas.on('mouse:up', (e) => {
      this.onMouseUp(e);
    });
  }

  /**
   * تغییر حالت کار
   */
  setMode(mode) {
    this.currentMode = mode;
    
    switch (mode) {
      case this.modes.DRAW:
        this.enableDrawingMode();
        break;
      case this.modes.CROP:
        this.enableCropMode();
        break;
      case this.modes.SELECT:
        this.enableSelectionMode();
        break;
      case this.modes.PAN:
        this.enablePanMode();
        break;
    }
  }

  /**
   * فعال‌سازی حالت رسم
   */
  enableDrawingMode() {
    this.fabricCanvas.isDrawingMode = true;
    this.fabricCanvas.selection = false;
    this.fabricCanvas.forEachObject(obj => {
      obj.selectable = false;
    });
    this.disableCrop();
  }

  /**
   * فعال‌سازی حالت انتخاب
   */
  enableSelectionMode() {
    this.fabricCanvas.isDrawingMode = false;
    this.fabricCanvas.selection = true;
    this.fabricCanvas.forEachObject(obj => {
      obj.selectable = true;
    });
    this.disableCrop();
  }

  /**
   * فعال‌سازی حالت pan
   */
  enablePanMode() {
    this.fabricCanvas.isDrawingMode = false;
    this.fabricCanvas.selection = false;
    this.fabricCanvas.forEachObject(obj => {
      obj.selectable = false;
    });
    this.disableCrop();
  }

  /**
   * فعال‌سازی حالت crop
   */
  enableCropMode() {
    this.fabricCanvas.isDrawingMode = false;
    this.fabricCanvas.selection = false;
    
    if (this.backgroundImage) {
      this.initCropper();
    }
  }

  /**
   * راه‌اندازی Cropper.js
   */
  initCropper() {
    if (!Cropper) {
      console.warn('Cropper.js در دسترس نیست. لطفاً نصب کنید: npm install cropperjs');
      return;
    }

    if (this.cropper) {
      this.cropper.destroy();
    }

    // ایجاد تصویر موقت برای crop
    const tempImg = document.createElement('img');
    tempImg.src = this.fabricCanvas.toDataURL();
    tempImg.style.display = 'none';
    document.body.appendChild(tempImg);

    this.cropper = new Cropper(tempImg, {
      aspectRatio: NaN, // آزاد
      viewMode: 1,
      dragMode: 'crop',
      autoCropArea: 0.8,
      responsive: true,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      ready: () => {
        console.log('Cropper آماده است');
      },
      crop: (event) => {
        this.onCropMove(event);
      }
    });
  }

  /**
   * راه‌اندازی Croppie برای crop ساده
   */
  initCroppie(container) {
    if (!Croppie) {
      console.warn('Croppie در دسترس نیست. لطفاً نصب کنید: npm install croppie');
      return null;
    }

    if (this.croppie) {
      this.croppie.destroy();
    }

    this.croppie = new Croppie(container, {
      viewport: { width: 300, height: 300, type: 'square' },
      boundary: { width: 400, height: 400 },
      showZoomer: true,
      enableOrientation: true,
      enableResize: true,
      mouseWheelZoom: 'ctrl'
    });

    return this.croppie;
  }

  /**
   * تنظیم تصویر پس‌زمینه
   */
  setBackgroundImage(imageUrl) {
    return new Promise((resolve) => {
      fabric.Image.fromURL(imageUrl, (img) => {
        // تنظیم اندازه تصویر
        const canvasWidth = this.fabricCanvas.width;
        const canvasHeight = this.fabricCanvas.height;
        
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (canvasWidth - img.width * scale) / 2,
          top: (canvasHeight - img.height * scale) / 2,
          selectable: false,
          evented: false
        });
        
        this.fabricCanvas.setBackgroundImage(img, () => {
          this.backgroundImage = img;
          this.fabricCanvas.renderAll();
          resolve(img);
        });
      });
    });
  }

  /**
   * تنظیمات برس
   */
  setBrushSettings(settings) {
    const brush = this.fabricCanvas.freeDrawingBrush;
    
    if (settings.color) {
      brush.color = settings.color;
      this.drawingSettings.brush.color = settings.color;
    }
    
    if (settings.width) {
      brush.width = settings.width;
      this.drawingSettings.brush.width = settings.width;
    }
    
    if (settings.opacity !== undefined) {
      // تنظیم شفافیت برای path های بعدی
      this.drawingSettings.brush.opacity = settings.opacity;
    }
    
    if (settings.shadowBlur !== undefined) {
      brush.shadow.blur = settings.shadowBlur;
      this.drawingSettings.brush.shadowBlur = settings.shadowBlur;
    }
  }

  /**
   * اضافه کردن شکل‌های هندسی
   */
  addShape(type, options = {}) {
    let shape;
    
    switch (type) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          ...options
        });
        break;
        
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          ...options
        });
        break;
        
      case 'triangle':
        shape = new fabric.Triangle({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          ...options
        });
        break;
        
      case 'line':
        shape = new fabric.Line([50, 100, 200, 100], {
          stroke: '#000000',
          strokeWidth: 2,
          ...options
        });
        break;
    }
    
    if (shape) {
      this.fabricCanvas.add(shape);
      this.fabricCanvas.setActiveObject(shape);
      this.fabricCanvas.renderAll();
    }
    
    return shape;
  }

  /**
   * اضافه کردن متن
   */
  addText(text = 'متن نمونه', options = {}) {
    const textObj = new fabric.Text(text, {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: '#000000',
      ...options
    });
    
    this.fabricCanvas.add(textObj);
    this.fabricCanvas.setActiveObject(textObj);
    this.fabricCanvas.renderAll();
    
    return textObj;
  }

  /**
   * پاک کردن انتخاب شده
   */
  deleteSelected() {
    const activeObjects = this.fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
      this.fabricCanvas.remove(...activeObjects);
      this.fabricCanvas.discardActiveObject();
      this.fabricCanvas.renderAll();
    }
  }

  /**
   * پاک کردن همه چیز
   */
  clear() {
    this.fabricCanvas.clear();
    this.fabricCanvas.backgroundColor = this.options.backgroundColor;
    this.fabricCanvas.renderAll();
  }

  /**
   * undo
   */
  undo() {
    // پیاده‌سازی ساده - می‌توان پیچیده‌تر کرد
    const objects = this.fabricCanvas.getObjects();
    if (objects.length > 0) {
      this.fabricCanvas.remove(objects[objects.length - 1]);
      this.fabricCanvas.renderAll();
    }
  }

  /**
   * zoom
   */
  setZoom(zoom) {
    this.fabricCanvas.setZoom(zoom);
    this.fabricCanvas.renderAll();
  }

  /**
   * دریافت تصویر نهایی
   */
  getImage(format = 'png', quality = 1) {
    return this.fabricCanvas.toDataURL({
      format: format,
      quality: quality,
      multiplier: 1
    });
  }

  /**
   * ذخیره وضعیت canvas
   */
  saveState() {
    return JSON.stringify(this.fabricCanvas.toJSON());
  }

  /**
   * بارگذاری وضعیت canvas
   */
  loadState(state) {
    return new Promise((resolve) => {
      this.fabricCanvas.loadFromJSON(state, () => {
        this.fabricCanvas.renderAll();
        resolve();
      });
    });
  }

  /**
   * رویدادهای داخلی
   */
  onPathCreated(e) {
    // اعمال تنظیمات اضافی به path جدید
    const path = e.path;
    path.set({
      opacity: this.drawingSettings.brush.opacity
    });
    this.fabricCanvas.renderAll();
  }

  onSelectionCreated(e) {
    console.log('Object selected:', e.selected);
  }

  onObjectModified(e) {
    console.log('Object modified:', e.target);
  }

  onMouseDown(e) {
    if (this.currentMode === this.modes.PAN) {
      this.isPanning = true;
      this.lastPanPoint = e.e;
    }
  }

  onMouseMove(e) {
    if (this.isPanning && this.lastPanPoint) {
      const delta = {
        x: e.e.clientX - this.lastPanPoint.clientX,
        y: e.e.clientY - this.lastPanPoint.clientY
      };
      
      this.fabricCanvas.relativePan(delta);
      this.lastPanPoint = e.e;
    }
  }

  onMouseUp(e) {
    this.isPanning = false;
    this.lastPanPoint = null;
  }

  onCropMove(event) {
    // رویداد crop
    console.log('Crop area:', event.detail);
  }

  /**
   * غیرفعال کردن crop
   */
  disableCrop() {
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
    
    if (this.croppie) {
      this.croppie.destroy();
      this.croppie = null;
    }
  }

  /**
   * تمیز کردن منابع
   */
  dispose() {
    this.disableCrop();
    
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
    }
  }
}

export default CanvasManager;
