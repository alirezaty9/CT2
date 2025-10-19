# Crosshair Tool - Feature Documentation

**Requirement #22**: Draw two lines passing through the center of ROI area

## Overview

This feature implements a sophisticated crosshair overlay system for ROI (Region of Interest) analysis in CT Scanner imaging. The crosshair automatically calculates and displays horizontal and vertical lines passing through the geometric center of any ROI shape.

## Architecture

### Components

```
src/
├── utils/
│   └── roi/
│       └── roiGeometry.js          # ROI geometry calculations
├── components/
│   ├── Tools/
│   │   └── CrosshairTool.jsx       # Core crosshair rendering component
│   └── ROI/
│       └── ROICrosshairOverlay.jsx # High-level wrapper with UI controls
└── pages/
    └── CrosshairDemo.jsx           # Demo/testing page
```

### 1. `roiGeometry.js` - Geometry Utilities

**Location**: `src/utils/roi/roiGeometry.js`

**Purpose**: Pure mathematical functions for ROI geometry calculations

**Key Functions**:

- `calculateRectangleCenter(roi)` - Calculate center of rectangular ROI
- `calculateCircleCenter(roi)` - Calculate center of circular ROI
- `calculateEllipseCenter(roi)` - Calculate center of elliptical ROI
- `calculatePolygonCentroid(points)` - Calculate centroid of polygon using standard formula
- `calculateROICenter(roi, shape)` - Generic center calculation dispatcher
- `calculateCrosshairBounds(roi, shape, canvasBounds, options)` - Calculate line endpoints
- `calculateCrosshairIntersections(roi, shape)` - Calculate intersection points with ROI boundary
- `validateROIForCrosshair(roi, shape)` - Validate ROI definition

**Features**:
- ✅ Support for multiple ROI shapes (rectangle, circle, ellipse, polygon)
- ✅ Robust error handling with validation
- ✅ Option to extend crosshair beyond ROI bounds
- ✅ Configurable margins
- ✅ Fully documented with JSDoc

**Example Usage**:

```javascript
import { calculateROICenter, calculateCrosshairBounds } from '@/utils/roi/roiGeometry';

// Rectangle ROI
const rectROI = { x: 100, y: 100, width: 200, height: 150 };
const center = calculateROICenter(rectROI, 'rectangle');
// Returns: { x: 200, y: 175 }

// Circle ROI
const circleROI = { centerX: 300, centerY: 250, radius: 80 };
const center2 = calculateROICenter(circleROI, 'circle');
// Returns: { x: 300, y: 250 }

// Crosshair bounds
const bounds = calculateCrosshairBounds(
  rectROI,
  'rectangle',
  { width: 800, height: 600 },
  { extendBeyondROI: true }
);
// Returns: {
//   horizontal: { x1: 0, y1: 175, x2: 800, y2: 175 },
//   vertical: { x1: 200, y1: 0, x2: 200, y2: 600 }
// }
```

---

### 2. `CrosshairTool.jsx` - Core Component

**Location**: `src/components/Tools/CrosshairTool.jsx`

**Purpose**: Low-level component that renders crosshair lines on Fabric.js canvas

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fabricCanvas` | `fabric.Canvas` | - | Fabric.js canvas instance |
| `roi` | `Object` | - | ROI definition object |
| `roiShape` | `String` | - | ROI shape type |
| `enabled` | `Boolean` | `false` | Enable/disable crosshair |
| `config` | `Object` | `{}` | Configuration object |
| `onCrosshairUpdate` | `Function` | `null` | Callback when crosshair updates |
| `className` | `String` | `''` | CSS class name |

**Configuration Object**:

```javascript
{
  color: '#00ff00',              // Line color (hex)
  strokeWidth: 1,                // Line thickness (px)
  strokeDashArray: [5, 5],       // Dash pattern
  opacity: 0.8,                  // Line opacity (0-1)
  selectable: false,             // Can lines be selected?
  evented: false,                // Do lines respond to events?
  extendBeyondROI: true,         // Extend to canvas edges?
  showCenter: true,              // Show center marker?
  centerRadius: 3,               // Center marker radius (px)
  centerColor: '#ff0000'         // Center marker color
}
```

**Features**:
- ✅ Automatic line creation and cleanup
- ✅ Real-time updates when ROI changes
- ✅ Customizable appearance
- ✅ Optional center point marker
- ✅ Non-interactive by default (won't interfere with other tools)
- ✅ Minimal re-renders

**Example Usage**:

```jsx
import CrosshairTool from '@/components/Tools/CrosshairTool';

