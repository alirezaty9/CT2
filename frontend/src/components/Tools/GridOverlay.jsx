/**
 * GridOverlay Component
 * Draws a simple grid overlay on the entire canvas
 * Requirement #25: Grid overlay for image space
 *
 * @module components/Tools/GridOverlay
 * @version 1.0.0
 */

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

const GridOverlay = ({
  canvas,
  enabled = true,
  config = {}
}) => {
  const gridLinesRef = useRef([]);

  const defaultConfig = {
    spacing: 50,           // Grid spacing in pixels
    color: '#00ff00',      // Line color
    strokeWidth: 1,        // Line width
    opacity: 0.5,          // Line opacity
    strokeDashArray: []    // Solid line by default, [5, 5] for dashed
  };

  const finalConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    if (!canvas || !enabled) {
      // Remove existing grid lines
      gridLinesRef.current.forEach(line => {
        canvas?.remove(line);
      });
      gridLinesRef.current = [];
      canvas?.renderAll();
      return;
    }

    // Get canvas dimensions
    const canvasWidth = canvas.width || 800;
    const canvasHeight = canvas.height || 600;

    console.log(`[GridOverlay] Drawing grid on ${canvasWidth}x${canvasHeight} canvas with ${finalConfig.spacing}px spacing`);

    // Remove old grid lines
    gridLinesRef.current.forEach(line => {
      canvas.remove(line);
    });
    gridLinesRef.current = [];

    const newLines = [];

    // Draw vertical lines
    for (let x = 0; x <= canvasWidth; x += finalConfig.spacing) {
      const line = new fabric.Line([x, 0, x, canvasHeight], {
        stroke: finalConfig.color,
        strokeWidth: finalConfig.strokeWidth,
        strokeDashArray: finalConfig.strokeDashArray,
        opacity: finalConfig.opacity,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: 'grid-line-vertical'
      });

      canvas.add(line);
      newLines.push(line);
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvasHeight; y += finalConfig.spacing) {
      const line = new fabric.Line([0, y, canvasWidth, y], {
        stroke: finalConfig.color,
        strokeWidth: finalConfig.strokeWidth,
        strokeDashArray: finalConfig.strokeDashArray,
        opacity: finalConfig.opacity,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: 'grid-line-horizontal'
      });

      canvas.add(line);
      newLines.push(line);
    }

    // Store references
    gridLinesRef.current = newLines;

    // Send grid lines to back so they don't cover other objects
    newLines.forEach(line => {
      canvas.sendToBack(line);
    });

    // Render canvas
    canvas.renderAll();

    console.log(`[GridOverlay] Drew ${newLines.length} grid lines`);

    // Cleanup function
    return () => {
      gridLinesRef.current.forEach(line => {
        canvas.remove(line);
      });
      gridLinesRef.current = [];
      canvas?.renderAll();
    };
  }, [canvas, enabled, finalConfig.spacing, finalConfig.color, finalConfig.strokeWidth, finalConfig.opacity, JSON.stringify(finalConfig.strokeDashArray)]);

  // This is a headless component
  return null;
};

export default GridOverlay;
