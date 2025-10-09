import type React from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from '../../utils/i18n';

interface ScanConfig {
  maxPages: number;
  maxDepth: number;
}

interface ScanProgress {
  current: number;
  total: number;
  url?: string;
  status: 'idle' | 'discovering' | 'scanning' | 'complete' | 'error' | 'cancelled';
}

interface SiteScannerProps {
  baseUrl: string;
  onComplete: (report: unknown) => void;
  onCancel: () => void;
}

const SiteScanner: React.FC<SiteScannerProps> = ({ baseUrl, onComplete, onCancel }) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<ScanConfig>({
    maxPages: 20,
    maxDepth: 2,
  });
  const [progress, setProgress] = useState<ScanProgress>({
    current: 0,
    total: 0,
    status: 'idle',
  });
  const [error, setError] = useState<string | null>(null);
  const [scanStarted, setScanStarted] = useState(false);

  const startScan = useCallback(async () => {
    setScanStarted(true);
    setError(null);
    setProgress({ current: 0, total: 0, status: 'discovering' });

    try {
      // Listen for progress updates
      const progressListener = (message: {
        type: string;
        progress?: {
          currentPage: number;
          totalPages: number;
          currentUrl?: string;
          status?: string;
        };
      }) => {
        if (message.type === 'scanProgress' && message.progress) {
          setProgress({
            current: message.progress.currentPage,
            total: message.progress.totalPages,
            url: message.progress.currentUrl,
            status: (message.progress.status as ScanProgress['status']) || 'scanning',
          });
        }
      };

      chrome.runtime.onMessage.addListener(progressListener);

      // Start scan with configuration
      const response = await chrome.runtime.sendMessage({
        action: 'scanFullSite',
        baseUrl,
        config,
      });

      chrome.runtime.onMessage.removeListener(progressListener);

      if (response.success) {
        setProgress((prev) => ({ ...prev, status: 'complete' }));
        onComplete(response.report);
      } else {
        throw new Error(response.error || 'Scan failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      setError(message);
      setProgress((prev) => ({ ...prev, status: 'error' }));
    }
  }, [baseUrl, config, onComplete]);

  const handleCancel = useCallback(async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'cancelScan' });
      setProgress((prev) => ({ ...prev, status: 'cancelled' }));
      onCancel();
    } catch (err) {
      console.error('Cancel error:', err);
    }
  }, [onCancel]);

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'discovering':
        return '🔍';
      case 'scanning':
        return '⚡';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      case 'cancelled':
        return '⏸️';
      default:
        return '🌐';
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'discovering':
        return 'Discovering pages...';
      case 'scanning':
        return 'Scanning pages...';
      case 'complete':
        return 'Scan complete!';
      case 'error':
        return 'Scan failed';
      case 'cancelled':
        return 'Scan cancelled';
      default:
        return 'Ready to scan';
    }
  };

  const percentage =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  if (!scanStarted) {
    // Configuration Screen
    return (
      <div className="site-scanner-config">
        <div className="scanner-header">
          <h3>🌐 Full Website Scan</h3>
          <p className="scanner-subtitle">Automated accessibility audit across your entire site</p>
        </div>

        <div className="scanner-url">
          <label>Target Website</label>
          <div className="url-display">{baseUrl}</div>
        </div>

        <div className="scanner-settings">
          <h4>Scan Settings</h4>

          <div className="setting-item">
            <label htmlFor="maxPages">
              Maximum Pages
              <span className="setting-hint">Limit the number of pages to scan</span>
            </label>
            <div className="setting-control">
              <input
                type="range"
                id="maxPages"
                min="5"
                max="100"
                step="5"
                value={config.maxPages}
                onChange={(e) => setConfig({ ...config, maxPages: Number(e.target.value) })}
              />
              <span className="setting-value">{config.maxPages}</span>
            </div>
          </div>

          <div className="setting-item">
            <label htmlFor="maxDepth">
              Crawl Depth
              <span className="setting-hint">How deep to follow links</span>
            </label>
            <div className="setting-control">
              <input
                type="range"
                id="maxDepth"
                min="1"
                max="5"
                step="1"
                value={config.maxDepth}
                onChange={(e) => setConfig({ ...config, maxDepth: Number(e.target.value) })}
              />
              <span className="setting-value">{config.maxDepth}</span>
            </div>
          </div>
        </div>

        <div className="scanner-actions">
          <button type="button" className="scanner-button primary" onClick={startScan}>
            <span className="button-icon">▶️</span>
            Start Scan
          </button>
          <button type="button" className="scanner-button secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>

        <div className="scanner-info">
          <p>
            ℹ️ This will scan up to {config.maxPages} pages and check for WCAG 2.0 Level AA
            compliance
          </p>
        </div>
      </div>
    );
  }

  // Scanning Screen
  return (
    <div className="site-scanner-active">
      <div className="scanner-header">
        <h3>
          {getStatusIcon()} {getStatusText()}
        </h3>
        <p className="scanner-subtitle">{baseUrl}</p>
      </div>

      {/* Progress Bar */}
      <div className="scanner-progress">
        <div className="progress-stats">
          <span className="progress-count">
            {progress.current} / {progress.total} pages
          </span>
          <span className="progress-percent">{percentage}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${percentage}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Current Page */}
      {progress.url && progress.status === 'scanning' && (
        <div className="scanner-current-page">
          <label>Currently scanning:</label>
          <div className="current-url">
            <span className="url-icon">🔍</span>
            {new URL(progress.url).pathname || '/'}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="scanner-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Status Messages */}
      {progress.status === 'discovering' && (
        <div className="scanner-status">
          <div className="status-spinner">⟳</div>
          Discovering pages via sitemap and crawling...
        </div>
      )}

      {progress.status === 'complete' && (
        <div className="scanner-complete">
          <div className="complete-icon">✨</div>
          <h4>Scan Complete!</h4>
          <p>Successfully scanned {progress.current} pages</p>
        </div>
      )}

      {/* Actions */}
      <div className="scanner-actions">
        {(progress.status === 'scanning' || progress.status === 'discovering') && (
          <button type="button" className="scanner-button danger" onClick={handleCancel}>
            <span className="button-icon">⏹️</span>
            Stop Scan
          </button>
        )}

        {progress.status === 'cancelled' && (
          <button type="button" className="scanner-button secondary" onClick={onCancel}>
            Close
          </button>
        )}

        {progress.status === 'error' && (
          <>
            <button type="button" className="scanner-button primary" onClick={startScan}>
              <span className="button-icon">🔄</span>
              Retry
            </button>
            <button type="button" className="scanner-button secondary" onClick={onCancel}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SiteScanner;
