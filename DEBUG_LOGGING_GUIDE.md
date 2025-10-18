# 🔍 Debug Logging راهنمای کامل

## 📊 چی اضافه شد؟

یک سیستم logging حرفه‌ای برای track کردن renders و performance.

---

## 🎯 کامپوننت‌هایی که log دارن:

### Context Providers:
- ✅ `WebSocketProvider` - هر render
- ✅ `CameraProvider` - هر render + connection status

### Components:
- ✅ `Layout` - هر render + current route
- ✅ `BaslerDisplay` - هر render
- ✅ `MonitoringDisplay` - هر render
- ✅ `HistogramDisplay` - هر render

---

## 🚀 چطور استفاده کنم؟

### 1. اجرای برنامه
فقط برنامه رو باز کن. Console به صورت خودکار لاگ‌ها رو نشون میده.

### 2. مشاهده Logs در Console

**رنگ‌ها:**
- 🟣 **بنفش** = Component Render
- 🔵 **آبی** = Context Update
- 🟠 **نارنجی** = useEffect
- 🟢 **سبز** = WebSocket Event
- 🔴 **قرمز** = Performance Warning

**مثال لاگ:**
```
[RENDER #1] BaslerDisplay (0.23s)
[RENDER #2] Layout (0.45s)
  └─ Props: { route: "/initial" }
[WEBSOCKET] CONNECTED (1.12s)
```

### 3. دستورات Console

توی console این دستورات رو داری:

```javascript
// نمایش آمار کامل renders
showRenderStats()

// ریست کردن counters
resetDebugLogger()

// دسترسی مستقیم به logger
debugLogger.logRender('MyComponent', { prop: 'value' })
```

---

## 📈 تحلیل Performance

### چیزایی که باید به‌شون توجه کنی:

#### 1. **تعداد Renders زیاد** ⚠️
اگه یک component بیشتر از 10 بار render شد، warning میده:
```
⚠️ BaslerDisplay rendered 15 times!
```

**چرا مهمه؟**
- هر render = re-execution کل component
- React.memo باید جلوش رو بگیره
- اگه زیاد render میشه = مشکل performance

#### 2. **Renders غیرضروری**
مثال خوب:
```
// وقتی از Home به Initial میری:
[RENDER #1] Layout { route: "/initial" }  ✅ طبیعیه
[RENDER #2] BaslerDisplay                  ❌ نباید!
```

اگه `BaslerDisplay` render شد = React.memo کار نکرده!

#### 3. **هر frame جدید = render**
```
[RENDER #1] BaslerDisplay
[RENDER #2] BaslerDisplay
[RENDER #3] BaslerDisplay  // هر 50ms
```

این **طبیعیه** چون frame جدید میاد!

#### 4. **WebSocket Events**
```
[WEBSOCKET] CONNECTED (1.2s)
[WEBSOCKET] MESSAGE_RECEIVED (1.3s)
[WEBSOCKET] DISCONNECTED (5.0s)
```

---

## 🧪 سناریوهای تست

### تست 1: Navigation بین صفحات
```
1. از Home برو به Initial
2. توی console ببین:
   ✅ Layout باید render بشه (طبیعیه)
   ✅ BaslerDisplay نباید render بشه (memo کار کرده)
   ✅ MonitoringDisplay نباید render بشه
```

### تست 2: دریافت Frame
```
1. اجرای backend
2. توی console ببین:
   ✅ [WEBSOCKET] CONNECTED
   ✅ BaslerDisplay render میشه (هر 50ms)
   ✅ MonitoringDisplay render میشه (هر 40ms)
```

### تست 3: زدن دکمه Tools
```
1. یک tool انتخاب کن (Brush)
2. توی console ببین:
   ✅ CameraProvider render میشه (activeTool تغییر کرد)
   ✅ BaslerDisplay render میشه (tool جدید)
   ❌ MonitoringDisplay نباید render بشه
```

