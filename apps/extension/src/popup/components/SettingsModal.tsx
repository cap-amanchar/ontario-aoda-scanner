import React, { useState, useEffect, useRef } from 'react';

interface Settings {
  autoScan: boolean;
  darkMode: boolean;
  showNotifications: boolean;
}

interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        aria-labelledby="settings-title"
      >
        <div className="modal-header">
          <h3 id="settings-title" className="modal-title">
            Settings
          </h3>
        </div>

        <div className="modal-section">
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localSettings.autoScan}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, autoScan: e.target.checked })
              }
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Auto-scan on page load</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Automatically scan when you open the extension
              </div>
            </div>
          </label>
        </div>

        <div className="modal-section">
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localSettings.darkMode}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, darkMode: e.target.checked })
              }
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Dark mode</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Use dark theme (requires page reload)
              </div>
            </div>
          </label>
        </div>

        <div className="modal-section">
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localSettings.showNotifications}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, showNotifications: e.target.checked })
              }
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Show notifications</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Display success/error notifications
              </div>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <button onClick={handleSave} className="modal-close-button" style={{ flex: 1 }}>
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="modal-close-button"
            style={{ flex: 1, background: '#f3f4f6', color: '#4b5563' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
