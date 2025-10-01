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
  const [selectionRegion, setSelectionRegion] = useState(null);

  const updateHistogram = useCallback((data, point, region = null) => {
    setHistogramData(data);
    setSelectedPoint(point);
    setSelectionRegion(region);
  }, []);

  const clearHistogram = useCallback(() => {
    setHistogramData(null);
    setSelectedPoint(null);
    setSelectionRegion(null);
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
        selectionRegion,
        updateHistogram,
        clearHistogram,
        changeChannel,
      }}
    >
      {children}
    </HistogramContext.Provider>
  );
};