function MyComponent() {
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const roi = { x: 100, y: 100, width: 200, height: 150 };

  return (
    <CrosshairTool
      fabricCanvas={fabricCanvas}
      roi={roi}
      roiShape="rectangle"
      enabled={true}
      config={{
        color: '#00ff00',
        strokeWidth: 2,
        extendBeyondROI: false
      }}
      onCrosshairUpdate={(data) => {
        console.log('Center:', data.center);
        console.log('Bounds:', data.bounds);
      }}
    />
  );
}
```

---

### 3. `ROICrosshairOverlay.jsx` - High-Level Wrapper

**Location**: `src/components/ROI/ROICrosshairOverlay.jsx`

**Purpose**: Complete solution with auto-detection, multi-ROI support, and UI controls

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fabricCanvas` | `fabric.Canvas` | - | Fabric.js canvas instance |
| `enabled` | `Boolean` | `false` | Enable/disable crosshair overlay |
| `autoDetectROIs` | `Boolean` | `true` | Auto-detect ROIs on canvas |
| `manualROIs` | `Array` | `[]` | Manually specified ROIs |
| `defaultConfig` | `Object` | `{}` | Default crosshair config |
| `showControls` | `Boolean` | `true` | Show UI control panel |
| `onCrosshairUpdate` | `Function` | `null` | Update callback |
| `className` | `String` | `''` | CSS class name |

**Features**:
- ✅ **Auto-detection**: Automatically finds ROI objects on canvas
- ✅ **Multi-ROI support**: Handles multiple ROIs simultaneously
- ✅ **UI Controls**: Built-in control panel for configuration
- ✅ **ROI Selector**: Select which ROI to show crosshair for
- ✅ **Real-time monitoring**: Watches canvas for ROI changes
- ✅ **Manual mode**: Can also work with manually specified ROIs

**Auto-Detection**:

The component automatically detects ROI objects on the canvas based on their `name` property:
- Objects with names starting with `roi-` are recognized as ROIs
- Supports `rect`, `circle`, `ellipse`, and `polygon` Fabric.js objects
- Updates automatically when ROIs are added, removed, or modified

**Example Usage**:

```jsx
import ROICrosshairOverlay from '@/components/ROI/ROICrosshairOverlay';

function MyImageViewer() {
  const [fabricCanvas, setFabricCanvas] = useState(null);

  return (
    <div>
      <canvas ref={(el) => {
        if (el && !fabricCanvas) {
          const canvas = new fabric.Canvas(el);
          setFabricCanvas(canvas);
        }
      }} />

      <ROICrosshairOverlay
        fabricCanvas={fabricCanvas}
        enabled={true}
        autoDetectROIs={true}
        showControls={true}
        onCrosshairUpdate={(data) => {
          console.log(`ROI ${data.roiId} center:`, data.center);
        }}
      />
    </div>
  );
}
```

---

### 4. `CrosshairDemo.jsx` - Demo Page

**Location**: `src/pages/CrosshairDemo.jsx`

**Purpose**: Interactive demonstration and testing page

**Route**: `/crosshair-demo`

**Features**:
- ✅ Interactive canvas with sample background
- ✅ Buttons to add different ROI shapes
- ✅ Real-time crosshair visualization
- ✅ Full control panel
- ✅ ROI counter
- ✅ Clear all functionality
- ✅ Comprehensive feature list

**How to Access**:

1. Start the development server: `npm run dev`
2. Navigate to: `http://localhost:5173/crosshair-demo`
3. Click buttons to add ROIs
4. See crosshairs automatically drawn through centers
5. Move/resize ROIs to see crosshairs update in real-time

---

## Integration Guide

### Adding Crosshair to BaslerDisplay

