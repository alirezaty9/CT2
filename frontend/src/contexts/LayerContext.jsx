import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const LayerContext = createContext();

export const useLayer = () => {
  const context = useContext(LayerContext);
  if (!context) {
    throw new Error('useLayer must be used within LayerProvider');
  }
  return context;
};

export const LayerProvider = ({ children }) => {
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const layerIdCounter = useRef(0);

  // Create a new layer
  const createLayer = useCallback((name, type = 'default', options = {}) => {
    const newLayer = {
      id: `layer-${layerIdCounter.current++}`,
      name,
      type, // 'background', 'brush', 'histogram', 'crop', 'line', 'text', etc.
      visible: true,
      opacity: options.opacity !== undefined ? options.opacity : 100,
      locked: false,
      objects: [], // Fabric objects belonging to this layer
      metadata: options.metadata || {},
      createdAt: new Date().toISOString(),
      zIndex: layers.length
    };

    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);

    return newLayer;
  }, [layers.length]);

  // Delete a layer
  const deleteLayer = useCallback((layerId) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (activeLayerId === layerId) {
      setActiveLayerId(prev => {
        const remaining = layers.filter(l => l.id !== layerId);
        return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      });
    }
  }, [activeLayerId, layers]);

  // Update layer properties
  const updateLayer = useCallback((layerId, updates) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
  }, []);

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((layerId) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);

  // Set layer opacity
  const setLayerOpacity = useCallback((layerId, opacity) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, opacity: Math.max(0, Math.min(100, opacity)) } : layer
    ));
  }, []);

  // Lock/unlock layer
  const toggleLayerLock = useCallback((layerId) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    ));
  }, []);

  // Reorder layers (for z-index management)
  const reorderLayers = useCallback((sourceIndex, destinationIndex) => {
    setLayers(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);

      // Update z-indices
      return result.map((layer, index) => ({ ...layer, zIndex: index }));
    });
  }, []);

  // Move layer up
  const moveLayerUp = useCallback((layerId) => {
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === layerId);
      if (index < prev.length - 1) {
        const result = Array.from(prev);
        [result[index], result[index + 1]] = [result[index + 1], result[index]];
        return result.map((layer, idx) => ({ ...layer, zIndex: idx }));
      }
      return prev;
    });
  }, []);

  // Move layer down
  const moveLayerDown = useCallback((layerId) => {
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === layerId);
      if (index > 0) {
        const result = Array.from(prev);
        [result[index], result[index - 1]] = [result[index - 1], result[index]];
        return result.map((layer, idx) => ({ ...layer, zIndex: idx }));
      }
      return prev;
    });
  }, []);

  // Add fabric object to layer
  const addObjectToLayer = useCallback((layerId, fabricObject) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId
        ? { ...layer, objects: [...layer.objects, fabricObject] }
        : layer
    ));

    // Tag the fabric object with layer info
    if (fabricObject) {
      fabricObject.layerId = layerId;
    }
  }, []);

  // Remove fabric object from layer
  const removeObjectFromLayer = useCallback((layerId, fabricObject) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId
        ? { ...layer, objects: layer.objects.filter(obj => obj !== fabricObject) }
        : layer
    ));
  }, []);

  // Get layer by ID
  const getLayerById = useCallback((layerId) => {
    return layers.find(layer => layer.id === layerId);
  }, [layers]);

  // Get active layer
  const getActiveLayer = useCallback(() => {
    return layers.find(layer => layer.id === activeLayerId);
  }, [layers, activeLayerId]);

  // Duplicate layer
  const duplicateLayer = useCallback((layerId) => {
    const layer = getLayerById(layerId);
    if (layer) {
      const duplicatedLayer = createLayer(
        `${layer.name} Copy`,
        layer.type,
        {
          opacity: layer.opacity,
          metadata: { ...layer.metadata }
        }
      );
      return duplicatedLayer;
    }
  }, [getLayerById, createLayer]);

  // Clear all layers
  const clearLayers = useCallback(() => {
    setLayers([]);
    setActiveLayerId(null);
  }, []);

  // Merge layers
  const mergeLayers = useCallback((layerIds) => {
    const layersToMerge = layers.filter(l => layerIds.includes(l.id));
    if (layersToMerge.length < 2) return;

    const mergedObjects = layersToMerge.flatMap(l => l.objects);
    const mergedLayer = createLayer(
      'Merged Layer',
      'merged',
      {
        opacity: 100,
        metadata: { mergedFrom: layerIds }
      }
    );

    // Add all objects to merged layer
    mergedObjects.forEach(obj => {
      addObjectToLayer(mergedLayer.id, obj);
    });

    // Delete original layers
    layerIds.forEach(id => deleteLayer(id));

    return mergedLayer;
  }, [layers, createLayer, addObjectToLayer, deleteLayer]);

  const value = {
    layers,
    activeLayerId,
    setActiveLayerId,
    createLayer,
    deleteLayer,
    updateLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    toggleLayerLock,
    reorderLayers,
    moveLayerUp,
    moveLayerDown,
    addObjectToLayer,
    removeObjectFromLayer,
    getLayerById,
    getActiveLayer,
    duplicateLayer,
    clearLayers,
    mergeLayers
  };

  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  );
};
