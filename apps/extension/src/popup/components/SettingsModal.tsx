import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../utils/i18n';

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
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (
      e.type === 'click' ||
      (e as React.KeyboardEvent).key === 'Enter' ||
      (e as React.KeyboardEvent).key === ' '
    ) {
      onClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} onKeyDown={handleOverlayClick}>
      <dialog
        ref={modalRef}
        className="modal-content"
        onClick={handleContentClick}
        onKeyDown={handleContentClick}
        open
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
              {t('english')}
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
              {t('french')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={handleSave}
            className="modal-close-button"
            style={{ flex: 1 }}
          >
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
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '12px' }}>
            {t('developerCredit')}
          </div>
          <a
            href="https://github.com/cap-amanchar"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            aria-label="Visit GitHub profile"
          >
            <svg
              height="20"
              width="20"
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{ marginRight: '8px' }}
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
      </dialog>
    </div>
  );
};

export default SettingsModal;
