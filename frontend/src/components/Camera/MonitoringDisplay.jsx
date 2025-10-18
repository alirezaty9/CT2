// src/components/Camera/MonitoringDisplay.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useCamera } from '../../contexts/CameraContext';
import debugLogger from '../../utils/debugLogger';

const MonitoringDisplay = () => {
  // Log render
  debugLogger.logRender('MonitoringDisplay');

  const imgRef = useRef(null);
  const { cameras, wsStatus, addFrameCallback } = useCamera();

  // Direct DOM manipulation - no state updates!
  useEffect(() => {
    const updateFrame = (channel) => {
      if (channel === 'monitoring' && imgRef.current) {
        const frame = cameras.monitoring.currentFrame;
        if (frame) {
          imgRef.current.src = frame;
        }
      }
    };

    const unsubscribe = addFrameCallback(updateFrame);
    return () => unsubscribe();
  }, [cameras, addFrameCallback]);

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
      {/* 📹 Image element برای نمایش stream */}
      <img
        ref={imgRef}
        className="w-full h-full object-contain"  // ✅ تصویر رو به سایز container fit کن
        alt="Monitoring Camera"
        style={{ display: cameras.monitoring.currentFrame ? 'block' : 'none' }}
      />
      
      {/* 🔄 Enhanced loading state with better status messages */}
      {!cameras.monitoring.currentFrame && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-sm mb-2">
              {wsStatus === 'connecting' && '🔄 اتصال به دوربین RTSP...'}
              {wsStatus === 'connected' && '⏳ در انتظار تصویر RTSP...'}
              {wsStatus === 'reconnecting' && '🔄 تلاش برای اتصال مجدد...'}
              {wsStatus === 'error' && '❌ خطا در اتصال RTSP'}
              {wsStatus === 'failed' && '❌ اتصال RTSP ناموفق'}
              {wsStatus === 'disconnected' && '⚠️ قطع ارتباط با دوربین'}
            </div>
            {(wsStatus === 'error' || wsStatus === 'failed') && (
              <div className="text-gray-400 text-xs">
                بررسی تنظیمات RTSP یا بک‌اند
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 🏷️ برچسب نام دوربین */}
      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
        Monitoring Camera
      </div>
      
      {/* 🔴 نمایش وضعیت اتصال */}
      <div className={`absolute bottom-2 left-2 w-3 h-3 rounded-full ${
        cameras.monitoring.isConnected && cameras.monitoring.currentFrame ? 'bg-green-500' : 'bg-red-500'
      }`} />
      
      {/* 📊 نمایش اطلاعات عملکرد */}
      {cameras.monitoring.currentFrame && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs space-y-1">
          <div>RTSP Live</div>
          {cameras.monitoring.avgFps > 0 && (
            <div className="text-green-400">
              FPS: {cameras.monitoring.avgFps} | Frames: {cameras.monitoring.frameCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(MonitoringDisplay);