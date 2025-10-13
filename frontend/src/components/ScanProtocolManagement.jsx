import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Edit, Trash2, Copy, Save, Upload, Download } from 'lucide-react';

const ScanProtocolManagement = ({ disabled = false }) => {
  const { t } = useTranslation();

  // پروتکل‌های پیش‌فرض
  const defaultProtocols = [
    {
      id: 1,
      name: 'Standard CT',
      description: 'Standard CT scanning protocol',
      settings: {
        voltage: 120,
        current: 200,
        rotationMode: '360°',
        exposureTime: 100,
        numberOfProjections: 360,
        imageCount: 1
      },
      createdDate: '2025-10-01',
      lastUsed: '2025-10-13'
    },
    {
      id: 2,
      name: 'High Resolution',
      description: 'High resolution imaging for small details',
      settings: {
        voltage: 140,
        current: 250,
        rotationMode: '360°',
        exposureTime: 150,
        numberOfProjections: 720,
        imageCount: 1
      },
      createdDate: '2025-10-05',
      lastUsed: '2025-10-12'
    },
    {
      id: 3,
      name: 'Low Dose',
      description: 'Reduced radiation dose protocol',
      settings: {
        voltage: 100,
        current: 150,
        rotationMode: '180°',
        exposureTime: 50,
        numberOfProjections: 180,
        imageCount: 1
      },
      createdDate: '2025-10-08',
      lastUsed: null
    }
  ];

  // لیست پروتکل‌ها
  const [protocols, setProtocols] = useState(defaultProtocols);

  // پروتکل انتخاب شده
  const [selectedProtocol, setSelectedProtocol] = useState(null);

  // حالت ویرایش
  const [editMode, setEditMode] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState(null);

  // شروع ویرایش
  const startEdit = (protocol) => {
    setEditMode(true);
    setEditingProtocol({ ...protocol });
  };

  // شروع ایجاد پروتکل جدید
  const startCreate = () => {
    setEditMode(true);
    setEditingProtocol({
      id: Date.now(),
      name: '',
      description: '',
      settings: {
        voltage: 120,
        current: 200,
        rotationMode: '360°',
        exposureTime: 100,
        numberOfProjections: 360,
        imageCount: 1
      },
      createdDate: new Date().toISOString().split('T')[0],
      lastUsed: null
    });
  };

  // ذخیره پروتکل
  const saveProtocol = () => {
    if (!editingProtocol.name.trim()) {
      alert(t('enterProtocolName') || 'Please enter a protocol name');
      return;
    }

    const existingIndex = protocols.findIndex(p => p.id === editingProtocol.id);

    if (existingIndex >= 0) {
      // به‌روزرسانی پروتکل موجود
      const updatedProtocols = [...protocols];
      updatedProtocols[existingIndex] = editingProtocol;
      setProtocols(updatedProtocols);
    } else {
      // اضافه کردن پروتکل جدید
      setProtocols([...protocols, editingProtocol]);
    }

    setEditMode(false);
    setEditingProtocol(null);
  };

  // لغو ویرایش
  const cancelEdit = () => {
    setEditMode(false);
    setEditingProtocol(null);
  };

  // حذف پروتکل
  const deleteProtocol = (id) => {
    if (confirm(t('confirmDeleteProtocol') || 'Are you sure you want to delete this protocol?')) {
      setProtocols(protocols.filter(p => p.id !== id));
      if (selectedProtocol?.id === id) {
        setSelectedProtocol(null);
      }
    }
  };

  // کپی پروتکل
  const duplicateProtocol = (protocol) => {
    const newProtocol = {
      ...protocol,
      id: Date.now(),
      name: `${protocol.name} (Copy)`,
      createdDate: new Date().toISOString().split('T')[0],
      lastUsed: null
    };
    setProtocols([...protocols, newProtocol]);
  };

  // اعمال پروتکل
  const applyProtocol = (protocol) => {
    setSelectedProtocol(protocol);
    // به‌روزرسانی تاریخ آخرین استفاده
    const updatedProtocols = protocols.map(p =>
      p.id === protocol.id
        ? { ...p, lastUsed: new Date().toISOString().split('T')[0] }
        : p
    );
    setProtocols(updatedProtocols);
    alert(t('protocolApplied') || `Protocol "${protocol.name}" has been applied`);
  };

  // صادر کردن پروتکل‌ها
  const exportProtocols = () => {
    const dataStr = JSON.stringify(protocols, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan_protocols_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // وارد کردن پروتکل‌ها
  const importProtocols = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedProtocols = JSON.parse(e.target.result);
          setProtocols([...protocols, ...importedProtocols]);
          alert(t('protocolsImported') || 'Protocols imported successfully!');
        } catch (error) {
          alert(t('importError') || 'Error importing protocols');
        }
      };
      reader.readAsText(file);
    }
  };

  // تغییر مقدار در حالت ویرایش
  const handleEditChange = (field, value) => {
    setEditingProtocol({
      ...editingProtocol,
      [field]: value
    });
  };

  const handleSettingChange = (setting, value) => {
    setEditingProtocol({
      ...editingProtocol,
      settings: {
        ...editingProtocol.settings,
        [setting]: value
      }
    });
  };

  return (
    <div className="card p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text dark:text-text">
            {t('scanProtocolManagement') || 'Scan Protocol Management'}
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={startCreate}
            disabled={disabled || editMode}
            className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('new') || 'New'}</span>
          </button>

          <button
            onClick={exportProtocols}
            disabled={disabled || protocols.length === 0}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
          </button>

          <label className={`px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept=".json"
              onChange={importProtocols}
              disabled={disabled}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Edit/Create Form */}
      {editMode && editingProtocol && (
        <div className="panel p-4 rounded-lg border-2 border-primary/50 space-y-4">
          <h4 className="text-sm font-semibold text-text dark:text-text">
            {editingProtocol.name ? t('editProtocol') || 'Edit Protocol' : t('newProtocol') || 'New Protocol'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('name') || 'Protocol Name'} *
              </label>
              <input
                type="text"
                value={editingProtocol.name}
                onChange={(e) => handleEditChange('name', e.target.value)}
                placeholder={t('enterProtocolName') || 'Enter protocol name'}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('description') || 'Description'}
              </label>
              <input
                type="text"
                value={editingProtocol.description}
                onChange={(e) => handleEditChange('description', e.target.value)}
                placeholder={t('enterDescription') || 'Enter description'}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('voltage') || 'Voltage'} (kVp)
              </label>
              <input
                type="number"
                value={editingProtocol.settings.voltage}
                onChange={(e) => handleSettingChange('voltage', parseInt(e.target.value))}
                min="40"
                max="160"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('current') || 'Current'} (mA)
              </label>
              <input
                type="number"
                value={editingProtocol.settings.current}
                onChange={(e) => handleSettingChange('current', parseInt(e.target.value))}
                min="50"
                max="500"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('rotationMode') || 'Rotation Mode'}
              </label>
              <select
                value={editingProtocol.settings.rotationMode}
                onChange={(e) => handleSettingChange('rotationMode', e.target.value)}
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="180°">180°</option>
                <option value="360°">360°</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('exposureTime') || 'Exposure Time'} (ms)
              </label>
              <input
                type="number"
                value={editingProtocol.settings.exposureTime}
                onChange={(e) => handleSettingChange('exposureTime', parseInt(e.target.value))}
                min="10"
                max="1000"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text dark:text-text mb-2 block">
                {t('numberOfProjections') || 'Projections'}
              </label>
              <input
                type="number"
                value={editingProtocol.settings.numberOfProjections}
                onChange={(e) => handleSettingChange('numberOfProjections', parseInt(e.target.value))}
                min="36"
                max="1440"
                step="36"
                className="w-full px-3 py-2 border-2 border-border rounded-lg bg-background-white dark:bg-background-secondary text-text dark:text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors text-sm"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              onClick={saveProtocol}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{t('save') || 'Save'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Protocols List */}
      <div className="space-y-3">
        {protocols.length === 0 ? (
          <div className="panel p-8 rounded-lg text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-30" />
            <p className="text-text-muted">
              {t('noProtocols') || 'No protocols available. Create a new protocol to get started.'}
            </p>
          </div>
        ) : (
          protocols.map((protocol) => (
            <div
              key={protocol.id}
              className={`panel p-4 rounded-lg border-2 transition-all ${
                selectedProtocol?.id === protocol.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-text dark:text-text mb-1">
                    {protocol.name}
                  </h4>
                  <p className="text-sm text-text-muted mb-2">
                    {protocol.description}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-text-muted">{t('voltage')}:</span>
                      <span className="font-semibold text-text ml-1">{protocol.settings.voltage} kVp</span>
                    </div>
                    <div>
                      <span className="text-text-muted">{t('current')}:</span>
                      <span className="font-semibold text-text ml-1">{protocol.settings.current} mA</span>
                    </div>
                    <div>
                      <span className="text-text-muted">{t('mode')}:</span>
                      <span className="font-semibold text-text ml-1">{protocol.settings.rotationMode}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">{t('lastUsed')}:</span>
                      <span className="font-semibold text-text ml-1">
                        {protocol.lastUsed || t('never') || 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => applyProtocol(protocol)}
                    disabled={disabled}
                    className="px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 disabled:bg-gray-400 transition-colors text-xs font-semibold"
                  >
                    {t('apply') || 'Apply'}
                  </button>
                  <button
                    onClick={() => startEdit(protocol)}
                    disabled={disabled || editMode}
                    className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    title={t('edit') || 'Edit'}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => duplicateProtocol(protocol)}
                    disabled={disabled}
                    className="p-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    title={t('duplicate') || 'Duplicate'}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProtocol(protocol.id)}
                    disabled={disabled}
                    className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                    title={t('delete') || 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScanProtocolManagement;
