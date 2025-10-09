import type React from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from '../../utils/i18n';

interface ViolationNode {
  html: string;
  target: string[];
  failureSummary: string;
}

interface Violation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: ViolationNode[];
  wcagCriterion?: string;
  aodaSection?: string;
  penalty?: string;
  fixTime?: number;
  affectedUsers?: string[];
}

interface ViolationModalProps {
  violation: Violation;
  onClose: () => void;
}

const ViolationModal: React.FC<ViolationModalProps> = ({ violation, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // Focus modal when opened
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">
            {violation.description}
          </h3>
          <div className={`badge ${violation.impact}`}>{t(violation.impact)}</div>
        </div>

        {violation.wcagCriterion && (
          <div className="modal-section">
            <strong>{t('wcagCriterion')}:</strong> {violation.wcagCriterion}
          </div>
        )}

        {violation.aodaSection && (
          <div className="modal-aoda-section">
            <strong>🇨🇦 {t('aodaSection')}:</strong> {violation.aodaSection}
            {violation.penalty && (
              <div className="modal-penalty">
                ⚠️ {t('penalty')}: {violation.penalty}
              </div>
            )}
          </div>
        )}

        {violation.affectedUsers && violation.affectedUsers.length > 0 && (
          <div className="modal-section">
            <strong>{t('affectedUsers')}:</strong> {violation.affectedUsers.join(', ')}
          </div>
        )}

        {violation.fixTime && (
          <div className="modal-section">
            <strong>{t('estimatedFixTime')}:</strong> ~{violation.fixTime} {t('minutes')}
          </div>
        )}

        <div className="modal-section">
          <strong>{violation.help}</strong>
        </div>

        <a
          href={violation.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="modal-link"
        >
          {t('learnMore')} →
        </a>

        <button type="button" onClick={onClose} className="modal-close-button">
          {t('close')}
        </button>
      </dialog>
    </div>
  );
};

export default ViolationModal;
