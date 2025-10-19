import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HexColorPicker } from "react-colorful";
import { useHotkeys } from "react-hotkeys-hook";
import { useForm, Controller } from "react-hook-form";
import IconButton from "./common/IconButton";
import { useCamera } from "../contexts/CameraContext";
import { twMerge } from "tailwind-merge";
import {
  Crop,
  Brush,
  Eraser,
  Circle,
  RectangleHorizontal,
  LineChart,
  Move,
  ZoomIn,
  ZoomOut,
  Palette,
  Hand,
  RotateCcw,
  Minus,
  Settings,
  ChevronRight,
  ChevronLeft,
  Save,
  Download,
  X,
  BarChart3,
  Activity,
  Crosshair,
  MapPin,
  Grid3x3,
  BarChart2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolManager } from "./Tools";
import { BrushTool, LineTool, MoveTool, CropTool } from "./Tools";
import ZoomTool from "./Tools/ZoomTool.jsx";
import EraseToolComponent from "./Tools/EraseToolComponent";
import HistogramTool from "./Tools/HistogramTool.jsx";
import IntensityProfileTool from "./Tools/IntensityProfileTool.jsx";
import CrosshairToolPanel from "./Tools/CrosshairToolPanel.jsx";
import PixelCoordinatePanel from "./Tools/PixelCoordinatePanel.jsx";
import GridPanel from "./Tools/GridPanel.jsx";
import ROIStatsPanel from "./Tools/ROIStatsPanel.jsx";

// CSS for hiding scrollbar
const scrollbarHideStyle = `
  .scrollbar-hide {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* Chrome, Safari, and Opera */
  }
`;

// Add the styles to head if not already added
if (
  typeof document !== "undefined" &&
  !document.getElementById("scrollbar-hide-styles")
) {
  const styleElement = document.createElement("style");
  styleElement.id = "scrollbar-hide-styles";
  styleElement.textContent = scrollbarHideStyle;
  document.head.appendChild(styleElement);
}

const tools = [
  { Icon: Crop, name: "crop", hotkey: "c", category: "edit" },
  { Icon: Brush, name: "brush", hotkey: "b", category: "draw" },
  { Icon: Eraser, name: "eraser", hotkey: "e", category: "draw" },
  { Icon: Circle, name: "circle", hotkey: "o", category: "shape" },
  {
    Icon: RectangleHorizontal,
    name: "rectangle",
    hotkey: "r",
    category: "shape",
  },
  { Icon: Minus, name: "line", hotkey: "l", category: "shape" },
  { Icon: LineChart, name: "lineChart", hotkey: "shift+l", category: "shape" },
  { Icon: Move, name: "move", hotkey: "v", category: "nav" },
  { Icon: ZoomIn, name: "zoom", hotkey: "z", category: "view" },
  { Icon: BarChart3, name: "histogram", hotkey: "h", category: "analyze" },
  { Icon: Activity, name: "intensity", hotkey: "i", category: "analyze" },
  { Icon: Crosshair, name: "crosshair", hotkey: "x", category: "analyze" },
  { Icon: MapPin, name: "pixelCoordinate", hotkey: "p", category: "analyze" },
  { Icon: BarChart2, name: "roiStats", hotkey: "s", category: "analyze" },
  { Icon: Grid3x3, name: "grid", hotkey: "shift+g", category: "view" },
  { Icon: Palette, name: "grayscale", hotkey: "g", category: "filter" },
  { Icon: Hand, name: "pan", hotkey: "space", category: "nav" },
  { Icon: RotateCcw, name: "undo", hotkey: "ctrl+z", category: "edit" },
];

