# نحوه استفاده از Window/Level

## برای کاربر نهایی

### مرحله 1: انتخاب Histogram Tool
از تولبار، ابزار **Histogram** را انتخاب کنید.

### مرحله 2: انتخاب ناحیه
روی تصویر کلیک کنید (Point/Area/Line).

### مرحله 3: تنظیم Window/Level
در پنل هیستوگرام:

1. **دسته قرمز** (Min Level) را بکشید = سیاه‌تر میشه
2. **دسته سبز** (Max Level) را بکشید = روشن‌تر میشه
3. **ناحیه آبی** (Window) را بکشید = جابجایی کل پنجره

### مرحله 4: اعمال به تصویر
دکمه **"Apply"** (چشم سبز) را بزنید.

💡 **تصویر الان تیره/روشن میشه!**

### مرحله 5: حذف از تصویر
دکمه **"Remove"** (چشم قرمز) را بزنید تا تصویر به حالت اولیه برگرده.

### مرحله 6: Reset
دکمه **"Reset"** را بزنید تا Window/Level به حالت اولیه برگرده (0 تا 255/65535).

---

## برای توسعه‌دهنده

### استفاده از Hook در کامپوننت

```jsx
import { useWindowLevel } from '../hooks/useWindowLevel';

function MyImageComponent() {
  const canvasRef = useRef(null);

  // اعمال خودکار Window/Level به Canvas
  useWindowLevel(canvasRef, true);

  return <canvas ref={canvasRef} />;
}
```

### استفاده در BaslerDisplay

در فایل `BaslerDisplay.jsx` یک خط اضافه کنید:

```jsx
import { useWindowLevel } from '../../hooks/useWindowLevel';

const BaslerDisplay = () => {
  const fabricCanvasRef = useRef(null);

  // اضافه کردن این خط
  useWindowLevel(fabricCanvasRef, true);

  // بقیه کد...
}
```

### استفاده دستی از Utility Functions

```jsx
import { applyWindowLevelToCanvas } from '../utils/windowLevel';

// اعمال Window/Level
applyWindowLevelToCanvas(canvas, minLevel, maxLevel, bitDepth);
```

---

## مثال‌های کاربردی

### مثال 1: افزایش Contrast استخوان
```
Min Level: 800
Max Level: 2000
→ فقط استخوان‌ها دیده میشن، بافت نرم تاریک میشه
```

### مثال 2: بررسی بافت نرم
```
Min Level: 0
Max Level: 500
→ بافت‌های نرم روشن‌تر، استخوان‌ها سفید میشن
```

### مثال 3: نمایش کامل (بدون Window/Level)
```
Min Level: 0
Max Level: 255 (یا 65535 برای 16-bit)
→ تصویر اصلی بدون تغییر
```

---

## نکات فنی

### 1. LUT (Look-Up Table)
Window/Level با استفاده از یک جدول LUT کار میکنه:

```
LUT[pixel_value] =
  - 0                              اگر pixel_value <= minLevel
  - 255                            اگر pixel_value >= maxLevel
  - Linear interpolation           در غیر این صورت
```

### 2. عملکرد Real-time
- تغییرات Window/Level به صورت real-time اعمال میشن
- تصویر اصلی ذخیره میشه و همیشه قابل بازگشته

### 3. Performance
- استفاده از `getImageData` با flag `willReadFrequently: true`
- Cache کردن تصویر اصلی برای بازگشت سریع
- بهینه‌سازی برای تصاویر بزرگ

---

## Troubleshooting

### مشکل: تصویر تغییر نمیکنه
✅ **راه‌حل**: دکمه "Apply" رو بزنید

### مشکل: تصویر خیلی تاریک/روشنه
✅ **راه‌حل**: دکمه "Reset" رو بزنید

### مشکل: Window/Level خیلی کنده
✅ **راه‌حل**: تصویر خیلی بزرگه، صبر کنید یا resolution رو کم کنید

---

## API Reference

### Hook: useWindowLevel

```typescript
useWindowLevel(
  canvasRef: React.RefObject<HTMLCanvasElement | fabric.Canvas>,
  enabled: boolean = true
): void
```

### Function: applyWindowLevelToCanvas

```typescript
applyWindowLevelToCanvas(
  canvas: HTMLCanvasElement | fabric.Canvas,
  minLevel: number,
  maxLevel: number,
  bitDepth: number = 8
): void
```

### Context Values

```typescript
const {
  minLevel,              // number: حداقل سطح (0 - 255/65535)
  maxLevel,              // number: حداکثر سطح (0 - 255/65535)
  bitDepth,              // number: 8 یا 16
  isWindowLevelApplied,  // boolean: آیا روی تصویر اعمال شده؟
  updateLevels,          // (min, max) => void
  resetLevels,           // () => void
} = useHistogram();
```

---

**نکته**: این پیاده‌سازی مطابق با استانداردهای DICOM Window/Level است و در نرم‌افزارهای طبی استفاده میشه.