```jsx
import React, { useRef, useState, useEffect } from 'react';
import { fabric } from 'fabric';
import ROICrosshairOverlay from '@/components/ROI/ROICrosshairOverlay';

const BaslerDisplay = () => {
  const fabricCanvasRef = useRef(null);
  const [crosshairEnabled, setCrosshairEnabled] = useState(false);

  useEffect(() => {
    // Initialize Fabric canvas
    const canvas = new fabric.Canvas('basler-canvas', {
      width: 640,
      height: 480
    });
    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div>
      <canvas id="basler-canvas" />

      {/* Add Crosshair Overlay */}
      <ROICrosshairOverlay
        fabricCanvas={fabricCanvasRef.current}
        enabled={crosshairEnabled}
        autoDetectROIs={true}
        showControls={true}
      />

      {/* Toggle Button */}
      <button onClick={() => setCrosshairEnabled(!crosshairEnabled)}>
        Toggle Crosshair
      </button>
    </div>
  );
};
```

### Creating ROIs on Canvas

ROIs must have a `name` property starting with `roi-` to be auto-detected:

```javascript
// Rectangle ROI
const rect = new fabric.Rect({
  left: 100,
  top: 100,
  width: 200,
  height: 150,
  fill: 'rgba(0, 150, 255, 0.3)',
  stroke: '#0096ff',
  strokeWidth: 2,
  name: 'roi-rect-1'  // ← Important!
});
canvas.add(rect);

// Circle ROI
const circle = new fabric.Circle({
  left: 300,
  top: 200,
  radius: 80,
  fill: 'rgba(255, 100, 100, 0.3)',
  stroke: '#ff6464',
  strokeWidth: 2,
  name: 'roi-circle-1'  // ← Important!
});
canvas.add(circle);
```

---

## Configuration Examples

### Minimal Configuration

```jsx
<ROICrosshairOverlay
  fabricCanvas={canvas}
  enabled={true}
/>
```

### Custom Appearance

```jsx
<ROICrosshairOverlay
  fabricCanvas={canvas}
  enabled={true}
  defaultConfig={{
    color: '#ff00ff',           // Magenta lines
    strokeWidth: 3,             // Thicker lines
    strokeDashArray: [10, 5],   // Different dash pattern
    opacity: 1,                 // Fully opaque
    extendBeyondROI: false,     // Stay within ROI
    showCenter: true,           // Show center marker
    centerRadius: 5,            // Larger center marker
    centerColor: '#ffff00'      // Yellow center
  }}
/>
```

### Manual ROI Mode

```jsx
const manualROIs = [
  {
    roi: { x: 100, y: 100, width: 200, height: 150 },
    shape: 'rectangle',
    id: 'manual-roi-1'
  },
  {
    roi: { centerX: 400, centerY: 300, radius: 80 },
    shape: 'circle',
    id: 'manual-roi-2'
  }
];

<ROICrosshairOverlay
  fabricCanvas={canvas}
  enabled={true}
  autoDetectROIs={false}
  manualROIs={manualROIs}
/>
```

---

## API Reference

### roiGeometry.js

#### `calculateROICenter(roi, shape)`

Calculate the geometric center of an ROI.

**Parameters**:
- `roi` (Object): ROI definition
- `shape` (String): ROI shape type ('rectangle', 'circle', 'ellipse', 'polygon')

**Returns**: `{ x: number, y: number }`

**Throws**: Error if ROI is invalid or shape is unsupported

---

#### `calculateCrosshairBounds(roi, shape, canvasBounds, options)`

Calculate the start and end points for crosshair lines.

**Parameters**:
- `roi` (Object): ROI definition
- `shape` (String): ROI shape type
- `canvasBounds` (Object): `{ width, height }`
- `options` (Object): Optional settings
  - `extendBeyondROI` (Boolean): Extend to canvas edges (default: false)
  - `margin` (Number): Additional margin in pixels (default: 0)

**Returns**:
```javascript
{
  horizontal: { x1, y1, x2, y2 },
  vertical: { x1, y1, x2, y2 }
}
```

---

## Supported ROI Shapes

| Shape | Required Properties | Example |
|-------|---------------------|---------|
| Rectangle | `x, y, width, height` | `{ x: 100, y: 100, width: 200, height: 150 }` |
| Circle | `centerX, centerY, radius` | `{ centerX: 300, centerY: 250, radius: 80 }` |
| Ellipse | `centerX, centerY, radiusX, radiusY` | `{ centerX: 400, centerY: 300, radiusX: 100, radiusY: 60 }` |
| Polygon | `points` (Array) | `{ points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 }] }` |

---

## Translations

### English

