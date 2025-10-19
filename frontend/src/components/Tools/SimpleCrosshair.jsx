/**
 * SimpleCrosshair Component
 * Draws two perpendicular lines (horizontal and vertical) through origin or canvas center
 * Requirement #22: Draw two lines passing through the center
 *
 * @module components/Tools/SimpleCrosshair
 * @version 1.0.0
 */

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

const SimpleCrosshair = ({
  canvas,
  enabled = true,
  config = {}
}) => {
  const horizontalLineRef = useRef(null);
  const verticalLineRef = useRef(null);
  const centerMarkerRef = useRef(null);

  const defaultConfig = {
    color: '#00ff00',
    strokeWidth: 2,
    strokeDashArray: [10, 5],
    opacity: 0.8,
    showCenter: true,
    centerRadius: 5,
    centerColor: '#ff0000',
    centerX: null, // null = use canvas center
    centerY: null  // null = use canvas center
  };

  const finalConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    if (!canvas || !enabled) {
      // Remove existing crosshair lines
      if (horizontalLineRef.current) {
        canvas.remove(horizontalLineRef.current);
        horizontalLineRef.current = null;
      }
      if (verticalLineRef.current) {
        canvas.remove(verticalLineRef.current);
        verticalLineRef.current = null;
      }
      if (centerMarkerRef.current) {
        canvas.remove(centerMarkerRef.current);
        centerMarkerRef.current = null;
      }
      canvas?.renderAll();
      return;
    }

    // Get canvas dimensions
    const canvasWidth = canvas.width || 800;
    const canvasHeight = canvas.height || 600;

    // Calculate center point
    const centerX = finalConfig.centerX ?? canvasWidth / 2;
    const centerY = finalConfig.centerY ?? canvasHeight / 2;

    console.log(`[SimpleCrosshair] Drawing crosshair at (${centerX}, ${centerY})`);

    // Remove old lines if they exist
    if (horizontalLineRef.current) {
      canvas.remove(horizontalLineRef.current);
    }
    if (verticalLineRef.current) {
      canvas.remove(verticalLineRef.current);
    }
    if (centerMarkerRef.current) {
      canvas.remove(centerMarkerRef.current);
    }

    // Create horizontal line (from left edge to right edge, passing through center)
    const horizontalLine = new fabric.Line(
      [0, centerY, canvasWidth, centerY],
      {
        stroke: finalConfig.color,
        strokeWidth: finalConfig.strokeWidth,
        strokeDashArray: finalConfig.strokeDashArray,
        opacity: finalConfig.opacity,
        selectable: false,
        evented: false,
        name: 'crosshair-horizontal'
      }
    );

    // Create vertical line (from top edge to bottom edge, passing through center)
    const verticalLine = new fabric.Line(
      [centerX, 0, centerX, canvasHeight],
      {
        stroke: finalConfig.color,
        strokeWidth: finalConfig.strokeWidth,
        strokeDashArray: finalConfig.strokeDashArray,
        opacity: finalConfig.opacity,
        selectable: false,
        evented: false,
        name: 'crosshair-vertical'
      }
    );

    // Add lines to canvas
    canvas.add(horizontalLine);
    canvas.add(verticalLine);

    // Store references
    horizontalLineRef.current = horizontalLine;
    verticalLineRef.current = verticalLine;

    // Add center marker if enabled
    if (finalConfig.showCenter) {
      const centerMarker = new fabric.Circle({
        left: centerX - finalConfig.centerRadius,
        top: centerY - finalConfig.centerRadius,
        radius: finalConfig.centerRadius,
        fill: finalConfig.centerColor,
        stroke: finalConfig.centerColor,
        strokeWidth: 1,
        opacity: finalConfig.opacity,
        selectable: false,
        evented: false,
        name: 'crosshair-center'
      });

      canvas.add(centerMarker);
      centerMarkerRef.current = centerMarker;
    }

    // Render canvas
    canvas.renderAll();

    // Cleanup function
    return () => {
      if (horizontalLineRef.current) {
        canvas.remove(horizontalLineRef.current);
        horizontalLineRef.current = null;
      }
      if (verticalLineRef.current) {
        canvas.remove(verticalLineRef.current);
        verticalLineRef.current = null;
      }
      if (centerMarkerRef.current) {
        canvas.remove(centerMarkerRef.current);
        centerMarkerRef.current = null;
      }
      canvas?.renderAll();
    };
  }, [canvas, enabled, finalConfig.color, finalConfig.strokeWidth, finalConfig.opacity, finalConfig.showCenter, finalConfig.centerColor, finalConfig.centerRadius, finalConfig.centerX, finalConfig.centerY]);

  // This is a headless component - it doesn't render any React elements
  return null;
};

export default SimpleCrosshair;
