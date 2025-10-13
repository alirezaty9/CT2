# CT Scanner Utilities Documentation

یوتیلیتی‌های کامل برای پردازش تصویر و آنالیز CT Scanner

## 📁 ساختار پوشه‌ها

```
utils/
├── math/                          # محاسبات ریاضی
│   ├── statistics.js             # آمار پایه (Mean, Std, Min, Max, Median)
│   ├── imageMetrics.js           # متریک‌های تصویر (SNR, CNR, Transmission%)
│   └── fft.js                    # عملیات FFT و فیلترهای فرکانسی
│
├── imageProcessing/               # پردازش تصویر
│   ├── filters.js                # فیلترهای تصویر (Gaussian, Median, Edge Detection)
│   └── transforms.js             # تبدیلات (Gamma, Normalization, Rotation)
│
├── roi/                           # آنالیز ROI
│   └── roiAnalysis.js            # ابزارهای آنالیز ROI
│
├── export/                        # خروجی و ذخیره
│   ├── imageExport.js            # خروجی تصویر (TIFF, JPG, DICONDE)
│   └── csvExport.js              # خروجی CSV و metadata
│
└── index.js                       # Export مرکزی همه توابع
```

---

## 📊 1. Math Utilities

### `statistics.js` - آمار پایه

#### محاسبه میانگین (Mean)
```javascript
import { calculateMean } from '@/utils';

const pixelData = [120, 130, 125, 135, 128];
const mean = calculateMean(pixelData);
console.log(mean); // 127.6
```

#### محاسبه انحراف معیار (Standard Deviation)
```javascript
import { calculateStdDev } from '@/utils';

const stdDev = calculateStdDev(pixelData);
console.log(stdDev); // 5.36
```

#### محاسبه همه آمارها یکجا
```javascript
import { calculateStatistics } from '@/utils';

const stats = calculateStatistics(pixelData);
console.log(stats);
// {
//   mean: 127.6,
//   median: 128,
//   min: 120,
//   max: 135,
//   stdDev: 5.36,
//   variance: 28.74,
//   count: 5
// }
```

#### محاسبه Histogram
```javascript
import { calculateHistogram } from '@/utils';

// برای تصاویر 8-bit
const histogram8bit = calculateHistogram(pixelData, 256, 255);

// برای تصاویر 16-bit
const histogram16bit = calculateHistogram(pixelData, 65536, 65535);
```

---

### `imageMetrics.js` - متریک‌های کیفیت تصویر

#### محاسبه SNR (Signal-to-Noise Ratio)
```javascript
import { calculateSNR } from '@/utils';

const roiData = [120, 122, 118, 125, 123];
const snr = calculateSNR(roiData);
console.log(`SNR: ${snr.toFixed(2)}`); // SNR = Mean / StdDev
```

#### محاسبه CNR (Contrast-to-Noise Ratio)
```javascript
import { calculateCNR } from '@/utils';

const signalROI = [150, 155, 152, 148, 153];
const backgroundROI = [80, 82, 78, 81, 79];

const cnr = calculateCNR(signalROI, backgroundROI);
console.log(`CNR: ${cnr.toFixed(2)}`); // CNR = |Mean_a - Mean_b| / StdDev_b
```

#### محاسبه Transmission%
```javascript
import { calculateTransmission } from '@/utils';

const currentIntensity = 120;
const referenceIntensity = 200; // I0

const transmission = calculateTransmission(currentIntensity, referenceIntensity);
console.log(`Transmission: ${transmission.toFixed(2)}%`); // 60%
```

#### محاسبه همه متریک‌ها یکجا
```javascript
import { calculateAllMetrics } from '@/utils';

const metrics = calculateAllMetrics({
  roiData: signalROI,
  backgroundData: backgroundROI,
  referenceIntensity: 255
});

console.log(metrics);
// {
//   snr: 45.2,
//   cnr: 15.8,
//   transmission: 60.5,
//   minTransmission: 58.0,
//   attenuation: 0.51
// }
```

---

### `fft.js` - عملیات FFT

#### FFT یک‌بعدی
```javascript
import { fft1D, ifft1D } from '@/utils';

const signal = [1, 2, 3, 4, 5, 6, 7, 8];
const fftResult = fft1D(signal);

console.log(fftResult);
// {
//   real: [...],
//   imaginary: [...],
//   magnitude: [...],
//   phase: [...]
// }

// بازگشت به سیگنال اصلی
const reconstructed = ifft1D(fftResult.real, fftResult.imaginary);
```

