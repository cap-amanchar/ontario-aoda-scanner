import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { type Language, useTranslation } from '../../utils/i18n';

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
  const { t, language, changeLanguage } = useTranslation();
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
            {t('settings')}
          </h3>
        </div>

        <div className="modal-section">
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localSettings.autoScan}
              onChange={(e) => setLocalSettings({ ...localSettings, autoScan: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('autoScan')}</div>
            </div>
          </label>
        </div>

        <div className="modal-section">
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localSettings.darkMode}
              onChange={(e) => setLocalSettings({ ...localSettings, darkMode: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                {localSettings.darkMode ? '🌙' : '☀️'} {t('darkMode')}
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
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('showNotifications')}</div>
            </div>
          </label>
        </div>

        <div className="modal-section">
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('language')}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => changeLanguage('en')}
              style={{
                flex: 1,
                padding: '10px',
                border: language === 'en' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: '6px',
                background: language === 'en' ? '#eff6ff' : '#fff',
                color: language === 'en' ? '#2563eb' : '#4b5563',
                cursor: 'pointer',
                fontWeight: language === 'en' ? 600 : 400,
              }}
            >
              🇬🇧 {t('english')}
            </button>
            <button
              type="button"
              onClick={() => changeLanguage('fr')}
              style={{
                flex: 1,
                padding: '10px',
                border: language === 'fr' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: '6px',
                background: language === 'fr' ? '#eff6ff' : '#fff',
                color: language === 'fr' ? '#2563eb' : '#4b5563',
                cursor: 'pointer',
                fontWeight: language === 'fr' ? 600 : 400,
              }}
            >
              🇫🇷 {t('french')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <button type="button" onClick={handleSave} className="modal-close-button" style={{ flex: 1 }}>
            {t('save')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-button"
            style={{ flex: 1, background: '#f3f4f6', color: '#4b5563' }}
          >
            {t('cancel')}
          </button>
        </div>

        {/* Developer Branding */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
            {t('developerCredit')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