const Toolbar = ({ className = "" }) => {
  const { t } = useTranslation();
  const {
    activeTool,
    applyTool,
    toggleGrayscale,
    undoLastChange,
    clearDrawings,
    imageSettings,
    updateImageSettings,
  } = useCamera();

  // States for enhanced features
  const [isExpanded, setIsExpanded] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEraserPanel, setShowEraserPanel] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#ff0000");
  const [brushSize, setBrushSize] = useState(5);
  const [eraserSize, setEraserSize] = useState(15);
  const [canvas, setCanvas] = useState(null);

  // Form for settings
  const { control, watch } = useForm({
    defaultValues: {
      brightness: imageSettings.brightness || 100,
      contrast: imageSettings.contrast || 100,
      saturation: imageSettings.saturation || 100,
    },
  });

  const watchedValues = watch();

  // Define callback functions first
  const handleSave = useCallback(() => {
    if (window.fabricCanvas) {
      const dataURL = window.fabricCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `artwork-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    }
  }, []);

  const handleColorChange = useCallback((color) => {
    setSelectedColor(color);
    if (window.fabricCanvas && window.fabricCanvas.freeDrawingBrush) {
      window.fabricCanvas.freeDrawingBrush.color = color;
    }
  }, []);

  const handleBrushSizeChange = useCallback((size) => {
    setBrushSize(size);
    if (window.fabricCanvas && window.fabricCanvas.freeDrawingBrush) {
      window.fabricCanvas.freeDrawingBrush.width = size;
    }
  }, []);

  const handleToolClick = useCallback(
    (name) => {
      console.log(`🎨 Tool selected: ${name}`);

      if (name === "grayscale") {
        toggleGrayscale();
      } else if (name === "undo") {
        undoLastChange();
      } else if (name === "eraser") {
        // Toggle eraser panel visibility
        if (activeTool === "eraser" && showEraserPanel) {
          // If eraser is active and panel is open, just close panel (keep eraser active)
          setShowEraserPanel(false);
        } else if (activeTool === "eraser" && !showEraserPanel) {
          // If eraser is active but panel is closed, open panel
          setShowEraserPanel(true);
        } else {
          // If eraser is not active, activate it and open panel
          applyTool(name);
          setShowEraserPanel(true);
        }
      } else {
        applyTool(name);
        // Close eraser panel when other tools are selected
        setShowEraserPanel(false);
      }

      // Update Fabric.js settings
      if (window.fabricCanvas) {
        const canvas = window.fabricCanvas;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = selectedColor;
          canvas.freeDrawingBrush.width = brushSize;
        }
      }
    },
    [
      toggleGrayscale,
      undoLastChange,
      applyTool,
      selectedColor,
      brushSize,
      activeTool,
      showEraserPanel,
    ]
  );

  // Setup hotkeys for all tools - using individual hooks (not in a loop)
  useHotkeys("c", () => handleToolClick("crop"), { preventDefault: true });
  useHotkeys("b", () => handleToolClick("brush"), { preventDefault: true });
  useHotkeys("e", () => handleToolClick("eraser"), { preventDefault: true });
  useHotkeys("o", () => handleToolClick("circle"), { preventDefault: true });
  useHotkeys("r", () => handleToolClick("rectangle"), { preventDefault: true });
  useHotkeys("l", () => handleToolClick("line"), { preventDefault: true });
  useHotkeys("shift+l", () => handleToolClick("lineChart"), { preventDefault: true });
  useHotkeys("v", () => handleToolClick("move"), { preventDefault: true });
  useHotkeys("z", () => handleToolClick("zoom"), { preventDefault: true });
  useHotkeys("h", () => handleToolClick("histogram"), { preventDefault: true });
  useHotkeys("i", () => handleToolClick("intensity"), { preventDefault: true });
  useHotkeys("x", () => handleToolClick("crosshair"), { preventDefault: true });
  useHotkeys("p", () => handleToolClick("pixelCoordinate"), { preventDefault: true });
  useHotkeys("s", () => handleToolClick("roiStats"), { preventDefault: true });
  useHotkeys("shift+g", () => handleToolClick("grid"), { preventDefault: true });
  useHotkeys("g", () => handleToolClick("grayscale"), { preventDefault: true });
  useHotkeys("space", () => handleToolClick("pan"), { preventDefault: true });
  useHotkeys("ctrl+z", () => handleToolClick("undo"), { preventDefault: true });

  // Additional hotkeys
  useHotkeys("ctrl+s", handleSave, { preventDefault: true });
  useHotkeys("ctrl+shift+c", clearDrawings, { preventDefault: true });
  useHotkeys("tab", () => setIsExpanded(!isExpanded), { preventDefault: true });

  // Update image settings when form changes
  useEffect(() => {
    updateImageSettings(watchedValues);
  }, [
    watchedValues.brightness,
    watchedValues.contrast,
    watchedValues.saturation,
    watchedValues.grayscale,
    updateImageSettings,
  ]);

  // Get canvas reference
  useEffect(() => {
    const getCanvas = () => {
      if (window.fabricCanvas) {
        setCanvas(window.fabricCanvas);
      } else {
        // Try again after a short delay
        setTimeout(getCanvas, 100);
      }
    };
    getCanvas();
  }, []);

  return (
    <motion.div
      className={twMerge(
        "bg-background-secondary h-full flex flex-col border-r border-border shadow-card dark:bg-background-secondary dark:border-border relative",
        isExpanded ? "w-48 sm:w-64" : "w-12 sm:w-16",
        className
      )}
      animate={{ width: isExpanded ? (window.innerWidth < 640 ? 192 : 256) : (window.innerWidth < 640 ? 48 : 64) }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b border-border">
        <AnimatePresence>
          {isExpanded && (
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs sm:text-sm font-semibold text-text"
            >
              <span className="hidden sm:inline">ابزارها</span>
              <span className="sm:hidden">Tools</span>
            </motion.h3>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 sm:p-2 rounded-xl bg-background-primary hover:bg-accent border border-border hover:border-primary shadow-sm hover:shadow-md"
          style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
        >
          {isExpanded ? <ChevronLeft size={14} className="text-primary sm:w-4 sm:h-4" /> : <ChevronRight size={14} className="text-primary sm:w-4 sm:h-4" />}
        </motion.button>
      </div>

      {/* Tools */}
      <div className="flex-1 py-2 sm:py-4 overflow-y-auto scrollbar-hide">
        <div
          className={`flex ${
            isExpanded
              ? "flex-col gap-1 sm:gap-2 px-2 sm:px-3"
              : "flex-col items-center gap-2 sm:gap-4 px-1 sm:px-2"
          }`}
        >
          {tools.map(({ Icon, name, hotkey, category }, index) => {
            const isActive = activeTool === name;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {isExpanded ? (
                  <motion.button
                    onClick={() => handleToolClick(name)}
                    className={twMerge(
                      "w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl group font-medium shadow-sm hover:shadow-md",
                      isActive
                        ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30"
                        : "bg-background-primary hover:bg-accent text-text hover:text-primary border border-border hover:border-primary"
                    )}
                    style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Icon size={16} className={twMerge(isActive ? "drop-shadow-md" : "", "sm:w-5 sm:h-5")} />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs sm:text-sm font-semibold truncate">{t(name)}</div>
                      <div className={twMerge(
                        "text-xs font-mono",
                        isActive ? "opacity-80" : "opacity-50"
                      )}>{hotkey}</div>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full shadow-md flex-shrink-0"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                ) : (
                  <motion.div className="relative group">
                    <motion.button
                      onClick={() => handleToolClick(name)}
                      className={twMerge(
                        "p-1.5 sm:p-2.5 rounded-xl shadow-sm hover:shadow-md",
                        isActive
                          ? "bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30"
                          : "bg-background-primary hover:bg-accent text-text-muted hover:text-primary border border-border hover:border-primary"
                      )}
                      style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      whileHover={{ scale: 1.12, y: -2 }}
                      whileTap={{ scale: 0.93 }}
                      title={`${t(name)} (${hotkey})`}
                    >
                      <Icon size={16} className={twMerge(isActive ? "drop-shadow-md" : "", "sm:w-5 sm:h-5")} />
                    </motion.button>
                    {isActive && (
                      <motion.div
                        layoutId="compactActiveIndicator"
                        className="absolute -right-0.5 sm:-right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 sm:h-8 bg-gradient-to-b from-primary to-primary-dark rounded-full shadow-md"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                      />
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Extended Controls */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border p-2 sm:p-3 space-y-2 sm:space-y-3"
          >
            {/* Color Picker Button */}
            <motion.button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-background-primary hover:bg-accent border border-border hover:border-primary shadow-sm hover:shadow-md"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Palette size={16} className="text-primary sm:w-4 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">انتخاب رنگ</span>
              <div
                className="ml-auto w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2 border-white shadow-md ring-2 ring-border flex-shrink-0"
                style={{ backgroundColor: selectedColor }}
              />
            </motion.button>

            {/* Settings Button */}
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-background-primary hover:bg-accent border border-border hover:border-primary shadow-sm hover:shadow-md"
              style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Settings size={16} className="text-primary sm:w-4 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">تنظیمات</span>
            </motion.button>

            {/* Quick Actions */}
            <div className="flex gap-1 sm:gap-2">
              <motion.button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg shadow-green-500/30 font-medium"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.94 }}
              >
                <Save size={14} className="sm:w-4 sm:h-4" />
                <span className="text-xs font-semibold">ذخیره</span>
              </motion.button>

              <motion.button
                onClick={clearDrawings}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg shadow-red-500/30 font-medium"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.94 }}
              >
                <X size={14} className="sm:w-4 sm:h-4" />
                <span className="text-xs font-semibold">پاک</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Picker Popover */}
      <AnimatePresence>
        {showColorPicker && isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -10 }}
            className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-white border border-border rounded-lg shadow-lg p-4 z-50"
          >
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2">انتخاب رنگ</h4>
              <HexColorPicker
                color={selectedColor}
                onChange={handleColorChange}
              />
            </div>

            <div className="mb-3">
              <label className="text-sm font-medium block mb-1">
                اندازه قلم: {brushSize}px
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) =>
                  handleBrushSizeChange(parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            <div className="mb-3">
              <label className="text-sm font-medium block mb-1">
                اندازه پاک‌کن: {eraserSize}px
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={eraserSize}
                onChange={(e) => setEraserSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <motion.button
              onClick={() => setShowColorPicker(false)}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg shadow-primary/30 font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              تأیید
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -10 }}
            className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-white border border-border rounded-lg shadow-lg p-4 z-50 w-64"
          >
            <h4 className="text-sm font-medium mb-3">تنظیمات تصویر</h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  روشنایی: {Math.round(watchedValues.brightness)}%
                </label>
                <Controller
                  name="brightness"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="range"
                      min="0"
                      max="200"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  کنتراست: {Math.round(watchedValues.contrast)}%
                </label>
                <Controller
                  name="contrast"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="range"
                      min="0"
                      max="200"
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  اشباع: {Math.round(watchedValues.saturation)}%
                </label>
                <Controller
                  name="saturation"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="range"
                      min="0"
                      max="200"
                      className="w-full"
                    />
                  )}
                />
              </div>
            </div>

            <motion.button
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:from-primary-dark hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg shadow-primary/30 font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              بستن
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Eraser Tool Component */}
      <AnimatePresence>
        {activeTool === "eraser" && canvas && showEraserPanel && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-full top-0 ml-2 z-50"
          >
            <EraseToolComponent
              canvas={canvas}
              isActive={true}
              initialSettings={{ size: eraserSize }}
              onSettingsChange={(settings) => {
                setEraserSize(settings.size);
              }}
              onClose={() => {
                setShowEraserPanel(false);
                // Don't deactivate eraser tool, just close panel
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Eraser Tool Component - Always Active When Eraser is Selected */}
      {activeTool === "eraser" && canvas && !showEraserPanel && (
        <div style={{ display: "none" }}>
          <EraseToolComponent
            canvas={canvas}
            isActive={true}
            initialSettings={{ size: eraserSize }}
            onSettingsChange={(settings) => {
              setEraserSize(settings.size);
            }}
            onClose={() => {
              // This won't be called since it's hidden
            }}
          />
        </div>
      )}

      {/* Tool Components - Hidden but functional */}
      {canvas && (
        <div style={{ display: "none" }}>
          {activeTool === "brush" && (
            <BrushTool
              canvas={canvas}
              isActive={activeTool === "brush"}
              brushColor={selectedColor}
              brushWidth={brushSize}
            />
          )}
          {activeTool === "line" && (
            <LineTool
              canvas={canvas}
              isActive={activeTool === "line"}
              lineColor={selectedColor}
              lineWidth={brushSize}
            />
          )}
          {activeTool === "move" && (
            <MoveTool canvas={canvas} isActive={activeTool === "move"} />
          )}
        </div>
      )}

      {/* Crop Tool - Always mounted but conditionally visible */}
      {canvas && (
        <div className={`absolute left-full top-0 ml-2 z-50 ${activeTool === "crop" ? "" : "hidden"}`}>
          <CropTool canvas={canvas} isActive={activeTool === "crop"} onClose={() => applyTool(null)} />
        </div>
      )}

      {/* Zoom Tool - Visible when active */}
      {activeTool === "zoom" && canvas && (
        <div className="absolute left-full top-0 ml-2 z-50">
          <ZoomTool canvas={canvas} isActive={activeTool === "zoom"} onClose={() => applyTool(null)} />
        </div>
      )}

      {/* Histogram Tool - Always mounted but conditionally visible */}
      {canvas && (
        <div className={`absolute left-full top-0 ml-2 z-50 ${activeTool === "histogram" ? "" : "hidden"}`}>
          <HistogramTool canvas={canvas} isActive={activeTool === "histogram"} onClose={() => applyTool(null)} />
        </div>
      )}

      {/* Intensity Profile Tool - Always mounted but conditionally visible */}
      {canvas && (
        <div className={`absolute left-full top-0 ml-2 z-50 ${activeTool === "intensity" ? "" : "hidden"}`}>
          <IntensityProfileTool canvas={canvas} isActive={activeTool === "intensity"} onClose={() => applyTool(null)} />
        </div>
      )}

      {/* Crosshair Tool - Requirement #22 */}
      {canvas && (
        <div className={`absolute left-full top-0 ml-2 z-50 ${activeTool === "crosshair" ? "" : "hidden"}`}>
          <CrosshairToolPanel canvas={canvas} isActive={activeTool === "crosshair"} onClose={() => applyTool(null)} />
        </div>
      )}

      {/* Pixel Coordinate Tool - Requirement #23 */}
      {canvas && (
        <div className={`absolute left-full top-0 ml-2 z-50 ${activeTool === "pixelCoordinate" ? "" : "hidden"}`}>
          <PixelCoordinatePanel canvas={canvas} isActive={activeTool === "pixelCoordinate"} onClose={() => applyTool(null)} />
        </div>
      )}

      {/* Grid Tool - Requirement #25 */}
      {canvas && (
        <div className={`absolute left-full top-0 ml-2 z-50 ${activeTool === "grid" ? "" : "hidden"}`}>
          <GridPanel canvas={canvas} isActive={activeTool === "grid"} onClose={() => applyTool(null)} />
        </div>
      )}

      {/* ROI Statistics Panel - Requirements #28-31 */}
      {canvas && (
        <div className={`absolute left-full top-0 ml-2 z-50 ${activeTool === "roiStats" ? "" : "hidden"}`}>
          <ROIStatsPanel canvas={canvas} isActive={activeTool === "roiStats"} onClose={() => applyTool(null)} />
        </div>
      )}
    </motion.div>
  );
};

export default Toolbar;