#### FFT دوبعدی (برای تصاویر)
```javascript
import { fft2D, ifft2D } from '@/utils';

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// محاسبه FFT
const fftData = fft2D(imageData, 'gray');

// اعمال فیلتر فرکانسی
import { applyFrequencyFilter, createLowPassFilter } from '@/utils';

const lowPassFilter = createLowPassFilter(30); // cutoff radius = 30
const filteredFFT = applyFrequencyFilter(fftData, lowPassFilter);

// بازگشت به حوزه مکان
const filteredImage = ifft2D(filteredFFT);
```

#### نمایش FFT Spectrum
```javascript
import { fftToImage, fftShift } from '@/utils';

const fftData = fft2D(imageData);

// Center the FFT for better visualization
const centeredMagnitude = fftShift(fftData.magnitude, fftData.width, fftData.height);

// Convert to displayable image
const spectrumImage = fftToImage(centeredMagnitude, fftData.width, fftData.height);

// نمایش در canvas
ctx.putImageData(spectrumImage, 0, 0);
```

---

## 🖼️ 2. Image Processing

### `filters.js` - فیلترهای تصویر

#### Gaussian Blur
```javascript
import { applyGaussianFilter } from '@/utils';

const blurred = applyGaussianFilter(imageData, 1.5); // sigma = 1.5
ctx.putImageData(blurred, 0, 0);
```

#### Median Filter (حذف نویز)
```javascript
import { applyMedianFilter } from '@/utils';

const denoised = applyMedianFilter(imageData, 3); // kernel size = 3
ctx.putImageData(denoised, 0, 0);
```

#### Edge Detection (Sobel)
```javascript
import { applySobelEdgeDetection } from '@/utils';

const edges = applySobelEdgeDetection(imageData);
ctx.putImageData(edges, 0, 0);
```

#### Sharpening (Unsharp Mask)
```javascript
import { applyUnsharpMask } from '@/utils';

const sharpened = applyUnsharpMask(imageData, 1.5, 1.0); // amount=1.5, sigma=1.0
ctx.putImageData(sharpened, 0, 0);
```

#### لیست همه فیلترهای موجود
```javascript
import { getAvailableFilters } from '@/utils';

const filters = getAvailableFilters();
console.log(filters);
// [
//   { id: 'gaussian', name: 'Gaussian Blur', params: ['sigma'] },
//   { id: 'median', name: 'Median Filter', params: ['kernelSize'] },
//   ...
// ]
```

---

### `transforms.js` - تبدیلات تصویر

#### Gamma Correction
```javascript
import { applyGammaCorrection } from '@/utils';

const gamma = 1.5; // < 1 روشن‌تر، > 1 تیره‌تر
const corrected = applyGammaCorrection(imageData, gamma);
```

#### Histogram Equalization
```javascript
import { equalizeHistogram } from '@/utils';

const equalized = equalizeHistogram(imageData);
```

#### Normalization
```javascript
import { normalizeHistogram } from '@/utils';

const normalized = normalizeHistogram(imageData, 0, 255);
```

#### Invert (Negative)
```javascript
import { invertImage, invertImageSimple } from '@/utils';

// با استفاده از لگاریتم (برای CT/X-Ray)
const inverted = invertImage(imageData, 255);

// معکوس ساده (255 - value)
const invertedSimple = invertImageSimple(imageData);
```

#### Window/Level Adjustment
```javascript
import { applyWindowLevel } from '@/utils';

const windowCenter = 128;
const windowWidth = 100;

const windowed = applyWindowLevel(imageData, windowCenter, windowWidth);
```

#### Pixel Binning
```javascript
import { applyPixelBinning } from '@/utils';

const binned = applyPixelBinning(imageData, 2); // 2×2 binning
// تصویر خروجی نصف سایز ورودی خواهد بود
```

#### Rotate & Mirror
```javascript
import { rotateImage, mirrorImage } from '@/utils';

const rotated90 = rotateImage(imageData, 90);
const rotated180 = rotateImage(imageData, 180);
const rotated270 = rotateImage(imageData, 270);

const mirroredH = mirrorImage(imageData, 'horizontal');
const mirroredV = mirrorImage(imageData, 'vertical');
```

#### HDR (High Dynamic Range)
```javascript
import { createHDR } from '@/utils';

const images = [lowExposure, midExposure, highExposure];
const exposureTimes = [100, 500, 2000]; // ms

const hdrImage = createHDR(images, exposureTimes);
```

---

## 🎯 3. ROI Analysis

### `roiAnalysis.js` - آنالیز ناحیه مورد نظر

