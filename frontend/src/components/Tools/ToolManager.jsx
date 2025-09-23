import React, { useRef } from 'react';
import BrushTool from './BrushTool.jsx';
import EraserTool from './EraserTool.jsx';
import LineTool from './LineTool.jsx';
import MoveTool from './MoveTool.jsx';
import CropTool from './CropTool.jsx';
import ZoomTool from './ZoomTool.jsx';

const ToolManager = ({ 
  canvas, 
  activeTool, 
  onToolChange,
  toolSettings = {} 
}) => {
  const eraserToolRef = useRef(null);
  const cropToolRef = useRef(null);
  const renderTool = () => {
    switch (activeTool) {
      case 'brush':
        return (
          <BrushTool
            canvas={canvas}
            isActive={true}
            brushColor={toolSettings.brushColor || '#ff0000'}
            brushWidth={toolSettings.brushWidth || 5}
          />
        );
      
      case 'eraser':
        return (
          <EraserTool
            ref={eraserToolRef}
            canvas={canvas}
            isActive={true}
          />
        );
        
      case 'crop':
        return (
          <CropTool
            ref={cropToolRef}
            canvas={canvas}
            isActive={true}
          />
        );
      
      case 'line':
        return (
          <LineTool
            canvas={canvas}
            isActive={true}
            lineColor={toolSettings.lineColor || '#ff0000'}
            lineWidth={toolSettings.lineWidth || 2}
          />
        );
      
      case 'move':
        return (
          <MoveTool
            canvas={canvas}
            isActive={true}
          />
        );
      
      case 'zoom':
        return (
          <ZoomTool
            canvas={canvas}
            isActive={true}
          />
        );
      
      default:
        return (
          <div className="text-sm text-gray-500">
            Select a tool to start drawing
          </div>
        );
    }
  };

  return (
    <div className="tool-manager bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="text-lg font-semibold mb-4">Drawing Tools</h3>
      
      {/* Tool Selection */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => {
              if (activeTool === 'crop' && cropToolRef.current) {
                // If crop is already active, toggle its panel
                cropToolRef.current.togglePanel();
              } else {
                // If crop is not active, activate it
                onToolChange('crop');
              }
            }}
            onDoubleClick={() => {
              if (activeTool === 'crop' && cropToolRef.current) {
                cropToolRef.current.togglePanel();
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (activeTool === 'crop' && cropToolRef.current) {
                cropToolRef.current.togglePanel();
              }
            }}
            className={`px-3 py-2 rounded text-sm ${
              activeTool === 'crop' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={activeTool === 'crop' ? 'Click to toggle settings | Double-click/Right-click for menu' : 'Click to activate crop'}
          >
            🔲 Crop
          </button>
          <button
            onClick={() => onToolChange('brush')}
            className={`px-3 py-2 rounded text-sm ${
              activeTool === 'brush' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🖌️ Brush
          </button>
          <button
            onClick={() => {
              if (activeTool === 'eraser' && eraserToolRef.current) {
                // If eraser is already active, toggle its panel
                eraserToolRef.current.togglePanel();
              } else {
                // If eraser is not active, activate it
                onToolChange('eraser');
              }
            }}
            onDoubleClick={() => {
              if (activeTool === 'eraser' && eraserToolRef.current) {
                eraserToolRef.current.togglePanel();
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (activeTool === 'eraser' && eraserToolRef.current) {
                eraserToolRef.current.togglePanel();
              }
            }}
            className={`px-3 py-2 rounded text-sm ${
              activeTool === 'eraser' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={activeTool === 'eraser' ? 'Click to toggle settings | Double-click/Right-click for menu' : 'Click to activate eraser'}
          >
            🧹 Eraser
          </button>
          <button
            onClick={() => onToolChange('line')}
            className={`px-3 py-2 rounded text-sm ${
              activeTool === 'line' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📏 Line
          </button>
          <button
            onClick={() => onToolChange('move')}
            className={`px-3 py-2 rounded text-sm ${
              activeTool === 'move' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🖱️ Move
          </button>
          <button
            onClick={() => onToolChange('zoom')}
            className={`px-3 py-2 rounded text-sm ${
              activeTool === 'zoom' 
                ? 'bg-teal-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔍 Zoom
          </button>
        </div>
      </div>
      
      {/* Tool Settings */}
      <div className="tool-settings">
        {renderTool()}
      </div>
      
      {/* Canvas Actions */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (canvas) {
                const objects = canvas.getObjects();
                objects.forEach(obj => {
                  if (obj !== canvas.backgroundImage) {
                    canvas.remove(obj);
                  }
                });
                canvas.renderAll();
                console.log('🧹 Canvas cleared');
              }
            }}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear Canvas
          </button>
          <button
            onClick={() => {
              if (canvas) {
                const objects = canvas.getObjects();
                const lastObject = objects[objects.length - 1];
                if (lastObject && lastObject !== canvas.backgroundImage) {
                  canvas.remove(lastObject);
                  canvas.renderAll();
                  console.log('↩️ Undid last action');
                }
              }
            }}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
          >
            Undo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolManager;
