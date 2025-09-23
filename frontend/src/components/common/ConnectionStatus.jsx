import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../contexts/WebSocketContext';

const ConnectionStatus = ({ icon: Icon }) => {
  const { t, i18n } = useTranslation();
  const { isConnected } = useWebSocket();
  const textAlign = i18n.language === 'fa' ? 'text-right' : 'text-left';

  if (isConnected) {
    return (
      <div className="panel bg-background-white dark:bg-background-secondary border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 text-primary dark:text-primary">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className={`font-medium font-vazir ${textAlign}`}>
            {t('websocketConnected')}
          </span>
        </div>
      </div>
    );
  }
 
  return (
    <div className="panel variant-highlight border border-border rounded-lg p-4 mb-6 animate-pulse">
      <div className="flex items-center gap-3 text-white dark:text-white">
        <div className="relative">
          <Icon className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-highlight rounded-full animate-ping"></div>
        </div>
        <span className={`font-medium font-vazir ${textAlign}`}>
          {t('websocketConnecting')}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;