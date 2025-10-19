/**
 * ROI Geometry Utilities
 * Advanced geometric calculations for ROI analysis
 * Requirement #22: Draw two lines passing through the center of ROI
 *
 * @module utils/roi/roiGeometry
 * @author CT Scanner Development Team
 * @version 2.0.0
 */

/**
 * Calculate the geometric center of a rectangular ROI
 * @param {Object} roi - Rectangle ROI definition {x, y, width, height}
 * @returns {Object} Center point {x, y}
 */
export const calculateRectangleCenter = (roi) => {
  if (!roi || typeof roi.x === 'undefined' || typeof roi.y === 'undefined') {
    throw new Error('Invalid rectangle ROI: missing x or y coordinates');
  }

  if (typeof roi.width === 'undefined' || typeof roi.height === 'undefined') {
    throw new Error('Invalid rectangle ROI: missing width or height');
  }

  return {
    x: roi.x + roi.width / 2,
    y: roi.y + roi.height / 2
  };
};

/**
 * Calculate the center of a circular ROI
 * @param {Object} roi - Circle ROI definition {centerX, centerY, radius}
 * @returns {Object} Center point {x, y}
 */
export const calculateCircleCenter = (roi) => {
  if (!roi || typeof roi.centerX === 'undefined' || typeof roi.centerY === 'undefined') {
    throw new Error('Invalid circle ROI: missing centerX or centerY');
  }

  return {
    x: roi.centerX,
    y: roi.centerY
  };
};

/**
 * Calculate the centroid of a polygon ROI
 * Uses the standard centroid formula for polygons
 * @param {Array<Object>} points - Array of points [{x, y}, ...]
 * @returns {Object} Centroid point {x, y}
 */
export const calculatePolygonCentroid = (points) => {
  if (!Array.isArray(points) || points.length < 3) {
    throw new Error('Invalid polygon: at least 3 points required');
  }

  let area = 0;
  let cx = 0;
  let cy = 0;

  // Calculate signed area and centroid
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const cross = xi * yj - xj * yi;
    area += cross;
    cx += (xi + xj) * cross;
    cy += (yi + yj) * cross;
  }

  area /= 2;

  if (Math.abs(area) < 1e-10) {
    throw new Error('Degenerate polygon: area is zero');
  }

  cx /= (6 * area);
  cy /= (6 * area);

  return { x: cx, y: cy };
};

/**
 * Calculate center of an ellipse ROI
 * @param {Object} roi - Ellipse ROI definition {centerX, centerY, radiusX, radiusY}
 * @returns {Object} Center point {x, y}
 */
export const calculateEllipseCenter = (roi) => {
  if (!roi || typeof roi.centerX === 'undefined' || typeof roi.centerY === 'undefined') {
    throw new Error('Invalid ellipse ROI: missing centerX or centerY');
  }

  return {
    x: roi.centerX,
    y: roi.centerY
  };
};

/**
 * Generic center calculation based on ROI type
 * @param {Object} roi - ROI definition
 * @param {string} shape - ROI shape type ('rectangle', 'circle', 'ellipse', 'polygon')
 * @returns {Object} Center/centroid point {x, y}
 */
export const calculateROICenter = (roi, shape) => {
  if (!roi || !shape) {
    throw new Error('ROI and shape type are required');
  }

  switch (shape.toLowerCase()) {
    case 'rectangle':
    case 'rect':
    case 'square':
      return calculateRectangleCenter(roi);

    case 'circle':
      return calculateCircleCenter(roi);

    case 'ellipse':
      return calculateEllipseCenter(roi);

    case 'polygon':
      if (!Array.isArray(roi.points)) {
        throw new Error('Polygon ROI must have a points array');
      }
      return calculatePolygonCentroid(roi.points);

    default:
      throw new Error(`Unsupported ROI shape: ${shape}`);
  }
};

/**
 * Calculate bounds for crosshair lines given an ROI
 * @param {Object} roi - ROI definition
 * @param {string} shape - ROI shape type
 * @param {Object} canvasBounds - Canvas bounds {width, height}
 * @param {Object} options - Crosshair options {extendBeyondROI, margin}
 * @returns {Object} Crosshair bounds {horizontal: {x1, y1, x2, y2}, vertical: {x1, y1, x2, y2}}
 */