```json
{
  "crosshairTool": "Crosshair Tool",
  "roiCrosshair": "ROI Crosshair",
  "requirement22": "Requirement #22",
  "lineColor": "Line Color",
  "lineWidth": "Line Width",
  "extendBeyondROI": "Extend Beyond ROI",
  "showCenterMarker": "Show Center Marker",
  "selectROI": "Select ROI",
  "allROIs": "All ROIs",
  "noROIsDetected": "No ROIs detected",
  "drawROIOnCanvas": "Draw a rectangle, circle, or other shape on the canvas to create an ROI.",
  "detectedROIs": "Detected {{count}} ROI(s)",
  "crosshairInfo": "Crosshair lines will be drawn through the center of each ROI."
}
```

### Persian (فارسی)

```json
{
  "crosshairTool": "ابزار خطوط متقاطع",
  "roiCrosshair": "خطوط متقاطع ROI",
  "requirement22": "مورد 22",
  "lineColor": "رنگ خط",
  "lineWidth": "ضخامت خط",
  "extendBeyondROI": "گسترش خارج از ROI",
  "showCenterMarker": "نمایش نشانگر مرکز",
  "selectROI": "انتخاب ROI",
  "allROIs": "همه ROIها",
  "noROIsDetected": "هیچ ROI شناسایی نشد",
  "drawROIOnCanvas": "یک مستطیل، دایره یا شکل دیگری روی بوم ترسیم کنید تا ROI ایجاد شود.",
  "detectedROIs": "{{count}} ROI شناسایی شد",
  "crosshairInfo": "خطوط متقاطع از مرکز هر ROI عبور خواهند کرد."
}
```

---

## Testing

### Manual Testing

1. Navigate to `/crosshair-demo`
2. Add different ROI shapes using the buttons
3. Verify crosshairs are drawn through centers
4. Move/resize ROIs and verify crosshairs update
5. Test different configurations using the control panel
6. Test with multiple simultaneous ROIs
7. Test ROI selection dropdown
8. Test clear all functionality

### Automated Testing (Future)

```javascript
import { calculateROICenter, calculateCrosshairBounds } from '@/utils/roi/roiGeometry';

describe('ROI Geometry', () => {
  test('calculates rectangle center correctly', () => {
    const roi = { x: 100, y: 100, width: 200, height: 150 };
    const center = calculateROICenter(roi, 'rectangle');
    expect(center).toEqual({ x: 200, y: 175 });
  });

  test('calculates circle center correctly', () => {
    const roi = { centerX: 300, centerY: 250, radius: 80 };
    const center = calculateROICenter(roi, 'circle');
    expect(center).toEqual({ x: 300, y: 250 });
  });

  test('throws error for invalid ROI', () => {
    expect(() => {
      calculateROICenter({}, 'rectangle');
    }).toThrow();
  });
});
```

---

## Performance Considerations

- **Lazy Rendering**: Crosshairs only render when enabled
- **Smart Updates**: Only updates when ROI actually changes
- **Minimal Canvas Operations**: Uses efficient Fabric.js primitives
- **No State Bloat**: CrosshairTool doesn't render UI (returns null)
- **Event Debouncing**: ROI detection uses intervals with cleanup

---

## Future Enhancements

1. **Angle Markers**: Add angle indicators at intersection points
2. **Measurements**: Display ROI dimensions on crosshair
3. **Snap to Grid**: Option to snap crosshair to pixel grid
4. **Export**: Include crosshair in image export
5. **3D Support**: Extend to volumetric data
6. **Animation**: Smooth transitions when ROI moves

---

## Troubleshooting

### Crosshair not appearing

- ✅ Check that `enabled` prop is `true`
- ✅ Verify Fabric canvas is initialized
- ✅ Ensure ROI objects have `name` property starting with `roi-`
- ✅ Check browser console for validation errors

### Crosshair not updating

- ✅ Verify `autoDetectROIs` is enabled
- ✅ Check that ROI objects are actually being modified on canvas
- ✅ Try manually triggering a canvas render: `canvas.renderAll()`

### Performance issues

- ✅ Reduce update frequency if many ROIs
- ✅ Disable crosshair when not needed
- ✅ Use `extendBeyondROI: false` for better performance

---

## Credits

**Developer**: CT Scanner Development Team
**Version**: 2.0.0
**Date**: 2025-01-19
**Requirement**: #22 - Draw two lines passing through the center of ROI

---

## License

Internal use only - CT Scanner Project
