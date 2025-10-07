import React, { useEffect, useRef } from 'react';

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
  const modalRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">
            {violation.description}
          </h3>
          <div className={`badge ${violation.impact}`}>{violation.impact}</div>
        </div>

        {violation.wcagCriterion && (
          <div className="modal-section">
            <strong>WCAG Criterion:</strong> {violation.wcagCriterion}
          </div>
        )}

        {violation.aodaSection && (
          <div className="modal-aoda-section">
            <strong>🇨🇦 AODA Section:</strong> {violation.aodaSection}
            {violation.penalty && (
              <div className="modal-penalty">⚠️ {violation.penalty}</div>
            )}
          </div>
        )}

        {violation.affectedUsers && violation.affectedUsers.length > 0 && (
          <div className="modal-section">
            <strong>Affected Users:</strong> {violation.affectedUsers.join(', ')}
          </div>
        )}

        {violation.fixTime && (
          <div className="modal-section">
            <strong>Estimated Fix Time:</strong> ~{violation.fixTime} minutes
          </div>
        )}

        <div className="modal-section">
          <strong>How to Fix:</strong>
          <p className="modal-help">{violation.help}</p>
        </div>

        <a
          href={violation.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="modal-link"
        >
          Learn more →
        </a>

        <button onClick={onClose} className="modal-close-button">
          Close
        </button>
      </div>
    </div>
  );
};

export default ViolationModal;
