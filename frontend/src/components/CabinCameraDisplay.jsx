import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  Camera,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const CabinCameraDisplay = ({ isActive = false, onToggle, cameraUrl }) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // شبیه‌سازی اتصال به دوربین
  useEffect(() => {
    if (isActive) {
      setIsLoading(true);
      setHasError(false);

      // شبیه‌سازی زمان بارگذاری
      const timer = setTimeout(() => {
        setIsLoading(false);
        // شبیه‌سازی خطای تصادفی
        if (Math.random() > 0.9) {
          setHasError(true);
        }
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setHasError(false);
      setIsLoading(false);
    }
  }, [isActive]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Refresh camera
  const handleRefresh = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="card p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('cabinCameraStatus')}
          </h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {isActive ? t('active') : t('inactive')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <>
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
                title={t('refresh') || 'Refresh'}
              >
                <RefreshCw className="w-4 h-4 text-text-muted" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
                title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-text-muted" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-text-muted" />
                )}
              </button>
            </>
          )}

          <button
            onClick={onToggle}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isActive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isActive ? (
              <>
                <VideoOff className="w-4 h-4" />
                <span>{t('turnOff') || 'Turn Off'}</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>{t('turnOn') || 'Turn On'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Camera Display */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-border"
      >
        {!isActive ? (
          // Camera Off State
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
            <VideoOff className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-sm">{t('cameraOff') || 'Camera is turned off'}</p>
            <p className="text-xs mt-1 opacity-70">
              {t('clickTurnOn') || 'Click "Turn On" to activate the camera'}
            </p>
          </div>
        ) : isLoading ? (
          // Loading State
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <RefreshCw className="w-12 h-12 mb-3 animate-spin" />
            <p className="text-sm">{t('connectingToCamera') || 'Connecting to camera...'}</p>
          </div>
        ) : hasError ? (
          // Error State
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400">
            <AlertCircle className="w-16 h-16 mb-3" />
            <p className="text-sm font-medium">{t('cameraError') || 'Camera Connection Error'}</p>
            <p className="text-xs mt-1 opacity-70">
              {t('checkCameraConnection') || 'Please check camera connection'}
            </p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              {t('retry') || 'Retry'}
            </button>
          </div>
        ) : (
          // Active Camera Display
          <>
            {/* شبیه‌سازی نمایش دوربین با یک grid pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
              {/* Grid overlay برای شبیه‌سازی دوربین */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-12 grid-rows-12 h-full">
                  {Array.from({ length: 144 }).map((_, i) => (
                    <div key={i} className="border border-white/20"></div>
                  ))}
                </div>
              </div>

              {/* Center crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-24 h-24 border-2 border-green-500/50 rounded-full"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-green-500/50"></div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-green-500/50"></div>
                </div>
              </div>

              {/* Simulated object in view */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-40 bg-gradient-to-b from-gray-400 to-gray-600 rounded-lg shadow-2xl opacity-60 transform rotate-12"></div>
              </div>
            </div>

            {/* Video element (برای اتصال واقعی به دوربین) */}
            {cameraUrl && (
              <video
                ref={videoRef}
                src={cameraUrl}
                autoPlay
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Camera Info Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between text-white text-xs">
              <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">REC</span>
                </div>
                <div className="opacity-70">
                  {new Date().toLocaleTimeString('en-GB')}
                </div>
              </div>

              <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            {/* Camera Settings Overlay (bottom) */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white text-xs">
              <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                <div className="opacity-70">ISO: 400 | F/2.8 | 1/60s</div>
              </div>

              <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                <div className="opacity-70">1920x1080 @ 30fps</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Camera Info */}
      {isActive && !hasError && !isLoading && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="panel p-3 rounded-lg">
            <div className="text-xs text-text-muted mb-1">{t('resolution') || 'Resolution'}</div>
            <div className="text-sm font-semibold text-text dark:text-text">1920x1080</div>
          </div>
          <div className="panel p-3 rounded-lg">
            <div className="text-xs text-text-muted mb-1">{t('frameRate') || 'Frame Rate'}</div>
            <div className="text-sm font-semibold text-text dark:text-text">30 fps</div>
          </div>
          <div className="panel p-3 rounded-lg">
            <div className="text-xs text-text-muted mb-1">{t('exposure') || 'Exposure'}</div>
            <div className="text-sm font-semibold text-text dark:text-text">1/60s</div>
          </div>
          <div className="panel p-3 rounded-lg">
            <div className="text-xs text-text-muted mb-1">{t('brightness') || 'Brightness'}</div>
            <div className="text-sm font-semibold text-text dark:text-text">75%</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CabinCameraDisplay;
