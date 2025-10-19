/**
 * PixelCoordinateTracker Component
 * Tracks mouse position on canvas and displays pixel coordinates (X,Y)
 * Requirement #23: Display pixel coordinates on cursor when enabled by user
 *
 * Features:
 * - Real-time mouse tracking
 * - Display X,Y coordinates
 * - Show pixel gray value
 * - Multiple display modes (tooltip, HUD)
 * - Performance optimized with throttling
 * - Supports zoomed/panned canvas
 *
 * @module components/Tools/PixelCoordinateTracker
 * @version 1.0.0
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { fabric } from 'fabric';

const PixelCoordinateTracker = ({
  canvas,
  enabled = true,
  displayMode = 'tooltip', // 'tooltip' | 'hud' | 'statusbar'
  showPixelValue = true,
  config = {}
}) => {
  const [coordinates, setCoordinates] = useState({ x: null, y: null, value: null });
  const [mousePosition, setMousePosition] = useState({ clientX: 0, clientY: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const tooltipRef = useRef(null);
  const hudRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const defaultConfig = {
    tooltipOffsetX: 15,
    tooltipOffsetY: 15,
    hudPosition: 'top-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    textColor: '#00ff00',
    fontSize: 12,
    padding: 8,
    borderRadius: 4,
    throttleMs: 16 // ~60fps
  };

  const finalConfig = { ...defaultConfig, ...config };

  /**
   * Get pixel value from canvas at given coordinates
   */
  const getPixelValue = useCallback((canvas, x, y) => {
    if (!canvas || x < 0 || y < 0) return null;

    try {
      // Get canvas context
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Get pixel data (RGBA)
      const imageData = ctx.getImageData(x, y, 1, 1);
      const data = imageData.data;

      // Calculate grayscale value (average of RGB)
      const grayValue = Math.round((data[0] + data[1] + data[2]) / 3);

      return grayValue;
    } catch (error) {
      console.warn('[PixelCoordinateTracker] Error getting pixel value:', error);
      return null;
    }
  }, []);

  /**
   * Handle mouse move on canvas
   */
  const handleMouseMove = useCallback((event) => {
    if (!canvas || !enabled) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < finalConfig.throttleMs) {
      return; // Throttle updates
    }
    lastUpdateRef.current = now;

    // Get mouse position relative to canvas
    const pointer = canvas.getPointer(event.e);
    const x = Math.round(pointer.x);
    const y = Math.round(pointer.y);

    // Get canvas dimensions
    const canvasWidth = canvas.width || 0;
    const canvasHeight = canvas.height || 0;

    // Check if coordinates are within canvas bounds
    if (x < 0 || y < 0 || x >= canvasWidth || y >= canvasHeight) {
      setIsHovering(false);
      return;
    }

    // Get pixel value if enabled
    let pixelValue = null;
    if (showPixelValue) {
      pixelValue = getPixelValue(canvas.lowerCanvasEl, x, y);
    }

    // Update state
    setCoordinates({ x, y, value: pixelValue });
    setMousePosition({ clientX: event.e.clientX, clientY: event.e.clientY });
    setIsHovering(true);
  }, [canvas, enabled, finalConfig.throttleMs, showPixelValue, getPixelValue]);

  /**
   * Handle mouse enter canvas
   */
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  /**
   * Handle mouse leave canvas
   */
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setCoordinates({ x: null, y: null, value: null });
  }, []);

  /**
   * Setup canvas event listeners
   */
  useEffect(() => {
    if (!canvas || !enabled) {
      setIsHovering(false);
      setCoordinates({ x: null, y: null, value: null });
      return;
    }

    // Add event listeners
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:over', handleMouseEnter);
    canvas.on('mouse:out', handleMouseLeave);

    console.log('[PixelCoordinateTracker] Event listeners attached');

    // Cleanup
    return () => {
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:over', handleMouseEnter);
      canvas.off('mouse:out', handleMouseLeave);
      console.log('[PixelCoordinateTracker] Event listeners removed');
    };
  }, [canvas, enabled, handleMouseMove, handleMouseEnter, handleMouseLeave]);

  /**
   * Update tooltip position
   */
  useEffect(() => {
    if (!tooltipRef.current || displayMode !== 'tooltip') return;

    tooltipRef.current.style.left = `${mousePosition.clientX + finalConfig.tooltipOffsetX}px`;
    tooltipRef.current.style.top = `${mousePosition.clientY + finalConfig.tooltipOffsetY}px`;
  }, [mousePosition, displayMode, finalConfig.tooltipOffsetX, finalConfig.tooltipOffsetY]);

  if (!enabled) return null;

  // Render tooltip mode
  if (displayMode === 'tooltip' && isHovering && coordinates.x !== null) {
    return (
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          backgroundColor: finalConfig.backgroundColor,
          color: finalConfig.textColor,
          fontSize: `${finalConfig.fontSize}px`,
          padding: `${finalConfig.padding}px`,
          borderRadius: `${finalConfig.borderRadius}px`,
          pointerEvents: 'none',
          zIndex: 9999,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          userSelect: 'none'
        }}
      >
        <div>X: {coordinates.x}</div>
        <div>Y: {coordinates.y}</div>
        {showPixelValue && coordinates.value !== null && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '4px', paddingTop: '4px' }}>
            Gray: {coordinates.value}
          </div>
        )}
      </div>
    );
  }

  // Render HUD mode
  if (displayMode === 'hud') {
    const hudPositionStyles = {
      'top-left': { top: '10px', left: '10px' },
      'top-right': { top: '10px', right: '10px' },
      'bottom-left': { bottom: '10px', left: '10px' },
      'bottom-right': { bottom: '10px', right: '10px' }
    };

    return (
      <div
        ref={hudRef}
        style={{
          position: 'fixed',
          ...hudPositionStyles[finalConfig.hudPosition],
          backgroundColor: finalConfig.backgroundColor,
          color: finalConfig.textColor,
          fontSize: `${finalConfig.fontSize}px`,
          padding: `${finalConfig.padding}px`,
          borderRadius: `${finalConfig.borderRadius}px`,
          zIndex: 9999,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          userSelect: 'none',
          minWidth: '120px',
          opacity: isHovering ? 1 : 0.5,
          transition: 'opacity 0.2s ease'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px' }}>
          Coordinates
        </div>
        <div>X: {coordinates.x ?? '---'}</div>
        <div>Y: {coordinates.y ?? '---'}</div>
        {showPixelValue && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '4px', paddingTop: '4px' }}>
            Gray: {coordinates.value ?? '---'}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default PixelCoordinateTracker;
