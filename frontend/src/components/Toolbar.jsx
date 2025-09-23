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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolManager } from "./Tools";
import { BrushTool, LineTool, MoveTool, CropTool } from "./Tools";
import ZoomTool from "./Tools/ZoomTool.jsx";
import EraseToolComponent from "./Tools/EraseToolComponent";

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
    zoomImage,
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
      } else if (name === "zoom") {
        applyTool(name);
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
      zoomImage,
      undoLastChange,
      applyTool,
      selectedColor,
      brushSize,
      activeTool,
      showEraserPanel,
    ]
  );

  // Setup hotkeys for all tools
  tools.forEach((tool) => {
    useHotkeys(tool.hotkey, () => handleToolClick(tool.name), {
      preventDefault: true,
      description: `${t(tool.name)} (${tool.hotkey})`,
    });
  });

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
        "bg-background-secondary h-full flex flex-col border-r border-border rounded-l-xl shadow-card dark:bg-background-secondary dark:border-border relative",
        isExpanded ? "w-64" : "w-16",
        className
      )}
      animate={{ width: isExpanded ? 256 : 64 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <AnimatePresence>
          {isExpanded && (
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold text-text"
            >
              ابزارها
            </motion.h3>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg hover:bg-background-primary transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </motion.button>
      </div>

      {/* Tools */}
      <div className="flex-1 py-4 overflow-y-auto scrollbar-hide">
        <div
          className={`flex ${
            isExpanded
              ? "flex-col gap-2 px-3"
              : "flex-col items-center gap-4 px-2"
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
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-background-primary text-text hover:shadow-sm"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon size={20} />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{t(name)}</div>
                      <div className="text-xs opacity-60">{hotkey}</div>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="w-2 h-2 bg-current rounded-full"
                      />
                    )}
                  </motion.button>
                ) : (
                  <motion.div className="relative group">
                    <IconButton
                      Icon={Icon}
                      title={`${t(name)} (${hotkey})`}
                      onClick={() => handleToolClick(name)}
                      variant={isActive ? "primary" : "default"}
                      size="md"
                      className="hover:scale-105 relative"
                    />
                    {isActive && (
                      <motion.div
                        layoutId="compactActiveIndicator"
                        className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary rounded-full"
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
            className="border-t border-border p-3 space-y-3"
          >
            {/* Color Picker Button */}
            <motion.button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background-primary transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <Palette size={16} />
              <span className="text-sm">انتخاب رنگ</span>
              <div
                className="ml-auto w-4 h-4 rounded border-2 border-white shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
            </motion.button>

            {/* Settings Button */}
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background-primary transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <Settings size={16} />
              <span className="text-sm">تنظیمات</span>
            </motion.button>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <motion.button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Save size={14} />
                <span className="text-xs">ذخیره</span>
              </motion.button>

              <motion.button
                onClick={clearDrawings}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <X size={14} />
                <span className="text-xs">پاک</span>
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

            <button
              onClick={() => setShowColorPicker(false)}
              className="w-full py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              تأیید
            </button>
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

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              بستن
            </button>
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

      {/* Crop Tool - Visible when active */}
      {activeTool === "crop" && canvas && (
        <div className="absolute left-full top-0 ml-2 z-50">
          <CropTool canvas={canvas} isActive={activeTool === "crop"} />
        </div>
      )}

      {/* Zoom Tool - Visible when active */}
      {activeTool === "zoom" && canvas && (
        <div className="absolute left-full top-0 ml-2 z-50">
          <ZoomTool canvas={canvas} isActive={activeTool === "zoom"} />
        </div>
      )}
    </motion.div>
  );
};

export default Toolbar;
