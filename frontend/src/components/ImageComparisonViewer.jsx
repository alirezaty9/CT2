import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useImageProcessing } from '../contexts/ImageProcessingContext';
import { RotateCcw, Download, Maximize2, Minimize2, SplitSquareVertical, Image as ImageIcon } from 'lucide-react';

const ImageComparisonViewer = () => {
  const { t } = useTranslation();
  const {
    originalImage,
    processedImage,
    isProcessing,
    imageStats,
    processingHistory,
    resetToOriginal,
    saveImage,
    loadImageFromFile
  } = useImageProcessing();

  const [viewMode, setViewMode] = useState('side-by-side'); // side-by-side, slider, processed-only
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handler for file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      loadImageFromFile(file);
    }
  };

  // Handler for slider
  const handleSliderMove = (e) => {
    if (viewMode !== 'slider') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div className={`card p-4 lg:p-6 space-y-4 ${isFullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('imageViewer') || 'Image Viewer'}
          </h3>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {/* View Mode Buttons */}
          <div className="flex gap-1 bg-background-secondary dark:bg-accent rounded-lg p-1">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Side by Side"
            >
              <SplitSquareVertical className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === 'slider'
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Slider"
            >
              Slider
            </button>
            <button
              onClick={() => setViewMode('processed-only')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === 'processed-only'
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Processed Only"
            >
              Single
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={resetToOriginal}
            disabled={!originalImage || processingHistory.length === 0}
            className="px-3 py-1.5 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-gray-400 transition-colors text-sm flex items-center gap-2"
            title={t('reset') || 'Reset'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => saveImage('processed_image.png')}
            disabled={!processedImage}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm flex items-center gap-2"
            title={t('download') || 'Download'}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Image Display Area */}
      {!originalImage ? (
        <div className="panel p-12 rounded-lg text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-30" />
          <p className="text-text-muted mb-4">
            {t('noImageLoaded') || 'No image loaded. Upload an image or receive one from the backend.'}
          </p>
          <label className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span>{t('uploadImage') || 'Upload Image'}</span>
          </label>
        </div>
      ) : (
        <>
          {/* Side by Side View */}
          {viewMode === 'side-by-side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-text-muted text-center">
                  {t('original') || 'Original'}
                </div>
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-text-muted text-center">
                  {t('processed') || 'Processed'}
                </div>
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                  <img
                    src={processedImage}
                    alt="Processed"
                    className="w-full h-full object-contain"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Slider View */}
          {viewMode === 'slider' && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-text-muted text-center">
                {t('compareImages') || 'Compare Images (Drag Slider)'}
              </div>
              <div
                className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-ew-resize"
                onMouseMove={handleSliderMove}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = touch.clientX - rect.left;
                  const percentage = (x / rect.width) * 100;
                  setSliderPosition(Math.max(0, Math.min(100, percentage)));
                }}
              >
                {/* Processed Image (Background) */}
                <img
                  src={processedImage}
                  alt="Processed"
                  className="absolute inset-0 w-full h-full object-contain"
                />

                {/* Original Image (Clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={originalImage}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ width: `${10000 / sliderPosition}%` }}
                  />
                </div>

                {/* Slider Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-primary cursor-ew-resize"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                  </div>
                </div>

                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processed Only View */}
          {viewMode === 'processed-only' && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-text-muted text-center">
                {t('processed') || 'Processed Image'}
              </div>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-full object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Stats */}
          {imageStats && (
            <div className="panel p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
                {t('imageStatistics') || 'Image Statistics'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <div className="text-text-muted mb-1">{t('width') || 'Width'}</div>
                  <div className="font-semibold text-text">{imageStats.width}px</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">{t('height') || 'Height'}</div>
                  <div className="font-semibold text-text">{imageStats.height}px</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Mean</div>
                  <div className="font-semibold text-text">{imageStats.mean?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Median</div>
                  <div className="font-semibold text-text">{imageStats.median?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Std Dev</div>
                  <div className="font-semibold text-text">{imageStats.std?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-text-muted mb-1">Range</div>
                  <div className="font-semibold text-text">{imageStats.min?.toFixed(0)}-{imageStats.max?.toFixed(0)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Processing History */}
          {processingHistory.length > 0 && (
            <div className="panel p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
                {t('processingHistory') || 'Processing History'}
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {processingHistory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-background-secondary dark:bg-accent rounded">
                    <span className="font-semibold text-text">{item.filter}</span>
                    <span className="text-text-muted">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageComparisonViewer;
