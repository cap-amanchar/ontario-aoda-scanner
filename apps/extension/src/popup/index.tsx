import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import ViolationModal from './components/ViolationModal';
import ExportButton from './components/ExportButton';
import SettingsModal from './components/SettingsModal';

// ============================================
// TYPES
// ============================================

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

interface ScanResult {
  url: string;
  timestamp: string;
  violations: Violation[];
  passes: number;
  incomplete: number;
  bilingualCheck?: {
    isBilingual: boolean;
    hasLangAttribute: boolean;
    detectedLanguages: string[];
  };
}

interface Settings {
  autoScan: boolean;
  darkMode: boolean;
  showNotifications: boolean;
}

type FilterType = 'all' | 'critical' | 'serious' | 'moderate' | 'minor';

// ============================================
// HOOKS
// ============================================

const useScan = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scan' });

      if (response.error) {
        throw new Error(response.error);
      }

      const scanResult: ScanResult = {
        url: tab.url || '',
        timestamp: new Date().toISOString(),
        violations: response.violations || [],
        passes: response.passes || 0,
        incomplete: response.incomplete || 0,
        bilingualCheck: response.bilingualCheck,
      };

      setResult(scanResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed. The content script may not be loaded. Try refreshing the page.';
      setError(message);
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  }, []);

  return { scanning, result, error, runScan, setError };
};

const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    autoScan: false,
    darkMode: false,
    showNotifications: true,
  });

  useEffect(() => {
    // Load settings from storage
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
    });
  }, []);

  const saveSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    chrome.storage.local.set({ settings: newSettings });
  }, []);

  return { settings, saveSettings };
};

// ============================================
// COMPONENTS
// ============================================

const SummaryCard = ({ label, count, type }: { label: string; count: number; type: 'critical' | 'serious' | 'moderate' | 'minor' }) => {
  return (
    <div className={`summary-card ${type}`}>
      <div className="summary-card-label">{label}</div>
      <div className="summary-card-count">{count}</div>
    </div>
  );
};

const ViolationItem = ({ violation, onClick }: { violation: Violation; onClick: () => void }) => {
  return (
    <div
      className={`violation ${violation.impact}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${violation.description}`}
    >
      <div className="violation-content">
        <div className="violation-text">
          <div className="violation-description">{violation.description}</div>
          <div className="violation-count">
            {violation.nodes.length} element{violation.nodes.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className={`badge ${violation.impact}`}>{violation.impact}</div>
      </div>
    </div>
  );
};

const EmptyState = ({ onScanAnother }: { onScanAnother: () => void }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">✨</div>
      <h3>Perfect! No Issues Found</h3>
      <p>This page meets WCAG 2.0 Level AA accessibility standards. Great work!</p>
      <div className="empty-state-actions">
        <button className="empty-state-button primary" onClick={onScanAnother}>
          Scan Another Page
        </button>
      </div>
    </div>
  );
};

