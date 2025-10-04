import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Plus,
  MoreVertical
} from 'lucide-react';
import { useLayer } from '../../contexts/LayerContext';

const LayerManager = ({ className = '' }) => {
  const {
    layers,
    activeLayerId,
    setActiveLayerId,
    createLayer,
    deleteLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    toggleLayerLock,
    moveLayerUp,
    moveLayerDown,
    duplicateLayer
  } = useLayer();

  const [expandedLayers, setExpandedLayers] = useState(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleLayerExpand = (layerId) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  const handleCreateLayer = () => {
    const layerCount = layers.length;
    createLayer(`Layer ${layerCount + 1}`, 'default');
  };

  const getLayerIcon = (type) => {
    const icons = {
      background: '🖼️',
      brush: '🖌️',
      histogram: '📊',
      crop: '✂️',
      line: '📏',
      text: '📝',
      eraser: '🧹',
      default: '📄'
    };
    return icons[type] || icons.default;
  };

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 48 }}
        animate={{ width: 48 }}
        className={`bg-background-secondary border-l border-border flex flex-col items-center py-3 ${className}`}
      >
        <motion.button
          onClick={() => setIsCollapsed(false)}
          className="p-2 rounded-lg bg-background-primary hover:bg-accent border border-border hover:border-primary transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Expand Layers Panel"
        >
          <Layers size={20} className="text-primary" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: 280 }}
      className={`bg-background-secondary border-l border-border flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-text">Layers</h3>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={handleCreateLayer}
            className="p-1.5 rounded-lg bg-background-primary hover:bg-accent border border-border hover:border-primary transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="New Layer"
          >
            <Plus size={16} className="text-primary" />
          </motion.button>
          <motion.button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg bg-background-primary hover:bg-accent border border-border hover:border-primary transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Collapse Panel"
          >
            <ChevronDown size={16} className="text-text-muted" />
          </motion.button>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence>
          {layers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-text-muted text-sm"
            >
              <Layers size={32} className="mx-auto mb-2 opacity-50" />
              <p>No layers yet</p>
              <p className="text-xs mt-1">Click + to create a layer</p>
            </motion.div>
          ) : (
            // Reverse to show top layers first
            [...layers].reverse().map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.02 }}
                className={`rounded-lg border transition-all duration-200 ${
                  activeLayerId === layer.id
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-background-primary border-border hover:border-primary/50'
                }`}
              >
                {/* Layer Header */}
                <div
                  className="flex items-center gap-2 p-2 cursor-pointer"
                  onClick={() => setActiveLayerId(layer.id)}
                >
                  {/* Layer Icon/Type */}
                  <span className="text-lg">{getLayerIcon(layer.type)}</span>

                  {/* Layer Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text truncate">
                      {layer.name}
                    </div>
                    <div className="text-xs text-text-muted">
                      {layer.objects.length} object{layer.objects.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Layer Controls */}
                  <div className="flex items-center gap-1">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                    >
                      {layer.visible ? (
                        <Eye size={14} className="text-text" />
                      ) : (
                        <EyeOff size={14} className="text-text-muted" />
                      )}
                    </motion.button>

                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerLock(layer.id);
                      }}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                    >
                      {layer.locked ? (
                        <Lock size={14} className="text-orange-500" />
                      ) : (
                        <Unlock size={14} className="text-text-muted" />
                      )}
                    </motion.button>

                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerExpand(layer.id);
                      }}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MoreVertical size={14} className="text-text-muted" />
                    </motion.button>
                  </div>
                </div>

                {/* Expanded Layer Controls */}
                <AnimatePresence>
                  {expandedLayers.has(layer.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border overflow-hidden"
                    >
                      <div className="p-2 space-y-2">
                        {/* Opacity Slider */}
                        <div>
                          <label className="text-xs text-text-muted block mb-1">
                            Opacity: {layer.opacity}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={layer.opacity}
                            onChange={(e) => setLayerOpacity(layer.id, parseInt(e.target.value))}
                            className="w-full h-1 bg-background-secondary rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${layer.opacity}%, var(--color-background-secondary) ${layer.opacity}%, var(--color-background-secondary) 100%)`
                            }}
                          />
                        </div>

                        {/* Layer Actions */}
                        <div className="flex gap-1">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveLayerUp(layer.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-background-secondary hover:bg-accent rounded text-xs font-medium text-text border border-border hover:border-primary transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={index === 0}
                            title="Move Up"
                          >
                            <ChevronUp size={12} />
                            <span>Up</span>
                          </motion.button>

                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveLayerDown(layer.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-background-secondary hover:bg-accent rounded text-xs font-medium text-text border border-border hover:border-primary transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={index === layers.length - 1}
                            title="Move Down"
                          >
                            <ChevronDown size={12} />
                            <span>Down</span>
                          </motion.button>

                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateLayer(layer.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-background-secondary hover:bg-accent rounded text-xs font-medium text-text border border-border hover:border-primary transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            title="Duplicate"
                          >
                            <Copy size={12} />
                            <span>Dup</span>
                          </motion.button>

                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete "${layer.name}"?`)) {
                                deleteLayer(layer.id);
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 rounded text-xs font-medium text-red-600 border border-red-500/30 hover:border-red-500 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                            <span>Del</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      {layers.length > 0 && (
        <div className="border-t border-border p-2 text-xs text-text-muted text-center">
          {layers.length} layer{layers.length !== 1 ? 's' : ''} total
        </div>
      )}
    </motion.div>
  );
};

export default LayerManager;
