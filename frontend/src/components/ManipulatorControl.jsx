import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Move3D,
  MoveHorizontal,
  MoveVertical,
  RotateCw,
  Home,
  Save,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import FormInput from './common/FormInput';

const ManipulatorControl = ({ onPositionChange, disabled = false }) => {
  const { t } = useTranslation();

  // موقعیت فعلی Manipulator
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
    z: 0,
    theta: 0,
    gamma: 0,
  });

  // موقعیت‌های ذخیره شده
  const [savedPositions, setSavedPositions] = useState([]);

  // مقدار حرکت incremental
  const [stepSize, setStepSize] = useState(1);

  // تغییر موقعیت
  const updatePosition = useCallback((axis, value) => {
    const newPosition = {
      ...position,
      [axis]: parseFloat(value) || 0,
    };
    setPosition(newPosition);

    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  }, [position, onPositionChange]);

  // حرکت incremental
  const incrementPosition = useCallback((axis, direction) => {
    const increment = direction * stepSize;
    const newValue = position[axis] + increment;
    updatePosition(axis, newValue);
  }, [position, stepSize, updatePosition]);

  // بازگشت به خانه (Home)
  const goToHome = useCallback(() => {
    const homePosition = { x: 0, y: 0, z: 0, theta: 0, gamma: 0 };
    setPosition(homePosition);
    if (onPositionChange) {
      onPositionChange(homePosition);
    }
  }, [onPositionChange]);

  // ذخیره موقعیت فعلی
  const saveCurrentPosition = useCallback(() => {
    const positionName = `Position ${savedPositions.length + 1}`;
    setSavedPositions([...savedPositions, { name: positionName, ...position }]);
  }, [position, savedPositions]);

  // بارگذاری موقعیت ذخیره شده
  const loadPosition = useCallback((savedPos) => {
    const { name, ...pos } = savedPos;
    setPosition(pos);
    if (onPositionChange) {
      onPositionChange(pos);
    }
  }, [onPositionChange]);

  // حذف موقعیت ذخیره شده
  const deletePosition = useCallback((index) => {
    setSavedPositions(savedPositions.filter((_, i) => i !== index));
  }, [savedPositions]);

  // دکمه‌های جهتی
  const DirectionalButton = ({ icon: Icon, onClick, label }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      title={label}
    >
      <Icon className="w-5 h-5 text-primary" />
    </button>
  );

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Move3D className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('manipulator')}
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={goToHome}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">{t('home') || 'Home'}</span>
          </button>

          <button
            onClick={saveCurrentPosition}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{t('save')}</span>
          </button>
        </div>
      </div>

      {/* Step Size Control */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text dark:text-text whitespace-nowrap">
          {t('stepSize') || 'Step Size'}:
        </label>
        <div className="flex gap-2">
          {[0.1, 1, 5, 10].map(size => (
            <button
              key={size}
              onClick={() => setStepSize(size)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                stepSize === size
                  ? 'bg-primary text-white'
                  : 'bg-background-secondary hover:bg-accent text-text'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Main Control Area */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Linear Movement (X, Y, Z) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text dark:text-text flex items-center gap-2">
            <MoveHorizontal className="w-4 h-4" />
            {t('linearMovement') || 'Linear Movement'}
          </h4>

          {/* X-Y Control Pad */}
          <div className="panel p-4 rounded-lg">
            <div className="text-xs text-text-muted mb-2 ">X-Y {t('control') || 'Control'}</div>
            <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
              <div></div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-text-muted">Y</span>
                <DirectionalButton
                  icon={ChevronUp}
                  onClick={() => incrementPosition('y', 1)}
                  label="Y+"
                />
              </div>
              <div></div>

              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-text-muted">X</span>
                <DirectionalButton
                  icon={ChevronLeft}
                  onClick={() => incrementPosition('x', -1)}
                  label="X-"
                />
              </div>
              <div className="flex flex-col items-center justify-center">
                <button
                  onClick={goToHome}
                  disabled={disabled}
                  className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Home className="w-5 h-5 text-gray-600" />
                </button>
                <div className="text-xs font-mono font-bold text-text-muted mt-1">
                  {position.x.toFixed(1)}, {position.y.toFixed(1)}
                </div>
              </div>
              <DirectionalButton
                icon={ChevronRight}
                onClick={() => incrementPosition('x', 1)}
                label="X+"
              />

              <div></div>
              <DirectionalButton
                icon={ChevronDown}
                onClick={() => incrementPosition('y', -1)}
                label="Y-"
              />
              <div></div>
            </div>
          </div>

          {/* Z Control */}
          <div className="panel p-4 rounded-lg">
            <div className="text-xs text-text-muted mb-2">Z {t('control') || 'Control'}</div>
            <div className="flex items-center justify-center gap-2">
              <DirectionalButton
                icon={ChevronDown}
                onClick={() => incrementPosition('z', -1)}
                label="Z-"
              />
              <div className="px-4 py-2 bg-background-secondary rounded-lg min-w-[80px] text-center font-mono font-bold">
                {position.z.toFixed(1)}
              </div>
              <DirectionalButton
                icon={ChevronUp}
                onClick={() => incrementPosition('z', 1)}
                label="Z+"
              />
            </div>
          </div>
        </div>

        {/* Rotational Movement (θ, γ) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text dark:text-text flex items-center gap-2">
            <RotateCw className="w-4 h-4" />
            {t('rotationalMovement') || 'Rotational Movement'}
          </h4>

          {/* Theta Control */}
          <div className="panel p-4 rounded-lg">
            <div className="text-xs text-text-muted mb-2">θ (Theta)</div>
            <div className="flex items-center justify-center gap-2">
              <DirectionalButton
                icon={RotateCcw}
                onClick={() => incrementPosition('theta', -1)}
                label="θ-"
              />
              <div className="px-4 py-2 bg-background-secondary rounded-lg min-w-[80px] text-center font-mono font-bold">
                {position.theta.toFixed(1)}°
              </div>
              <DirectionalButton
                icon={RotateCw}
                onClick={() => incrementPosition('theta', 1)}
                label="θ+"
              />
            </div>
          </div>

          {/* Gamma Control */}
          <div className="panel p-4 rounded-lg">
            <div className="text-xs text-text-muted mb-2">γ (Gamma)</div>
            <div className="flex items-center justify-center gap-2">
              <DirectionalButton
                icon={RotateCcw}
                onClick={() => incrementPosition('gamma', -1)}
                label="γ-"
              />
              <div className="px-4 py-2 bg-background-secondary rounded-lg min-w-[80px] text-center font-mono font-bold">
                {position.gamma.toFixed(1)}°
              </div>
              <DirectionalButton
                icon={RotateCw}
                onClick={() => incrementPosition('gamma', 1)}
                label="γ+"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Input Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-text dark:text-text">
          {t('manualInput') || 'Manual Input'}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(position).map(([axis, value]) => (
            <div key={axis}>
              <label className="text-xs font-medium text-text-muted mb-1 block uppercase">
                {axis === 'theta' ? 'θ' : axis === 'gamma' ? 'γ' : axis.toUpperCase()}
              </label>
              <FormInput
                type="number"
                value={value}
                onChange={(e) => updatePosition(axis, e.target.value)}
                step="0.1"
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Saved Positions */}
      {savedPositions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text dark:text-text">
            {t('savedPositions') || 'Saved Positions'}
          </h4>
          <div className="grid gap-2">
            {savedPositions.map((pos, index) => (
              <div
                key={index}
                className="panel p-3 rounded-lg flex items-center justify-between hover:bg-accent transition-colors"
              >
                <button
                  onClick={() => loadPosition(pos)}
                  disabled={disabled}
                  className="flex-1 text-left text-sm text-text hover:text-primary transition-colors disabled:cursor-not-allowed"
                >
                  <span className="font-medium">{pos.name}:</span>
                  <span className="text-text-muted ml-2 font-mono text-xs">
                    X:{pos.x.toFixed(1)} Y:{pos.y.toFixed(1)} Z:{pos.z.toFixed(1)} θ:{pos.theta.toFixed(1)}° γ:{pos.gamma.toFixed(1)}°
                  </span>
                </button>
                <button
                  onClick={() => deletePosition(index)}
                  className="ml-2 p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManipulatorControl;