const ErrorDisplay = ({ error, onRetry, onDismiss }: { error: string; onRetry: () => void; onDismiss: () => void }) => {
  return (
    <div className="error-container">
      <div className="error-title">❌ Scan Failed</div>
      <div className="error-message">{error}</div>
      <div className="error-actions">
        <button className="error-button" onClick={onRetry}>
          Retry Scan
        </button>
        <button className="error-button secondary" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

const App = () => {
  const { scanning, result, error, runScan, setError } = useScan();
  const { settings, saveSettings } = useSettings();
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to scan
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!scanning) {
          runScan();
        }
      }
      // Escape to close modal
      if (e.key === 'Escape') {
        if (selectedViolation) {
          setSelectedViolation(null);
        } else if (showSettings) {
          setShowSettings(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [runScan, scanning, selectedViolation, showSettings]);

  // Auto-scan on load if enabled
  useEffect(() => {
    if (settings.autoScan) {
      runScan();
    }
  }, [settings.autoScan, runScan]);

  const summary = result
    ? {
        critical: result.violations.filter((v) => v.impact === 'critical').length,
        serious: result.violations.filter((v) => v.impact === 'serious').length,
        moderate: result.violations.filter((v) => v.impact === 'moderate').length,
        minor: result.violations.filter((v) => v.impact === 'minor').length,
      }
    : null;

  const filteredViolations = result
    ? filter === 'all'
      ? result.violations
      : result.violations.filter((v) => v.impact === filter)
    : [];

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">ModernA11y</h1>
        <p className="subtitle">AODA Compliance Scanner</p>
      </header>

      <div className="content">
        <button
          className="scan-button"
          onClick={runScan}
          disabled={scanning}
          aria-label={scanning ? 'Scanning page for accessibility issues' : 'Scan this page for AODA compliance'}
          aria-busy={scanning}
        >
          {scanning ? (
            <>
              <span className="loading-indicator"></span> Scanning...
            </>
          ) : (
            <>
              🔍 Scan This Page <kbd>⌘K</kbd>
            </>
          )}
        </button>

        {/* Live region for screen readers */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {scanning && 'Scanning page for accessibility issues'}
          {result && `Scan complete. Found ${result.violations.length} violations.`}
          {error && `Scan failed: ${error}`}
        </div>

        {error && (
          <ErrorDisplay
            error={error}
            onRetry={runScan}
            onDismiss={() => setError(null)}
          />
        )}

        {result && summary && (
          <>
            {result.violations.length === 0 ? (
              <EmptyState onScanAnother={runScan} />
            ) : (
              <div className="summary">
                <div className="summary-header">
                  <h2 className="summary-title">Results</h2>
                  <div className="summary-count">{result.violations.length}</div>
                </div>

                <div className="summary-grid">
                  <SummaryCard label="Critical" count={summary.critical} type="critical" />
                  <SummaryCard label="Serious" count={summary.serious} type="serious" />
                  <SummaryCard label="Moderate" count={summary.moderate} type="moderate" />
                  <SummaryCard label="Minor" count={summary.minor} type="minor" />
                </div>

                {result.bilingualCheck && (
                  <div
                    className={`bilingual-check ${
                      result.bilingualCheck.isBilingual ? 'compliant' : 'non-compliant'
                    }`}
                  >
                    <strong>
                      {result.bilingualCheck.isBilingual
                        ? '✅ Bilingual Support Detected'
                        : '❌ Not Bilingual'}
                    </strong>
                    {result.bilingualCheck.detectedLanguages.length > 0 && (
                      <div className="bilingual-languages">
                        Languages: {result.bilingualCheck.detectedLanguages.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Filter Tabs */}
                <div className="filter-tabs" role="tablist">
                  <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                    role="tab"
                    aria-selected={filter === 'all'}
                  >
                    All ({result.violations.length})
                  </button>
                  <button
                    className={`filter-tab ${filter === 'critical' ? 'active' : ''}`}
                    onClick={() => setFilter('critical')}
                    role="tab"
                    aria-selected={filter === 'critical'}
                  >
                    Critical ({summary.critical})
                  </button>
                  <button
                    className={`filter-tab ${filter === 'serious' ? 'active' : ''}`}
                    onClick={() => setFilter('serious')}
                    role="tab"
                    aria-selected={filter === 'serious'}
                  >
                    Serious ({summary.serious})
                  </button>
                  <button
                    className={`filter-tab ${filter === 'moderate' ? 'active' : ''}`}
                    onClick={() => setFilter('moderate')}
                    role="tab"
                    aria-selected={filter === 'moderate'}
                  >
                    Moderate ({summary.moderate})
                  </button>
                  <button
                    className={`filter-tab ${filter === 'minor' ? 'active' : ''}`}
                    onClick={() => setFilter('minor')}
                    role="tab"
                    aria-selected={filter === 'minor'}
                  >
                    Minor ({summary.minor})
                  </button>
                </div>

                {/* Violations List */}
                <div className="violations-section">
                  <h3 className="violations-header">
                    {filter === 'all' ? 'All Violations' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Violations`} ({filteredViolations.length})
                  </h3>
                  <div className="violations-list">
                    {filteredViolations.map((violation, idx) => (
                      <ViolationItem
                        key={`${violation.id}-${idx}`}
                        violation={violation}
                        onClick={() => setSelectedViolation(violation)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {result && (
        <footer className="footer">
          <ExportButton result={result} />
          <button className="footer-button" onClick={() => setShowSettings(true)}>
            ⚙️ Settings
          </button>
        </footer>
      )}

      {selectedViolation && (
        <ViolationModal
          violation={selectedViolation}
          onClose={() => setSelectedViolation(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

// Mount React app
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