export const calculateCrosshairBounds = (roi, shape, canvasBounds, options = {}) => {
  const {
    extendBeyondROI = false,
    margin = 0
  } = options;

  const center = calculateROICenter(roi, shape);

  let bounds;

  if (extendBeyondROI) {
    // Crosshair extends to canvas edges
    bounds = {
      horizontal: {
        x1: 0,
        y1: center.y,
        x2: canvasBounds.width,
        y2: center.y
      },
      vertical: {
        x1: center.x,
        y1: 0,
        x2: center.x,
        y2: canvasBounds.height
      }
    };
  } else {
    // Crosshair constrained to ROI bounds
    let roiBounds;

    switch (shape.toLowerCase()) {
      case 'rectangle':
      case 'rect':
      case 'square':
        roiBounds = {
          minX: roi.x - margin,
          maxX: roi.x + roi.width + margin,
          minY: roi.y - margin,
          maxY: roi.y + roi.height + margin
        };
        break;

      case 'circle':
        roiBounds = {
          minX: roi.centerX - roi.radius - margin,
          maxX: roi.centerX + roi.radius + margin,
          minY: roi.centerY - roi.radius - margin,
          maxY: roi.centerY + roi.radius + margin
        };
        break;

      case 'ellipse':
        roiBounds = {
          minX: roi.centerX - roi.radiusX - margin,
          maxX: roi.centerX + roi.radiusX + margin,
          minY: roi.centerY - roi.radiusY - margin,
          maxY: roi.centerY + roi.radiusY + margin
        };
        break;

      case 'polygon':
        const points = roi.points;
        roiBounds = {
          minX: Math.min(...points.map(p => p.x)) - margin,
          maxX: Math.max(...points.map(p => p.x)) + margin,
          minY: Math.min(...points.map(p => p.y)) - margin,
          maxY: Math.max(...points.map(p => p.y)) + margin
        };
        break;

      default:
        throw new Error(`Unsupported ROI shape: ${shape}`);
    }

    bounds = {
      horizontal: {
        x1: roiBounds.minX,
        y1: center.y,
        x2: roiBounds.maxX,
        y2: center.y
      },
      vertical: {
        x1: center.x,
        y1: roiBounds.minY,
        x2: center.x,
        y2: roiBounds.maxY
      }
    };
  }

  return bounds;
};

/**
 * Calculate intersection points of crosshair with ROI boundary
 * Useful for advanced visualization
 * @param {Object} roi - ROI definition
 * @param {string} shape - ROI shape type
 * @returns {Array<Object>} Intersection points
 */
export const calculateCrosshairIntersections = (roi, shape) => {
  const center = calculateROICenter(roi, shape);
  const intersections = [];

  switch (shape.toLowerCase()) {
    case 'rectangle':
    case 'rect':
    case 'square': {
      // 4 intersection points with rectangle edges
      intersections.push(
        { x: roi.x, y: center.y, edge: 'left' },
        { x: roi.x + roi.width, y: center.y, edge: 'right' },
        { x: center.x, y: roi.y, edge: 'top' },
        { x: center.x, y: roi.y + roi.height, edge: 'bottom' }
      );
      break;
    }

    case 'circle': {
      // 4 intersection points with circle
      intersections.push(
        { x: roi.centerX - roi.radius, y: center.y, edge: 'left' },
        { x: roi.centerX + roi.radius, y: center.y, edge: 'right' },
        { x: center.x, y: roi.centerY - roi.radius, edge: 'top' },
        { x: center.x, y: roi.centerY + roi.radius, edge: 'bottom' }
      );
      break;
    }

    case 'ellipse': {
      // 4 intersection points with ellipse
      intersections.push(
        { x: roi.centerX - roi.radiusX, y: center.y, edge: 'left' },
        { x: roi.centerX + roi.radiusX, y: center.y, edge: 'right' },
        { x: center.x, y: roi.centerY - roi.radiusY, edge: 'top' },
        { x: center.x, y: roi.centerY + roi.radiusY, edge: 'bottom' }
      );
      break;
    }

    default:
      // For complex shapes, return center point only
      intersections.push({ x: center.x, y: center.y, edge: 'center' });
  }

  return intersections;
};

/**
 * Validate ROI definition for crosshair calculation
 * @param {Object} roi - ROI definition
 * @param {string} shape - ROI shape type
 * @returns {Object} Validation result {valid: boolean, errors: Array<string>}
 */
export const validateROIForCrosshair = (roi, shape) => {
  const errors = [];

  if (!roi) {
    errors.push('ROI is null or undefined');
    return { valid: false, errors };
  }

  if (!shape) {
    errors.push('Shape type is required');
    return { valid: false, errors };
  }

  try {
    calculateROICenter(roi, shape);
  } catch (error) {
    errors.push(error.message);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
