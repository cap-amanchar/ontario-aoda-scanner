import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from '../utils/i18n';
import ExportButton from './components/ExportButton';
import SettingsModal from './components/SettingsModal';
import ViolationModal from './components/ViolationModal';
import SiteReportModal from './components/SiteReportModal';

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
  score?: {
    score: number;
    grade: string;
    deductions: any;
    breakdown: any;
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
  const [fullSiteScanning, setFullSiteScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    current: number;
    total: number;
    url?: string;
  } | null>(null);
  const [siteReport, setSiteReport] = useState<any | null>(null);

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Check if we're on a restricted page
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://')) {
        throw new Error('Cannot scan browser internal pages. Please navigate to a regular website.');
      }

      let response;
      try {
        // Try to send message to content script
        response = await chrome.tabs.sendMessage(tab.id, { action: 'scan' });
      } catch (messageError) {
        // Content script not loaded - try to inject it programmatically
        console.log('Content script not found, injecting programmatically...');

        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          });

          // Wait a bit for the script to initialize
          await new Promise(resolve => setTimeout(resolve, 500));

          // Try sending message again
          response = await chrome.tabs.sendMessage(tab.id, { action: 'scan' });
        } catch (injectError) {
          throw new Error('Could not load scanner. Please refresh the page and try again.');
        }
      }

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
        score: response.score,
      };

      setResult(scanResult);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Scan failed. Please refresh the page and try again.';
      setError(message);
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  }, []);

  const runFullSiteScan = useCallback(async () => {
    setFullSiteScanning(true);
    setError(null);
    setScanProgress({ current: 0, total: 0 });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const baseUrl = new URL(tab.url || '').origin;

      // Listen for progress updates
      const progressListener = (message: any) => {
        if (message.type === 'scanProgress') {
          setScanProgress({
            current: message.progress.currentPage,
            total: message.progress.totalPages,
            url: message.progress.currentUrl,
          });
        }
      };
      chrome.runtime.onMessage.addListener(progressListener);

      // Start full site scan
      const response = await chrome.runtime.sendMessage({
        action: 'scanFullSite',
        baseUrl,
      });

      chrome.runtime.onMessage.removeListener(progressListener);

      if (response.success) {
        // Show comprehensive site report
        setSiteReport(response.report);
        setScanProgress(null);
        setFullSiteScanning(false);
      } else {
        throw new Error(response.error || 'Full site scan failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Full site scan failed';
      setError(message);
      console.error('Full site scan error:', err);
    } finally {
      setFullSiteScanning(false);
      setScanProgress(null);
    }
  }, []);

  return {
    scanning,
    result,
    error,
    runScan,
    setError,
    runFullSiteScan,
    fullSiteScanning,
    scanProgress,
    siteReport,
    setSiteReport,
  };
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

const SummaryCard = ({
  label,
  count,
  type,
}: { label: string; count: number; type: 'critical' | 'serious' | 'moderate' | 'minor' }) => {
  return (
    <div className={`summary-card ${type}`}>
      <div className="summary-card-label">{label}</div>
      <div className="summary-card-count">{count}</div>
    </div>
  );
};

const ViolationItem = ({ violation, onClick }: { violation: Violation; onClick: () => void }) => {
  const { t } = useTranslation();

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
      aria-label={t('viewDetails', [violation.description])}
    >
      <div className="violation-content">
        <div className="violation-text">
          <div className="violation-description">{violation.description}</div>
          <div className="violation-count">
            {violation.nodes.length} {violation.nodes.length !== 1 ? t('elements') : t('element')}
          </div>
        </div>
        <div className={`badge ${violation.impact}`}>{t(violation.impact)}</div>
      </div>
    </div>
  );
};

const EmptyState = ({ onScanAnother }: { onScanAnother: () => void }) => {
  const { t } = useTranslation();

  return (
    <div className="empty-state">
      <div className="empty-state-icon">✨</div>
      <h3>{t('perfectNoIssues')}</h3>
      <p>{t('perfectMessage')}</p>
      <div className="empty-state-actions">
        <button className="empty-state-button primary" onClick={onScanAnother}>
          {t('scanAnother')}
        </button>
      </div>
    </div>
  );
};