#### تعریف ROI مستطیلی
```javascript
import { analyzeROI } from '@/utils';

const roi = {
  x: 100,
  y: 100,
  width: 50,
  height: 50
};

const analysis = analyzeROI(imageData, roi, 'rectangle', {
  channel: 'gray',
  calculateMetrics: true,
  referenceIntensity: 255
});

console.log(analysis);
// {
//   shape: 'rectangle',
//   roi: {...},
//   area: 2500,
//   pixelCount: 2500,
//   statistics: {
//     mean: 125.5,
//     median: 128,
//     min: 100,
//     max: 150,
//     stdDev: 12.3,
//     variance: 151.29,
//     count: 2500
//   },
//   metrics: {
//     snr: 10.2,
//     cnr: 0,
//     transmission: 49.2,
//     ...
//   }
// }
```

#### ROI دایره‌ای
```javascript
const circleROI = {
  centerX: 200,
  centerY: 200,
  radius: 50
};

const circleAnalysis = analyzeROI(imageData, circleROI, 'circle');
```

#### استخراج Line Profile
```javascript
import { extractLineProfile } from '@/utils';

const line = {
  x1: 100,
  y1: 100,
  x2: 200,
  y2: 200
};

const profile = extractLineProfile(imageData, line, 'gray');
console.log(profile);
// [
//   { x: 100, y: 100, distance: 0, value: 120 },
//   { x: 101, y: 101, distance: 1, value: 122 },
//   ...
// ]
```

#### مقایسه دو ROI
```javascript
import { compareROIs } from '@/utils';

const roi1Analysis = analyzeROI(imageData, roi1, 'rectangle');
const roi2Analysis = analyzeROI(imageData, roi2, 'rectangle');

const comparison = compareROIs(roi1Analysis, roi2Analysis);
console.log(comparison);
// {
//   meanDifference: 25.5,
//   meanRatio: 1.2,
//   contrastRatio: 15.8,
//   ...
// }
```

---

## 💾 4. Export Utilities

### `imageExport.js` - خروجی تصویر

#### Export به PNG
```javascript
import { exportAsPNG } from '@/utils';

const canvas = document.getElementById('myCanvas');
exportAsPNG(canvas, 'output.png');
```

#### Export به JPEG
```javascript
import { exportAsJPEG } from '@/utils';

exportAsJPEG(canvas, 'output.jpg', 0.95); // quality = 0.95
```

#### Export به TIFF
```javascript
import { exportAsTIFF } from '@/utils';

exportAsTIFF(imageData, 'output.tif', {
  description: 'CT Scan Image',
  software: 'CT Scanner v1.0'
});
```

#### Export به DICONDE
```javascript
import { exportAsDICONDE } from '@/utils';

exportAsDICONDE(imageData, 'scan.dcm', {
  patientName: 'Test Subject',
  studyDate: '2025-10-12',
  modality: 'CT',
  kVp: '120',
  mA: '100',
  exposureTime: '1000'
});
```

#### Export چندین تصویر به ZIP
```javascript
import { exportAsZIP } from '@/utils';

const images = [
  { data: imageData1, filename: 'scan_001.png' },
  { data: imageData2, filename: 'scan_002.png' },
  { data: imageData3, filename: 'scan_003.png' }
];

exportAsZIP(images, 'ct_scans.zip');
```

---

### `csvExport.js` - خروجی CSV و Metadata

#### Export Histogram
```javascript
import { exportHistogramToCSV } from '@/utils';

const histogramData = [120, 450, 890, 1200, ...]; // 256 values

exportHistogramToCSV(histogramData, 'histogram.csv', {
  date: '2025-10-12',
  bitDepth: '8-bit',
  totalPixels: width * height
});
```

#### Export Intensity Profile
```javascript
import { exportIntensityProfileToCSV } from '@/utils';

const profileData = [
  { distance: 0, x: 100, y: 100, intensity: 120 },
  { distance: 1, x: 101, y: 101, intensity: 122 },
  ...
];

exportIntensityProfileToCSV(profileData, 'profile.csv', {
  type: 'line',
  length: 100,
  channel: 'gray'
});
```

#### Export ROI Analysis
```javascript
import { exportROIAnalysisToCSV } from '@/utils';

const roiAnalysis = analyzeROI(imageData, roi, 'rectangle');
exportROIAnalysisToCSV(roiAnalysis, 'roi_analysis.csv');
```

#### Export CT Metadata (ردیف 75 سند)
```javascript
import { exportCTMetadata } from '@/utils';

const metadata = {
  // Geometry
  SOD: 500,
  SDD: 1000,
  magnification: 2.0,
  pixelPitch: 50,
  effectivePixelSize: 25,
  coneBeamAngle: 15,

  // X-Ray Parameters
  kVp: 120,
  current: 100,
  currentUnit: 'mA',
  power: 50,
  exposureTime: 1000,
  filtrationMaterial: 'Al',
  filtrationThickness: 1.5,

  // Detector
  detectorType: 'Flat Panel',
  bitDepth: '16-bit',

  // Acquisition
  projectionNumbers: 360,
  totalAngle: 360,
  rotationAngle: 1,
  totalScanTime: 180,

  // Processing
  reconstructionMethod: 'FBP',
  reconstructionFilter: 'Shepp-Logan',
  imageFilters: ['Gaussian', 'Median'],

  // Other
  timestamp: new Date().toISOString(),
  operator: 'John Doe',
  notes: 'Test scan'
};

exportCTMetadata(metadata, 'scan_metadata.txt');
```