### تست 4: آمار کلی
```
1. بعد از 1 دقیقه استفاده
2. توی console بزن: showRenderStats()
3. چک کن:
   ✅ Layout: ~5-10 renders (تعویض صفحات)
   ✅ BaslerDisplay: ~1200 renders (20 FPS × 60s)
   ✅ WebSocketProvider: ~1-2 renders (فقط اول)
```

---

## 🎨 مثال خروجی Console

```
🔍 Debug Logger Active
Commands available:
  • showRenderStats() - نمایش آمار renders
  • resetDebugLogger() - ریست کردن counters
  • debugLogger - دسترسی مستقیم به logger

[RENDER #1] WebSocketProvider (0.01s)
[RENDER #1] CameraProvider (0.02s)
  └─ Props: { isConnected: "connecting" }
[RENDER #1] Layout (0.03s)
  └─ Props: { route: "/" }
[RENDER #1] BaslerDisplay (0.05s)
[RENDER #1] MonitoringDisplay (0.06s)
[RENDER #1] HistogramDisplay (0.07s)

[WEBSOCKET] CONNECTED (1.23s)

[RENDER #2] CameraProvider (1.24s)
  └─ Props: { isConnected: "connected" }

[RENDER #2] BaslerDisplay (1.30s)
[RENDER #3] BaslerDisplay (1.35s)
[RENDER #4] BaslerDisplay (1.40s)
...

// بعد از کلیک روی Initial tab:
[RENDER #2] Layout (5.12s)
  └─ Props: { route: "/initial" }

// آمار کلی (با showRenderStats()):
📊 Render Statistics
BaslerDisplay: 45 renders
CameraProvider: 2 renders
Layout: 2 renders
WebSocketProvider: 1 render
MonitoringDisplay: 1 render
HistogramDisplay: 1 render
```

---

## ⚙️ تنظیمات

### غیرفعال کردن Logging
در فایل `debugLogger.js` خط 4:
```javascript
const DEBUG_ENABLED = false; // تنظیم روی false
```

### اضافه کردن Log به component جدید
```javascript
import debugLogger from '../utils/debugLogger';

const MyComponent = () => {
  debugLogger.logRender('MyComponent', { someProp: value });

  // یا استفاده از hook:
  useRenderLogger('MyComponent', { someProp: value });

  return <div>...</div>
};
```

### لاگ کردن useEffect
```javascript
useEffect(() => {
  debugLogger.logEffect('MyComponent', 'fetchData', [dependency]);

  // your code...
}, [dependency]);
```

---

## 🐛 Debugging Tips

### مشکل: Component خیلی render میشه

**گام 1:** ببین چرا render میشه
```javascript
debugLogger.logRender('MyComponent', props);
// Props رو چک کن - کدوم prop تغییر کرده؟
```

**گام 2:** Context رو چک کن
```javascript
// اگه از context استفاده میکنه:
const { value1, value2 } = useMyContext();
debugLogger.logRender('MyComponent', { value1, value2 });
```

**گام 3:** React.memo اضافه کن
```javascript
export default React.memo(MyComponent);
```

### مشکل: Performance کند

**گام 1:** آمار رو ببین
```javascript
showRenderStats()
// کدوم component بیشترین render رو داره؟
```

**گام 2:** Performance Timing
```javascript
const start = performance.now();
// کد سنگین
const duration = performance.now() - start;
debugLogger.logPerformance('Heavy Operation', duration);
```

---

## 📝 نتیجه‌گیری

با این سیستم میتونی:
- ✅ تشخیص بدی کدوم component زیاد render میشه
- ✅ ببینی navigation چقدر سریعه
- ✅ WebSocket events رو track کنی
- ✅ Performance bottlenecks رو پیدا کنی
- ✅ Optimization های خودت رو verify کنی

**همیشه یادت باشه:**
- Render زیاد = مشکل (مگه frame updates)
- React.memo باید جلوی renders غیرضروری رو بگیره
- Context updates باید کنترل شده باشن

---

## 📤 ارسال Logs

برای ارسال logs:

1. توی console بزن: `showRenderStats()`
2. Screenshot بگیر
3. یا Copy/Paste کن

من میتونم بگم کجا مشکل داری! 🚀
