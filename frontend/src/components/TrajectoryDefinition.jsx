import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Route,
  Circle,
  TrendingUp,
  Waypoints,
  Save,
  Upload,
  Download,
  Trash2,
  Play,
  Settings
} from 'lucide-react';
import FormInput from './common/FormInput';
import FormSelect from './common/FormSelect';

const TrajectoryDefinition = ({ onTrajectoryChange, disabled = false }) => {
  const { t } = useTranslation();

  // نوع مسیر
  const [trajectoryType, setTrajectoryType] = useState('circular');

  // پارامترهای مسیر
  const [trajectoryParams, setTrajectoryParams] = useState({
    // Stepwise
    numberOfSteps: 360,
    anglePerStep: 1,

    // Circular
    startAngle: 0,
    endAngle: 360,
    rotationSpeed: 10,

    // Helical (برای اجسام بلند)
    helixPitch: 10,
    heightSteps: 10,

    // Arbitrary (دلخواه)
    customPoints: [],
  });

  // لیست مسیرهای ذخیره شده
  const [savedTrajectories, setSavedTrajectories] = useState([]);

  // انواع مسیر
  const trajectoryTypes = [
    {
      value: 'stepwise',
      label: 'Stepwise',
      icon: Route,
      description: t('stepwiseDesc') || 'Discrete angular steps',
      color: 'bg-blue-500'
    },
    {
      value: 'circular',
      label: 'Circular',
      icon: Circle,
      description: t('circularDesc') || 'Continuous circular motion',
      color: 'bg-green-500'
    },
    {
      value: 'helical',
      label: 'Helical',
      icon: TrendingUp,
      description: t('helicalDesc') || 'Spiral path for tall objects',
      color: 'bg-purple-500'
    },
    {
      value: 'arbitrary',
      label: 'Arbitrary',
      icon: Waypoints,
      description: t('arbitraryDesc') || 'Custom trajectory path',
      color: 'bg-orange-500'
    }
  ];

  // تغییر پارامتر
  const handleParamChange = (param, value) => {
    const updated = {
      ...trajectoryParams,
      [param]: parseFloat(value) || 0
    };
    setTrajectoryParams(updated);

    if (onTrajectoryChange) {
      onTrajectoryChange({
        type: trajectoryType,
        params: updated
      });
    }
  };

  // تغییر نوع مسیر
  const handleTypeChange = (type) => {
    setTrajectoryType(type);
    if (onTrajectoryChange) {
      onTrajectoryChange({
        type,
        params: trajectoryParams
      });
    }
  };

  // ذخیره مسیر
  const saveTrajectory = () => {
    const name = prompt(t('enterTrajectoryName') || 'Enter trajectory name:');
    if (name) {
      setSavedTrajectories([
        ...savedTrajectories,
        {
          name,
          type: trajectoryType,
          params: { ...trajectoryParams }
        }
      ]);
    }
  };

  // بارگذاری مسیر
  const loadTrajectory = (traj) => {
    setTrajectoryType(traj.type);
    setTrajectoryParams(traj.params);
    if (onTrajectoryChange) {
      onTrajectoryChange({
        type: traj.type,
        params: traj.params
      });
    }
  };

  // حذف مسیر
  const deleteTrajectory = (index) => {
    setSavedTrajectories(savedTrajectories.filter((_, i) => i !== index));
  };

  // Export/Import مسیر
  const exportTrajectory = () => {
    const data = JSON.stringify({
      type: trajectoryType,
      params: trajectoryParams
    }, null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trajectory_${trajectoryType}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTrajectory = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setTrajectoryType(data.type);
          setTrajectoryParams(data.params);
          if (onTrajectoryChange) {
            onTrajectoryChange(data);
          }
        } catch (error) {
          alert('Invalid trajectory file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('trajectoryDefinition') || 'Trajectory Definition'}
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveTrajectory}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-1.5 text-sm"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{t('save')}</span>
          </button>

          <button
            onClick={exportTrajectory}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-1.5 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('export')}</span>
          </button>

          <label className="px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 cursor-pointer transition-colors flex items-center gap-1.5 text-sm">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t('import') || 'Import'}</span>
            <input
              type="file"
              accept=".json"
              onChange={importTrajectory}
              className="hidden"
              disabled={disabled}
            />
          </label>
        </div>
      </div>

      {/* Trajectory Type Selection */}
      <div>
        <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
          {t('selectTrajectoryType') || 'Select Trajectory Type'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {trajectoryTypes.map((type) => {
            const Icon = type.icon;
            const isActive = trajectoryType === type.value;

            return (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                disabled={disabled}
                className={`
                  p-3 sm:p-4 rounded-lg border-2 transition-all text-left
                  ${isActive
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary/50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                  <div className={`p-2 rounded-lg ${type.color} bg-opacity-20 flex-shrink-0`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${type.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text dark:text-text mb-1 text-sm sm:text-base">
                      {type.label}
                    </div>
                    <p className="text-xs text-text-muted dark:text-text-muted line-clamp-2">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameters based on selected type */}
      <div className="panel p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-text dark:text-text mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {t('trajectoryParameters') || 'Trajectory Parameters'}
        </h4>

        {trajectoryType === 'stepwise' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('numberOfSteps') || 'Number of Steps'}
              </label>
              <input
                type="number"
                value={trajectoryParams.numberOfSteps}
                onChange={(e) => handleParamChange('numberOfSteps', e.target.value)}
                disabled={disabled}
                min="1"
                step="1"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('anglePerStep') || 'Angle per Step'} (°)
              </label>
              <input
                type="number"
                value={trajectoryParams.anglePerStep}
                onChange={(e) => handleParamChange('anglePerStep', e.target.value)}
                disabled={disabled}
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        )}

        {trajectoryType === 'circular' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('startAngle') || 'Start Angle'} (°)
              </label>
              <input
                type="number"
                value={trajectoryParams.startAngle}
                onChange={(e) => handleParamChange('startAngle', e.target.value)}
                disabled={disabled}
                step="1"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('endAngle') || 'End Angle'} (°)
              </label>
              <input
                type="number"
                value={trajectoryParams.endAngle}
                onChange={(e) => handleParamChange('endAngle', e.target.value)}
                disabled={disabled}
                step="1"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('rotationSpeed')} (°/s)
              </label>
              <input
                type="number"
                value={trajectoryParams.rotationSpeed}
                onChange={(e) => handleParamChange('rotationSpeed', e.target.value)}
                disabled={disabled}
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        )}

        {trajectoryType === 'helical' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('helixPitch') || 'Helix Pitch'} (mm)
              </label>
              <input
                type="number"
                value={trajectoryParams.helixPitch}
                onChange={(e) => handleParamChange('helixPitch', e.target.value)}
                disabled={disabled}
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('heightSteps') || 'Height Steps'}
              </label>
              <input
                type="number"
                value={trajectoryParams.heightSteps}
                onChange={(e) => handleParamChange('heightSteps', e.target.value)}
                disabled={disabled}
                min="1"
                step="1"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        )}

        {trajectoryType === 'arbitrary' && (
          <div className="text-center py-8">
            <Waypoints className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
            <p className="text-sm text-text-muted mb-4">
              {t('arbitraryTrajectoryInfo') || 'Use trajectory designer or import custom points'}
            </p>
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              {t('openDesigner') || 'Open Trajectory Designer'}
            </button>
          </div>
        )}
      </div>

      {/* Saved Trajectories */}
      {savedTrajectories.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text dark:text-text mb-3">
            {t('savedTrajectories') || 'Saved Trajectories'}
          </h4>
          <div className="space-y-2">
            {savedTrajectories.map((traj, index) => (
              <div
                key={index}
                className="panel p-3 rounded-lg flex items-center justify-between hover:bg-accent transition-colors"
              >
                <button
                  onClick={() => loadTrajectory(traj)}
                  disabled={disabled}
                  className="flex-1 text-left flex items-center gap-3"
                >
                  <div className={`p-2 rounded ${
                    trajectoryTypes.find(t => t.value === traj.type)?.color || 'bg-gray-500'
                  } bg-opacity-20`}>
                    {React.createElement(
                      trajectoryTypes.find(t => t.value === traj.type)?.icon || Route,
                      { className: 'w-4 h-4' }
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text dark:text-text">
                      {traj.name}
                    </div>
                    <div className="text-xs text-text-muted">
                      {traj.type.charAt(0).toUpperCase() + traj.type.slice(1)}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => deleteTrajectory(index)}
                  className="ml-2 p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrajectoryDefinition;