#### Export کل پروژه
```javascript
import { exportProjectData } from '@/utils';

const projectData = {
  images: [...],
  metadata: {...},
  histograms: [...],
  profiles: [...],
  roiAnalyses: [...]
};

exportProjectData(projectData, 'my_ct_project');
// خروجی: my_ct_project.zip
```

---

## 🎨 5. استفاده در Component ها

### مثال: استفاده در HistogramDisplay
```javascript
import React from 'react';
import { calculateHistogram, calculateStatistics } from '@/utils';

const HistogramDisplay = ({ imageData }) => {
  const pixelData = extractGrayscaleData(imageData);
  const histogram = calculateHistogram(pixelData, 256, 255);
  const stats = calculateStatistics(pixelData);

  return (
    <div>
      <p>Mean: {stats.mean.toFixed(2)}</p>
      <p>Std Dev: {stats.stdDev.toFixed(2)}</p>
      {/* رسم هیستوگرام با Chart.js */}
    </div>
  );
};
```

### مثال: اعمال فیلتر در BaslerDisplay
```javascript
import { applyGaussianFilter } from '@/utils';

const handleApplyFilter = (filterId, params) => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let filtered;
  if (filterId === 'gaussian') {
    filtered = applyGaussianFilter(imageData, params.sigma);
  }

  ctx.putImageData(filtered, 0, 0);
};
```

---

## 📋 Checklist ویژگی‌های پیاده‌سازی شده

### ✅ Math & Statistics
- [x] Mean, Min, Max, Median
- [x] Standard Deviation, Variance
- [x] Histogram Calculation
- [x] Normalization
- [x] Percentile

### ✅ Image Quality Metrics
- [x] SNR (Signal-to-Noise Ratio)
- [x] CNR (Contrast-to-Noise Ratio)
- [x] Transmission %
- [x] Attenuation Coefficient

### ✅ Image Filters
- [x] Gaussian Blur
- [x] Median Filter
- [x] Mean Filter
- [x] Variance Filter
- [x] Sobel Edge Detection
- [x] Laplacian Edge Detection
- [x] Unsharp Mask (Sharpening)

### ✅ Frequency Domain
- [x] 1D FFT & Inverse FFT
- [x] 2D FFT & Inverse FFT
- [x] Low-Pass Filter
- [x] High-Pass Filter
- [x] Band-Pass Filter
- [x] FFT Visualization

### ✅ Image Transformations
- [x] Gamma Correction
- [x] Histogram Equalization
- [x] Normalization
- [x] Invert (Logarithmic & Simple)
- [x] Window/Level Adjustment
- [x] Pixel Binning (2×2, 3×3, 4×4)
- [x] Rotate (90°, 180°, 270°)
- [x] Mirror (Horizontal, Vertical)
- [x] HDR Creation

### ✅ ROI Analysis
- [x] Rectangle ROI
- [x] Circle ROI
- [x] ROI Statistics
- [x] ROI Area Calculation
- [x] Line Profile Extraction
- [x] ROI Comparison
- [x] ROI Mask Creation

### ✅ Export
- [x] PNG Export
- [x] JPEG Export
- [x] TIFF Export (Basic)
- [x] DICONDE Export (with metadata)
- [x] ZIP Archive
- [x] CSV Export (Histogram, Profile, ROI)
- [x] Metadata Export (ردیف 75)
- [x] Project Export

---

## 🚀 Performance Tips

1. **Use Web Workers** for heavy computations (FFT, large filters)
2. **Cache results** when possible
3. **Use TypedArrays** (Uint8Array, Float32Array) for better performance
4. **Debounce** real-time updates
5. **Use requestAnimationFrame** for smooth animations

---

## 📝 نکات مهم

- همه توابع با **8-bit** و **16-bit** images سازگار هستند
- برای تصاویر بزرگ، از **Web Workers** استفاده کنید
- همیشه **ImageData** را clone کنید قبل از modify
- برای export DICONDE کامل، باید کتابخانه dicom-writer اضافه شود

---

تاریخ ایجاد: 12 اکتبر 2025
نسخه: 1.0.0
سازنده: CT Scanner Development Team
