import React from 'react';
import { Wifi, WifiOff, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Enhanced connection status component with better visual feedback
 */
const EnhancedConnectionStatus = ({ 
  status, 
  lastUpdate, 
  fps = 0, 
  frameCount = 0,
  channelName = 'Camera',
  className = '' 
}) => {
  
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          text: 'متصل',
          pulse: false
        };
      case 'connecting':
        return {
          icon: RotateCcw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          text: 'در حال اتصال...',
          pulse: true
        };
      case 'reconnecting':
        return {
          icon: RotateCcw,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          text: 'اتصال مجدد...',
          pulse: true
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          text: 'خطا در اتصال',
          pulse: false
        };
      case 'failed':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          text: 'اتصال ناموفق',
          pulse: false
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          text: 'قطع شده',
          pulse: false
        };
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString('fa-IR');
    } catch {
      return '';
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgColor} ${className}`}>
      <div className="flex items-center gap-2">
        <IconComponent 
          size={16} 
          className={`${config.color} ${config.pulse ? 'animate-spin' : ''}`}
        />
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${config.color}`}>
            {channelName}
          </span>
          <span className="text-xs text-gray-600">
            {config.text}
          </span>
        </div>
      </div>
      
      {status === 'connected' && lastUpdate && (
        <div className="flex flex-col items-end text-xs text-gray-500">
          <span>{formatLastUpdate(lastUpdate)}</span>
          {fps > 0 && (
            <span className="text-green-600 font-mono">
              {fps} FPS
            </span>
          )}
          {frameCount > 0 && (
            <span className="text-gray-400 font-mono">
              {frameCount} frames
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedConnectionStatus;
