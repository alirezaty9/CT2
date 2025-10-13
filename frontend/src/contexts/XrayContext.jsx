import React, { createContext, useContext, useState, useCallback } from 'react';

const XrayContext = createContext();

export const useXray = () => {
  const context = useContext(XrayContext);
  if (!context) {
    throw new Error('useXray must be used within XrayProvider');
  }
  return context;
};

export const XrayProvider = ({ children }) => {
  const [isXrayOn, setIsXrayOn] = useState(false);

  const turnOnXray = useCallback(() => {
    setIsXrayOn(true);
    console.log('X-ray Generator: ON');
  }, []);

  const turnOffXray = useCallback(() => {
    setIsXrayOn(false);
    console.log('X-ray Generator: OFF');
  }, []);

  const toggleXray = useCallback(() => {
    setIsXrayOn(prev => !prev);
  }, []);

  const value = {
    isXrayOn,
    turnOnXray,
    turnOffXray,
    toggleXray,
  };

  return <XrayContext.Provider value={value}>{children}</XrayContext.Provider>;
};