const ErrorDisplay = ({
  error,
  onRetry,
  onDismiss,
}: { error: string; onRetry: () => void; onDismiss: () => void }) => {
  const { t } = useTranslation();

  return (
    <div className="error-container">
      <div className="error-title">❌ {t('scanFailed')}</div>
      <div className="error-message">{error}</div>
      <div className="error-actions">
        <button className="error-button" onClick={onRetry}>
          {t('retryScan')}
        </button>
        <button className="error-button secondary" onClick={onDismiss}>
          {t('dismiss')}
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

const App = () => {
  const {
    scanning,
    result,
    error,
    runScan,
    setError,
    runFullSiteScan,
    fullSiteScanning,
    scanProgress,
    siteReport,
    setSiteReport,
  } = useScan();
  const { settings, saveSettings } = useSettings();
  const { t, language, changeLanguage } = useTranslation();
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
    <div className={`container ${settings.darkMode ? 'dark-mode' : ''}`}>
      <header className="header">
        <div className="header-top">
          <div className="app-title">
            <img src="icons/canada-flag.png" alt="Canada" className="canada-flag" />
            <h1 className="title">{t('appTitle')}</h1>
          </div>
          <div className="header-actions">
            <button
              className="header-button lang-button"
              onClick={() => changeLanguage(language === 'en' ? 'fr' : 'en')}
              aria-label={`Switch to ${language === 'en' ? 'French' : 'English'}`}
            >
              {language === 'en' ? 'FR' : 'EN'}
            </button>
            <button
              className="header-button settings-icon"
              onClick={() => setShowSettings(true)}
              aria-label={t('settings')}
            >
              ⚙️
            </button>
          </div>
        </div>
        <p className="subtitle">{t('appSubtitle')}</p>
      </header>

      <div className="content">
        {/* Score Display - Bento Style */}
        {result?.score && (
          <div className="score-bento">
            <div className="score-circle">
              <div className="score-number">{result.score.score}</div>
              <div className="score-grade">{result.score.grade}</div>
            </div>
            <div className="score-info">
              <h3>{t('scoreLabel')}</h3>
              <div className="score-status">
                {result.score.score >= 90 ? `✅ ${t('compliant')}` : `⚠️ ${t('needsImprovement')}`}
              </div>
            </div>
          </div>
        )}

        <button
          className="scan-button"
          onClick={runScan}
          disabled={scanning || fullSiteScanning}
          aria-label={scanning ? t('scanningAria') : t('scanButtonAria')}
          aria-busy={scanning}
        >
          {scanning ? (
            <>
              <span className="loading-indicator" /> {t('scanning')}
            </>
          ) : (
            <>
              🔍 {t('scanButton')} <kbd>⌘K</kbd>
            </>
          )}
        </button>

        {/* Full Site Scan Button */}
        {result && !fullSiteScanning && (
          <button className="full-site-button" onClick={runFullSiteScan} disabled={scanning}>
            🌐 {t('fullSiteScan')}
          </button>
        )}

        {/* Full Site Scan Progress */}
        {fullSiteScanning && scanProgress && (
          <div className="scan-progress">
            <div className="progress-header">
              <strong>{t('scanningWebsite')}</strong>
              <span>
                {t('pagesScanned', [
                  scanProgress.current.toString(),
                  scanProgress.total.toString(),
                ])}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(scanProgress.current / scanProgress.total) * 100}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            {scanProgress.url && (
              <div className="progress-url">{new URL(scanProgress.url).pathname}</div>
            )}
          </div>
        )}

        {/* Live region for screen readers */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {scanning && t('scanningAria')}
          {result && t('scanComplete', [result.violations.length.toString()])}
          {error && `${t('scanFailed')}: ${error}`}
        </div>

        {error && <ErrorDisplay error={error} onRetry={runScan} onDismiss={() => setError(null)} />}

        {result &&
          summary &&
          (result.violations.length === 0 ? (
            <EmptyState onScanAnother={runScan} />
          ) : (
            <div className="summary">
              {/* Bento Summary Cards */}
              <div className="summary-bento">
                <SummaryCard label={t('critical')} count={summary.critical} type="critical" />
                <SummaryCard label={t('serious')} count={summary.serious} type="serious" />
                <SummaryCard label={t('moderate')} count={summary.moderate} type="moderate" />
                <SummaryCard label={t('minor')} count={summary.minor} type="minor" />
              </div>

              {/* Bilingual Check - Bento Style */}
              {result.bilingualCheck && (
                <div
                  className={`bilingual-bento ${
                    result.bilingualCheck.isBilingual ? 'compliant' : 'non-compliant'
                  }`}
                >
                  <div className="bilingual-icon">
                    {result.bilingualCheck.isBilingual ? '✅' : '❌'}
                  </div>
                  <div className="bilingual-info">
                    <div className="bilingual-title">
                      {result.bilingualCheck.isBilingual
                        ? t('bilingualSupported')
                        : t('notBilingual')}
                    </div>
                    {result.bilingualCheck.detectedLanguages.length > 0 && (
                      <div className="bilingual-languages">
                        {t('languages')}: {result.bilingualCheck.detectedLanguages.join(', ').toUpperCase()}
                      </div>
                    )}
                  </div>
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
                  {t('all')} ({result.violations.length})
                </button>
                <button
                  className={`filter-tab ${filter === 'critical' ? 'active' : ''}`}
                  onClick={() => setFilter('critical')}
                  role="tab"
                  aria-selected={filter === 'critical'}
                >
                  {t('critical')} ({summary.critical})
                </button>
                <button
                  className={`filter-tab ${filter === 'serious' ? 'active' : ''}`}
                  onClick={() => setFilter('serious')}
                  role="tab"
                  aria-selected={filter === 'serious'}
                >
                  {t('serious')} ({summary.serious})
                </button>
                <button
                  className={`filter-tab ${filter === 'moderate' ? 'active' : ''}`}
                  onClick={() => setFilter('moderate')}
                  role="tab"
                  aria-selected={filter === 'moderate'}
                >
                  {t('moderate')} ({summary.moderate})
                </button>
                <button
                  className={`filter-tab ${filter === 'minor' ? 'active' : ''}`}
                  onClick={() => setFilter('minor')}
                  role="tab"
                  aria-selected={filter === 'minor'}
                >
                  {t('minor')} ({summary.minor})
                </button>
              </div>

              {/* Violations List */}
              <div className="violations-section">
                <h3 className="violations-header">
                  {filter === 'all' ? t('allViolations') : `${t(filter)} ${t('violations')}`} (
                  {filteredViolations.length})
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
          ))}
      </div>

      {result && (
        <footer className="footer">
          <ExportButton result={result} />
        </footer>
      )}

      {selectedViolation && (
        <ViolationModal violation={selectedViolation} onClose={() => setSelectedViolation(null)} />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {siteReport && (
        <SiteReportModal
          report={siteReport}
          onClose={() => setSiteReport(null)}
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
