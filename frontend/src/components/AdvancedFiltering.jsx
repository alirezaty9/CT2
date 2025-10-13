import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, Sliders, Sparkles, Zap } from 'lucide-react';

const AdvancedFiltering = ({ disabled = false, onApplyFilter }) => {
  const { t } = useTranslation();

  // نوع فیلتر فعال
  const [activeFilterType, setActiveFilterType] = useState('none');

  // تنظیمات فیلترها
  const [filterSettings, setFilterSettings] = useState({
    // فیلتر کاهش نویز
    denoising: {
      method: 'bilateral', // bilateral, nlm, gaussian, median
      strength: 50,
      kernelSize: 5,
      spatialSigma: 75,
      colorSigma: 75
    },

    // فیلتر تیزسازی
    sharpening: {
      method: 'unsharp', // unsharp, laplacian, highboost
      amount: 50,
      radius: 1.0,
      threshold: 0
    },

    // فیلتر لبه‌یابی
    edgeEnhancement: {
      method: 'sobel', // sobel, canny, laplacian, prewitt
      lowThreshold: 50,
      highThreshold: 150,
      apertureSize: 3
    },

    // فیلتر تطبیق هیستوگرام
    histogramEqualization: {
      method: 'clahe', // standard, clahe, adaptive
      clipLimit: 2.0,
      tileSize: 8
    },

    // فیلتر مورفولوژی
    morphology: {
      operation: 'opening', // opening, closing, gradient, tophat, blackhat
      kernelShape: 'ellipse', // rect, ellipse, cross
      kernelSize: 5,
      iterations: 1
    },

    // فیلتر موجک
    wavelet: {
      waveletType: 'db4', // db1-db10, haar, sym, coif
      level: 3,
      threshold: 50
    }
  });

  // تغییر نوع فیلتر
  const handleFilterTypeChange = (type) => {
    setActiveFilterType(type);
  };

  // تغییر تنظیمات فیلتر
  const handleSettingChange = (filterType, setting, value) => {
    setFilterSettings({
      ...filterSettings,
      [filterType]: {
        ...filterSettings[filterType],
        [setting]: value
      }
    });
  };

  // اعمال فیلتر
  const applyFilter = () => {
    if (activeFilterType === 'none') {
      alert(t('selectFilterFirst') || 'Please select a filter first');
      return;
    }

    const filterConfig = {
      type: activeFilterType,
      settings: filterSettings[activeFilterType]
    };

    console.log('Applying filter:', filterConfig);

    if (onApplyFilter) {
      onApplyFilter(filterConfig);
    }

    alert(t('filterApplied') || `${activeFilterType} filter applied successfully!`);
  };

  // لیست انواع فیلترها
  const filterTypes = [
    { key: 'none', label: t('none') || 'None', icon: Filter, color: 'gray' },
    { key: 'denoising', label: t('denoising') || 'Denoising', icon: Sparkles, color: 'blue' },
    { key: 'sharpening', label: t('sharpening') || 'Sharpening', icon: Zap, color: 'yellow' },
    { key: 'edgeEnhancement', label: t('edgeEnhancement') || 'Edge Enhancement', icon: Sliders, color: 'purple' },
    { key: 'histogramEqualization', label: t('histogramEqualization') || 'Histogram Eq.', icon: Filter, color: 'green' },
    { key: 'morphology', label: t('morphology') || 'Morphology', icon: Filter, color: 'red' },
    { key: 'wavelet', label: t('wavelet') || 'Wavelet', icon: Filter, color: 'indigo' }
  ];

  // رندر تنظیمات بر اساس نوع فیلتر
  const renderFilterSettings = () => {
    switch (activeFilterType) {
      case 'denoising':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('method') || 'Method'}
              </label>
              <select
                value={filterSettings.denoising.method}
                onChange={(e) => handleSettingChange('denoising', 'method', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="bilateral">Bilateral</option>
                <option value="nlm">Non-Local Means</option>
                <option value="gaussian">Gaussian</option>
                <option value="median">Median</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                <span>{t('strength') || 'Strength'}</span>
                <span className="font-mono text-primary">{filterSettings.denoising.strength}</span>
              </label>
              <input
                type="range"
                value={filterSettings.denoising.strength}
                onChange={(e) => handleSettingChange('denoising', 'strength', parseInt(e.target.value))}
                disabled={disabled}
                min="0"
                max="100"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('kernelSize') || 'Kernel Size'}
              </label>
              <input
                type="number"
                value={filterSettings.denoising.kernelSize}
                onChange={(e) => handleSettingChange('denoising', 'kernelSize', parseInt(e.target.value))}
                disabled={disabled}
                min="3"
                max="15"
                step="2"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        );

      case 'sharpening':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('method') || 'Method'}
              </label>
              <select
                value={filterSettings.sharpening.method}
                onChange={(e) => handleSettingChange('sharpening', 'method', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="unsharp">Unsharp Mask</option>
                <option value="laplacian">Laplacian</option>
                <option value="highboost">High-Boost</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                <span>{t('amount') || 'Amount'}</span>
                <span className="font-mono text-primary">{filterSettings.sharpening.amount}</span>
              </label>
              <input
                type="range"
                value={filterSettings.sharpening.amount}
                onChange={(e) => handleSettingChange('sharpening', 'amount', parseInt(e.target.value))}
                disabled={disabled}
                min="0"
                max="200"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                <span>{t('radius') || 'Radius'}</span>
                <span className="font-mono text-primary">{filterSettings.sharpening.radius}</span>
              </label>
              <input
                type="range"
                value={filterSettings.sharpening.radius * 10}
                onChange={(e) => handleSettingChange('sharpening', 'radius', parseInt(e.target.value) / 10)}
                disabled={disabled}
                min="5"
                max="50"
                className="w-full"
              />
            </div>
          </div>
        );

      case 'edgeEnhancement':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('edgeMethod') || 'Method'}
              </label>
              <select
                value={filterSettings.edgeEnhancement.method}
                onChange={(e) => handleSettingChange('edgeEnhancement', 'method', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="sobel">Sobel</option>
                <option value="canny">Canny</option>
                <option value="laplacian">Laplacian</option>
                <option value="prewitt">Prewitt</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                <span>{t('lowThreshold') || 'Low Threshold'}</span>
                <span className="font-mono text-primary">{filterSettings.edgeEnhancement.lowThreshold}</span>
              </label>
              <input
                type="range"
                value={filterSettings.edgeEnhancement.lowThreshold}
                onChange={(e) => handleSettingChange('edgeEnhancement', 'lowThreshold', parseInt(e.target.value))}
                disabled={disabled}
                min="0"
                max="255"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                <span>{t('highThreshold') || 'High Threshold'}</span>
                <span className="font-mono text-primary">{filterSettings.edgeEnhancement.highThreshold}</span>
              </label>
              <input
                type="range"
                value={filterSettings.edgeEnhancement.highThreshold}
                onChange={(e) => handleSettingChange('edgeEnhancement', 'highThreshold', parseInt(e.target.value))}
                disabled={disabled}
                min="0"
                max="255"
                className="w-full"
              />
            </div>
          </div>
        );

      case 'histogramEqualization':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('method') || 'Method'}
              </label>
              <select
                value={filterSettings.histogramEqualization.method}
                onChange={(e) => handleSettingChange('histogramEqualization', 'method', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="standard">Standard</option>
                <option value="clahe">CLAHE</option>
                <option value="adaptive">Adaptive</option>
              </select>
            </div>

            {filterSettings.histogramEqualization.method === 'clahe' && (
              <>
                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                    <span>{t('clipLimit') || 'Clip Limit'}</span>
                    <span className="font-mono text-primary">{filterSettings.histogramEqualization.clipLimit}</span>
                  </label>
                  <input
                    type="range"
                    value={filterSettings.histogramEqualization.clipLimit * 10}
                    onChange={(e) => handleSettingChange('histogramEqualization', 'clipLimit', parseInt(e.target.value) / 10)}
                    disabled={disabled}
                    min="10"
                    max="100"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                    {t('tileSize') || 'Tile Size'}
                  </label>
                  <input
                    type="number"
                    value={filterSettings.histogramEqualization.tileSize}
                    onChange={(e) => handleSettingChange('histogramEqualization', 'tileSize', parseInt(e.target.value))}
                    disabled={disabled}
                    min="4"
                    max="32"
                    step="4"
                    className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 'morphology':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('operation') || 'Operation'}
              </label>
              <select
                value={filterSettings.morphology.operation}
                onChange={(e) => handleSettingChange('morphology', 'operation', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="opening">Opening</option>
                <option value="closing">Closing</option>
                <option value="gradient">Gradient</option>
                <option value="tophat">Top Hat</option>
                <option value="blackhat">Black Hat</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('kernelShape') || 'Kernel Shape'}
              </label>
              <select
                value={filterSettings.morphology.kernelShape}
                onChange={(e) => handleSettingChange('morphology', 'kernelShape', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="rect">Rectangle</option>
                <option value="ellipse">Ellipse</option>
                <option value="cross">Cross</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('kernelSize') || 'Kernel Size'}
              </label>
              <input
                type="number"
                value={filterSettings.morphology.kernelSize}
                onChange={(e) => handleSettingChange('morphology', 'kernelSize', parseInt(e.target.value))}
                disabled={disabled}
                min="3"
                max="21"
                step="2"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        );

      case 'wavelet':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('waveletType') || 'Wavelet Type'}
              </label>
              <select
                value={filterSettings.wavelet.waveletType}
                onChange={(e) => handleSettingChange('wavelet', 'waveletType', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="haar">Haar</option>
                <option value="db4">Daubechies 4</option>
                <option value="db8">Daubechies 8</option>
                <option value="sym4">Symlet 4</option>
                <option value="coif2">Coiflet 2</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('decompositionLevel') || 'Decomposition Level'}
              </label>
              <input
                type="number"
                value={filterSettings.wavelet.level}
                onChange={(e) => handleSettingChange('wavelet', 'level', parseInt(e.target.value))}
                disabled={disabled}
                min="1"
                max="5"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 flex justify-between">
                <span>{t('threshold') || 'Threshold'}</span>
                <span className="font-mono text-primary">{filterSettings.wavelet.threshold}</span>
              </label>
              <input
                type="range"
                value={filterSettings.wavelet.threshold}
                onChange={(e) => handleSettingChange('wavelet', 'threshold', parseInt(e.target.value))}
                disabled={disabled}
                min="0"
                max="100"
                className="w-full"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="panel p-8 rounded-lg text-center">
            <Filter className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-30" />
            <p className="text-text-muted">
              {t('selectFilterType') || 'Select a filter type to configure settings'}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-text dark:text-text">
          {t('advancedFiltering') || 'Advanced Filtering'}
        </h3>
      </div>

      {/* Filter Type Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filterTypes.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => handleFilterTypeChange(key)}
            disabled={disabled}
            className={`p-3 rounded-lg border-2 transition-all ${
              activeFilterType === key
                ? `border-${color}-500 bg-${color}-500/10`
                : 'border-border hover:border-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon className={`w-5 h-5 mx-auto mb-2 ${activeFilterType === key ? `text-${color}-600` : 'text-text-muted'}`} />
            <div className="text-xs font-medium text-text dark:text-text text-center">
              {label}
            </div>
          </button>
        ))}
      </div>

      {/* Filter Settings */}
      <div className="panel p-4 rounded-lg min-h-[250px]">
        {renderFilterSettings()}
      </div>

      {/* Apply Button */}
      {activeFilterType !== 'none' && (
        <div className="flex justify-center">
          <button
            onClick={applyFilter}
            disabled={disabled}
            className="px-8 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:bg-gray-400 transition-colors flex items-center gap-2 font-semibold"
          >
            <Sparkles className="w-5 h-5" />
            <span>{t('applyFilter') || 'Apply Filter'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedFiltering;
