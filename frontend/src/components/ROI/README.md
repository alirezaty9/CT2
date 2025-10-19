# ROI Crosshair Component

**Requirement #22**: Draw two lines passing through the center of ROI

## Quick Start

```jsx
import ROICrosshairOverlay from '@/components/ROI/ROICrosshairOverlay';

function MyComponent() {
  const [canvas, setCanvas] = useState(null);

  return (
    <ROICrosshairOverlay
      fabricCanvas={canvas}
      enabled={true}
      autoDetectROIs={true}
      showControls={true}
    />
  );
}
```

## Demo

Visit `/crosshair-demo` to see an interactive demonstration.

## Files

- `ROICrosshairOverlay.jsx` - Main component with auto-detection and UI
- `../Tools/CrosshairTool.jsx` - Core crosshair rendering component
- `../../utils/roi/roiGeometry.js` - Geometry calculation utilities

## Features

✅ Auto-detection of ROIs on canvas
✅ Support for rectangle, circle, ellipse, polygon
✅ Real-time updates when ROI moves/resizes
✅ Customizable appearance (color, width, opacity)
✅ Optional center marker
✅ Can extend beyond ROI or stay within bounds
✅ Multi-ROI support
✅ Full i18n support (English, Persian)

## Creating ROIs

ROIs must have a `name` property starting with `roi-`:

```javascript
const rect = new fabric.Rect({
  left: 100,
  top: 100,
  width: 200,
  height: 150,
  name: 'roi-rect-1'  // Important!
});
canvas.add(rect);
```

## Configuration

```javascript
{
  color: '#00ff00',           // Line color
  strokeWidth: 1,             // Line thickness
  strokeDashArray: [5, 5],    // Dash pattern
  opacity: 0.8,               // Opacity (0-1)
  extendBeyondROI: true,      // Extend to canvas edges
  showCenter: true,           // Show center marker
  centerRadius: 3,            // Center marker size
  centerColor: '#ff0000'      // Center marker color
}
```

## Documentation

See `CROSSHAIR_FEATURE_DOCUMENTATION.md` for complete documentation.
