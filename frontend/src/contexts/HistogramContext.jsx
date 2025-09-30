import React, { createContext, useContext, useState, useCallback } from 'react';

const HistogramContext = createContext();

export const useHistogram = () => {
  const context = useContext(HistogramContext);
  if (!context) {
    throw new Error('useHistogram must be used within HistogramProvider');
  }
  return context;
};

export const HistogramProvider = ({ children }) => {
  const [histogramData, setHistogramData] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [currentChannel, setCurrentChannel] = useState('gray');

  const updateHistogram = useCallback((data, point) => {
    setHistogramData(data);
    setSelectedPoint(point);
  }, []);

  const clearHistogram = useCallback(() => {
    setHistogramData(null);
    setSelectedPoint(null);
  }, []);

  const changeChannel = useCallback((channel) => {
    setCurrentChannel(channel);
  }, []);

  return (
    <HistogramContext.Provider
      value={{
        histogramData,
        selectedPoint,
        currentChannel,
        updateHistogram,
        clearHistogram,
        changeChannel,
      }}
    >
      {children}
    </HistogramContext.Provider>
  );
};