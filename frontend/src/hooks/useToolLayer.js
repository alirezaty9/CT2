import { useEffect, useRef, useCallback } from 'react';
import { useLayer } from '../contexts/LayerContext';

/**
 * Custom hook for tools to integrate with the layer system
 * @param {string} toolName - Name of the tool (e.g., 'brush', 'histogram')
 * @param {string} toolType - Type for layer categorization
 * @param {object} canvas - Fabric.js canvas instance
 * @param {boolean} isActive - Whether the tool is currently active
 */
export const useToolLayer = (toolName, toolType, canvas, isActive) => {
  const {
    createLayer,
    getActiveLayer,
    addObjectToLayer,
    removeObjectFromLayer,
    layers,
    setActiveLayerId
  } = useLayer();

  const currentLayerRef = useRef(null);

  // Create or reuse layer when tool becomes active
  useEffect(() => {
    if (isActive && !currentLayerRef.current) {
      // Check if there's already a layer for this tool type that's empty
      const existingLayer = layers.find(
        l => l.type === toolType && l.objects.length === 0
      );

      if (existingLayer) {
        currentLayerRef.current = existingLayer;
        setActiveLayerId(existingLayer.id);
      } else {
        // Create new layer for this tool
        const newLayer = createLayer(toolName, toolType, {
          metadata: { createdBy: toolName }
        });
        currentLayerRef.current = newLayer;
      }
    }
  }, [isActive, toolName, toolType, createLayer, layers, setActiveLayerId]);

  // Add a Fabric object to the current tool layer
  const addToLayer = useCallback((fabricObject) => {
    const layer = currentLayerRef.current || getActiveLayer();
    if (layer && fabricObject) {
      addObjectToLayer(layer.id, fabricObject);

      // Sync layer properties to fabric object
      fabricObject.set({
        opacity: layer.opacity / 100,
        visible: layer.visible,
        layerId: layer.id
      });

      // Add layer change listeners to fabric object
      if (canvas) {
        const updateFromLayer = () => {
          const updatedLayer = layers.find(l => l.id === layer.id);
          if (updatedLayer && fabricObject) {
            fabricObject.set({
              opacity: updatedLayer.opacity / 100,
              visible: updatedLayer.visible
            });
            canvas.renderAll();
          }
        };

        // Store the update function on the object for cleanup
        fabricObject._layerUpdateFn = updateFromLayer;
      }
    }
  }, [addObjectToLayer, getActiveLayer, layers, canvas]);

  // Remove a Fabric object from the layer
  const removeFromLayer = useCallback((fabricObject) => {
    const layer = currentLayerRef.current || getActiveLayer();
    if (layer && fabricObject) {
      removeObjectFromLayer(layer.id, fabricObject);

      // Cleanup layer update function
      if (fabricObject._layerUpdateFn) {
        delete fabricObject._layerUpdateFn;
      }
    }
  }, [removeObjectFromLayer, getActiveLayer]);

  // Get the current layer for this tool
  const getCurrentLayer = useCallback(() => {
    return currentLayerRef.current || getActiveLayer();
  }, [getActiveLayer]);

  // Sync all layer properties to all fabric objects in the layer
  const syncLayerToObjects = useCallback(() => {
    const layer = getCurrentLayer();
    if (!layer || !canvas) return;

    try {
      layer.objects.forEach(obj => {
        if (obj) {
          obj.set({
            opacity: layer.opacity / 100,
            visible: layer.visible,
            selectable: !layer.locked,
            evented: !layer.locked
          });
        }
      });

      // Only render if canvas context is ready
      if (canvas.getContext && canvas.getContext('2d')) {
        canvas.renderAll();
      }
    } catch (error) {
      console.warn('Error syncing layer to objects:', error);
    }
  }, [getCurrentLayer, canvas]);

  // Watch for layer changes and sync to fabric objects
  useEffect(() => {
    syncLayerToObjects();
  }, [layers, syncLayerToObjects]);

  // Cleanup: remove reference when tool becomes inactive
  useEffect(() => {
    if (!isActive) {
      currentLayerRef.current = null;
    }
  }, [isActive]);

  return {
    currentLayer: currentLayerRef.current,
    addToLayer,
    removeFromLayer,
    getCurrentLayer,
    syncLayerToObjects
  };
};
