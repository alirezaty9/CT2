import React, { useRef, useCallback, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Move,
  X,
  Settings,
  Info
} from 'lucide-react';

const ZoomTool = forwardRef(({ canvas, isActive, onClose }, ref) => {
  const [showPanel, setShowPanel] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [originalState, setOriginalState] = useState(null);

  // Zoom levels
  const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400, 500];

  // Save original canvas state
  const saveOriginalState = useCallback(() => {
    if (!canvas) return;
    
    setOriginalState({
      zoom: canvas.getZoom(),
      viewportTransform: canvas.viewportTransform.slice()
    });
  }, [canvas]);

  // Reset zoom to fit
  const resetZoom = useCallback(() => {
    if (!canvas) return;
    
    // Save state before reset
    saveOriginalState();
    
    // Reset zoom to fit canvas
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.setZoom(1);
    setZoomLevel(100);
    canvas.renderAll();
  }, [canvas, saveOriginalState]);

  // Zoom in
  const zoomIn = useCallback(() => {
    if (!canvas) return;
    
    // Save state before zoom
    saveOriginalState();
    
    const currentZoom = canvas.getZoom();
    const newZoom = Math.min(currentZoom * 1.2, 5); // Max 500%
    
    canvas.setZoom(newZoom);
    setZoomLevel(Math.round(newZoom * 100));
    canvas.renderAll();
  }, [canvas, saveOriginalState]);

  // Zoom out
  const zoomOut = useCallback(() => {
    if (!canvas) return;
    
    // Save state before zoom
    saveOriginalState();
    
    const currentZoom = canvas.getZoom();
    const newZoom = Math.max(currentZoom / 1.2, 0.1); // Min 10%
    
    canvas.setZoom(newZoom);
    setZoomLevel(Math.round(newZoom * 100));
    canvas.renderAll();
  }, [canvas, saveOriginalState]);

  // Set specific zoom level
  const setZoom = useCallback((level) => {
    if (!canvas) return;
    
    // Save state before zoom
    saveOriginalState();
    
    const zoom = level / 100;
    canvas.setZoom(zoom);
    setZoomLevel(level);
    canvas.renderAll();
  }, [canvas, saveOriginalState]);

  // Start panning
  const startPan = useCallback(() => {
    if (!canvas) return;
    
    setIsPanning(true);
    canvas.defaultCursor = 'grab';
    canvas.hoverCursor = 'grab';
    canvas.selection = false;
    canvas.isDrawingMode = false;
    
    // Save state before starting pan
    saveOriginalState();
  }, [canvas, saveOriginalState]);

  // Stop panning
  const stopPan = useCallback(() => {
    if (!canvas) return;
    
    setIsPanning(false);
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    canvas.selection = true;
  }, [canvas]);

  // Mouse event handlers for panning
  const handleMouseDown = useCallback((e) => {
    if (!isPanning || !canvas) return;
    
    const pointer = canvas.getPointer(e.e);
    setPanStart(pointer);
    canvas.defaultCursor = 'grabbing';
  }, [isPanning, canvas]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning || !panStart || !canvas) return;
    
    const pointer = canvas.getPointer(e.e);
    const deltaX = pointer.x - panStart.x;
    const deltaY = pointer.y - panStart.y;
    
    const vpt = canvas.viewportTransform.slice();
    vpt[4] += deltaX;
    vpt[5] += deltaY;
    canvas.setViewportTransform(vpt);
    canvas.renderAll();
    
    setPanStart(pointer);
  }, [isPanning, panStart, canvas]);

  const handleMouseUp = useCallback(() => {
    if (!isPanning) return;
    
    setPanStart(null);
    canvas.defaultCursor = 'grab';
  }, [isPanning, canvas]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    if (!canvas) return;
    
    e.preventDefault();
    const delta = e.deltaY;
    const zoom = canvas.getZoom();
    const newZoom = Math.max(0.1, Math.min(5, zoom - delta * 0.001));
    
    // Save state before zoom
    saveOriginalState();
    
    canvas.setZoom(newZoom);
    setZoomLevel(Math.round(newZoom * 100));
    canvas.renderAll();
  }, [canvas, saveOriginalState]);

  // Undo zoom/pan
  const undoZoom = useCallback(() => {
    if (!canvas || !originalState) return;
    
    canvas.setZoom(originalState.zoom);
    canvas.setViewportTransform(originalState.viewportTransform);
    setZoomLevel(Math.round(originalState.zoom * 100));
    canvas.renderAll();
  }, [canvas, originalState]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    togglePanel: () => setShowPanel(prev => !prev),
    showPanel: () => setShowPanel(true),
    hidePanel: () => setShowPanel(false),
    zoomIn: zoomIn,
    zoomOut: zoomOut,
    resetZoom: resetZoom,
    setZoom: setZoom,
    startPan: startPan,
    stopPan: stopPan,
    undoZoom: undoZoom,
    canUndo: !!originalState
  }), [zoomIn, zoomOut, resetZoom, setZoom, startPan, stopPan, undoZoom, originalState]);

  // Setup mouse event listeners for panning
  useEffect(() => {
    if (!canvas || !isPanning) return;
    
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    
    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, isPanning, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Setup mouse wheel zoom
  useEffect(() => {
    if (!canvas) return;
    
    canvas.on('mouse:wheel', handleWheel);
    
    return () => {
      canvas.off('mouse:wheel', handleWheel);
    };
  }, [canvas, handleWheel]);

  // Setup double-click to fit to screen
  useEffect(() => {
    if (!canvas) return;
    
    const handleDoubleClick = () => {
      resetZoom();
    };
    
    canvas.on('mouse:dblclick', handleDoubleClick);
    
    return () => {
      canvas.off('mouse:dblclick', handleDoubleClick);
    };
  }, [canvas, resetZoom]);

  // Update zoom level when canvas zoom changes
  useEffect(() => {
    if (!canvas) return;
    
    const updateZoomLevel = () => {
      const currentZoom = canvas.getZoom();
      setZoomLevel(Math.round(currentZoom * 100));
    };
    
    canvas.on('mouse:wheel', updateZoomLevel);
    
    return () => {
      canvas.off('mouse:wheel', updateZoomLevel);
    };
  }, [canvas]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-72 sm:w-80 bg-background-white dark:bg-background-secondary rounded-2xl shadow-2xl border border-border p-4 sm:p-6"
    >
      {!showPanel && !isPanning ? (
        // Minimal view
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md">
                <ZoomIn size={16} className="sm:w-5 sm:h-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-text">Zoom Tool</span>
                <span className="text-xs bg-accent dark:bg-background-primary px-2 py-0.5 rounded-lg text-accent-dark font-semibold">
                  {zoomLevel}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setShowPanel(true)}
                className="p-1.5 sm:p-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary shadow-md hover:shadow-lg shadow-primary/30"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.93 }}
                title="Settings"
              >
                <Settings size={14} className="sm:w-4 sm:h-4" />
              </motion.button>
              <motion.button
                onClick={onClose}
                className="p-1.5 sm:p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-sm hover:shadow-md"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.93 }}
                title="Close Tool"
              >
                <X size={14} className="sm:w-4 sm:h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      ) : isPanning ? (
        // Pan mode active
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md">
                <Move size={20} />
              </div>
              <span className="text-base font-semibold text-text">Pan Mode</span>
            </div>
            <motion.button
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-sm hover:shadow-md"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.93 }}
              title="Close Tool"
            >
              <X size={14} className="sm:w-4 sm:h-4" />
            </motion.button>
          </div>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl border border-orange-500"
          >
            <div className="flex items-center gap-2">
              <Move size={18} className="animate-pulse" />
              <p className="text-sm font-semibold">
                Click and drag to pan...
              </p>
            </div>
          </motion.div>

          <div className="p-3 sm:p-4 bg-accent dark:bg-background-primary rounded-xl border border-border">
            <p className="text-xs sm:text-sm text-text leading-relaxed">
              <strong>Click and drag</strong> to pan around the canvas.<br/>
              <strong>Mouse wheel</strong> to zoom in/out.<br/>
              <strong>Double-click</strong> to fit to screen.
            </p>
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={zoomOut}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 shadow-sm hover:shadow-md text-xs font-medium"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              <ZoomOut size={12} />
              <span>Out</span>
            </motion.button>
            <motion.button
              onClick={zoomIn}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary shadow-sm hover:shadow-md text-xs font-medium"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              <ZoomIn size={12} />
              <span>In</span>
            </motion.button>
            <motion.button
              onClick={resetZoom}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md text-xs font-medium"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              <Maximize size={12} />
              <span>Fit</span>
            </motion.button>
          </div>
        </div>
      ) : (
        // Full settings panel
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-md">
                <ZoomIn size={20} />
              </div>
              <span className="text-base font-semibold text-text">Zoom & Pan Controls</span>
            </div>
            <motion.button
              onClick={() => setShowPanel(false)}
              className="p-1.5 sm:p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-sm hover:shadow-md"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.93 }}
              title="Collapse"
            >
              <X size={14} className="sm:w-4 sm:h-4" />
            </motion.button>
          </div>

          {/* Current zoom level */}
          <div className="bg-accent dark:bg-background-primary border border-border rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">Current Zoom</span>
              <span className="text-lg sm:text-xl font-bold text-primary">{zoomLevel}%</span>
            </div>
          </div>

          {/* Quick zoom buttons */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex gap-2">
              <motion.button
                onClick={zoomOut}
                className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 shadow-md hover:shadow-lg shadow-gray-500/30 text-sm font-medium"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <ZoomOut size={16} />
                <span>Zoom Out</span>
              </motion.button>
              <motion.button
                onClick={zoomIn}
                className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary shadow-md hover:shadow-lg shadow-primary/30 text-sm font-medium"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <ZoomIn size={16} />
                <span>Zoom In</span>
              </motion.button>
            </div>


            <motion.button
              onClick={resetZoom}
              className="w-full flex items-center justify-center gap-2 py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg shadow-green-500/30 text-sm font-medium"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Maximize size={16} />
              <span>Fit to Screen</span>
            </motion.button>

            <motion.button
              onClick={startPan}
              className="w-full flex items-center justify-center gap-2 py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg shadow-orange-500/30 text-sm font-medium"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Move size={16} />
              <span>Pan Mode</span>
            </motion.button>
          </div>

          {/* Zoom level presets */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text">Quick Zoom</label>
            <div className="grid grid-cols-5 gap-1">
              {zoomLevels.map(level => (
                <motion.button
                  key={level}
                  onClick={() => setZoom(level)}
                  className={`px-2 py-1.5 text-xs rounded-lg font-semibold shadow-sm ${
                    zoomLevel === level
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/30'
                      : 'bg-background-secondary dark:bg-background-primary text-text hover:bg-accent border border-border'
                  }`}
                  style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {level}%
                </motion.button>
              ))}
            </div>
          </div>

          {/* Undo button */}
          {originalState && (
            <motion.button
              onClick={undoZoom}
              className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 sm:px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg shadow-orange-500/30 text-sm font-medium"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw size={16} />
              <span>Undo Last Zoom</span>
            </motion.button>
          )}

          {/* Info */}
          <div className="p-4 bg-accent dark:bg-background-primary rounded-xl border border-border">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-text">
                <p className="font-semibold mb-1">Tips:</p>
                <ul className="space-y-1 leading-relaxed">
                  <li>• Use mouse wheel to zoom in/out</li>
                  <li>• Hold Space + drag to pan</li>
                  <li>• Double-click to fit to screen</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default ZoomTool;