import React, { useRef, useCallback, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { 
  ZoomIn, 
  ZoomOut,
  RotateCcw,
  Maximize,
  Minus,
  Plus,
  Move
} from 'lucide-react';

const ZoomTool = forwardRef(({ canvas, isActive }, ref) => {
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
    <div className="zoom-tool p-3 border-t border-gray-200 bg-white shadow-lg">
      {!showPanel && !isPanning ? (
        // Minimal view with zoom in/out buttons
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">🔍 Zoom Tool</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {zoomLevel}%
              </span>
            </div>
            <button
              onClick={() => setShowPanel(true)}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Settings
            </button>
          </div>
          
          {/* Quick zoom buttons */}
          <div className="flex gap-2">
            <button
              onClick={zoomOut}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              <ZoomOut size={16} />
              <span>Zoom Out</span>
            </button>
            <button
              onClick={zoomIn}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <ZoomIn size={16} />
              <span>Zoom In</span>
            </button>
          </div>
          
          {/* Reset zoom button */}
          <button
            onClick={resetZoom}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
          >
            <Maximize size={16} />
            <span>Fit to Screen</span>
          </button>
          
          {/* Pan mode button */}
          <button
            onClick={startPan}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <Move size={16} />
            <span>Pan Mode</span>
          </button>
        </div>
      ) : isPanning ? (
        // Pan mode active
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-orange-700">Pan Mode Active</span>
            </div>
            <button
              onClick={stopPan}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Exit Pan
            </button>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-700">
              <strong>Click and drag</strong> to pan around the canvas.<br/>
              <strong>Mouse wheel</strong> to zoom in/out.<br/>
              <strong>Double-click</strong> to fit to screen.
            </p>
          </div>
          
          {/* Quick actions in pan mode */}
          <div className="flex gap-2">
            <button
              onClick={zoomOut}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
            >
              <ZoomOut size={12} />
              <span>Zoom Out</span>
            </button>
            <button
              onClick={zoomIn}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              <ZoomIn size={12} />
              <span>Zoom In</span>
            </button>
            <button
              onClick={resetZoom}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              <Maximize size={12} />
              <span>Fit</span>
            </button>
          </div>
        </div>
      ) : (
        // Full settings panel
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <ZoomIn size={14} className="text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Zoom & Pan Controls</span>
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Current zoom level */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Current Zoom</span>
              <span className="text-lg font-bold text-blue-600">{zoomLevel}%</span>
            </div>
          </div>
          
          {/* Quick zoom buttons */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={zoomOut}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                <ZoomOut size={16} />
                <span>Zoom Out</span>
              </button>
              <button
                onClick={zoomIn}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <ZoomIn size={16} />
                <span>Zoom In</span>
              </button>
            </div>
            
            <button
              onClick={resetZoom}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Maximize size={16} />
              <span>Fit to Screen</span>
            </button>
            
            <button
              onClick={startPan}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Move size={16} />
              <span>Pan Mode</span>
            </button>
          </div>
          
          {/* Zoom level presets */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Quick Zoom</label>
            <div className="grid grid-cols-5 gap-1">
              {zoomLevels.map(level => (
                <button
                  key={level}
                  onClick={() => setZoom(level)}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    zoomLevel === level
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level}%
                </button>
              ))}
            </div>
          </div>
          
          {/* Undo button */}
          {originalState && (
            <button
              onClick={undoZoom}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <RotateCcw size={16} />
              <span>Undo Last Zoom</span>
            </button>
          )}
          
          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Tips:</p>
              <ul className="space-y-1">
                <li>• Use mouse wheel to zoom in/out</li>
                <li>• Hold Space + drag to pan</li>
                <li>• Double-click to fit to screen</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ZoomTool;