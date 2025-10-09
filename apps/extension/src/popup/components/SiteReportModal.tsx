import type React from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from '../../utils/i18n';

interface PageScanResult {
  url: string;
  score: number;
  grade: string;
  violations: any[];
  passes: number;
  incomplete: number;
  bilingualCheck?: any;
  timestamp: string;
  error?: string;
}

interface SiteReport {
  baseUrl: string;
  totalPages: number;
  scannedPages: number;
  avgScore: number;
  grade: string;
  pageResults: PageScanResult[];
  topViolations: Array<{
    ruleId: string;
    description: string;
    frequency: number;
    impact: string;
  }>;
  estimatedFixTime: number;
  complianceRate: number;
  timestamp: string;
  strategy: string;
}

interface SiteReportModalProps {
  report: SiteReport;
  onClose: () => void;
}

const SiteReportModal: React.FC<SiteReportModalProps> = ({ report, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  const handleExportReport = () => {
    const htmlReport = generateHTMLReport(report);

    // Use data URL instead of blob URL (works better in Chrome extensions)
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlReport)}`;

    // Open in new tab which will auto-trigger print dialog
    chrome.tabs.create({
      url: dataUrl,
      active: true,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className="site-report-modal"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="site-report-header">
          <div>
            <h2 className="site-report-title">🌐 {t('fullSiteScan')} {t('results')}</h2>
            <p className="site-report-url">{report.baseUrl}</p>
          </div>
          <button className="modal-close-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Overall Score */}
        <div className="site-score-card">
          <div className="site-score-main">
            <div className="site-score-circle">
              <div className="site-score-number">{report.avgScore}</div>
              <div className="site-score-grade">{report.grade}</div>
            </div>
            <div className="site-score-info">
              <div className="site-score-label">{t('averageScore')}</div>
              <div className="site-score-status">
                {report.avgScore >= 90 ? '✅ ' + t('compliant') : '⚠️ ' + t('needsImprovement')}
              </div>
            </div>
          </div>
          <div className="site-stats">
            <div className="site-stat">
              <div className="site-stat-value">{report.scannedPages}/{report.totalPages}</div>
              <div className="site-stat-label">{t('pagesScanned')}</div>
            </div>
            <div className="site-stat">
              <div className="site-stat-value">{report.complianceRate}%</div>
              <div className="site-stat-label">{t('complianceRate')}</div>
            </div>
            <div className="site-stat">
              <div className="site-stat-value">{Math.round(report.estimatedFixTime / 60)}h</div>
              <div className="site-stat-label">{t('estimatedFixTime')}</div>
            </div>
          </div>
        </div>

        {/* Top Violations */}
        {report.topViolations.length > 0 && (
          <div className="site-section">
            <h3 className="site-section-title">{t('topViolations')}</h3>
            <div className="top-violations-list">
              {report.topViolations.slice(0, 5).map((v) => (
                <div key={v.ruleId} className={`top-violation ${v.impact}`}>
                  <div className="top-violation-info">
                    <div className="top-violation-desc">{v.description}</div>
                    <div className="top-violation-meta">
                      <span className={`impact-badge ${v.impact}`}>{t(v.impact)}</span>
                      <span className="frequency-badge">{v.frequency} {t('pages')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page Results */}
        <div className="site-section">
          <h3 className="site-section-title">{t('pageResults')} ({report.pageResults.length})</h3>
          <div className="page-results-list">
            {report.pageResults.map((page, idx) => (
              <div key={idx} className="page-result-item">
                <div className="page-result-main">
                  <div className="page-url">
                    {new URL(page.url).pathname || '/'}
                  </div>
                  <div className="page-result-score">
                    <div className={`page-score ${page.score >= 90 ? 'good' : page.score >= 70 ? 'ok' : 'bad'}`}>
                      {page.score}
                    </div>
                    <div className="page-grade">{page.grade}</div>
                  </div>
                </div>
                <div className="page-result-details">
                  <span className="page-detail">
                    {page.violations.length} {t('violations')}
                  </span>
                  <span className="page-detail">
                    {page.passes} {t('passes')}
                  </span>
                  {page.error && (
                    <span className="page-error">❌ {page.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="site-report-actions">
          <button className="report-action-btn primary" onClick={handleExportReport}>
            📄 {t('exportReport')}
          </button>
          <button className="report-action-btn secondary" onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

function generateHTMLReport(report: SiteReport): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Full Site AODA Report - ${report.baseUrl}</title>
  <style>
    /* Base Styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Print Styles */
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
      @page { margin: 1cm; size: A4; }
    }

    /* Print Button */
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
    }
    .print-btn:hover { background: #1d4ed8; }

    h1 { color: #2563eb; font-size: 32px; margin-bottom: 8px; }
    .header { background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; border-bottom: 3px solid #2563eb; }
    .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 4px; }
    .branding { color: #9ca3af; font-size: 12px; font-style: italic; margin-top: 8px; }
    .score-card { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 32px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .score-circle { width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.4); }
    .score-number { font-size: 36px; font-weight: 700; }
    .score-grade { font-size: 20px; opacity: 0.9; }
    .stats { display: flex; gap: 32px; }
    .stat { text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 12px; opacity: 0.9; margin-top: 4px; }
    .section { background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #1f2937; }
    .violation { padding: 16px; margin: 12px 0; border-left: 4px solid; border-radius: 6px; }
    .violation.critical { border-color: #ef4444; background: #fef2f2; }
    .violation.serious { border-color: #f97316; background: #fff7ed; }
    .violation.moderate { border-color: #eab308; background: #fefce8; }
    .violation.minor { border-color: #3b82f6; background: #eff6ff; }
    .page-item { padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 12px 0; display: flex; justify-content: space-between; align-items: center; }
    .page-url { font-family: monospace; color: #2563eb; font-weight: 500; }
    .page-score { display: flex; gap: 12px; align-items: center; }
    .score-badge { padding: 8px 16px; border-radius: 6px; font-weight: 700; }
    .score-badge.good { background: #d1fae5; color: #065f46; }
    .score-badge.ok { background: #fef3c7; color: #92400e; }
    .score-badge.bad { background: #fee2e2; color: #991b1b; }
    .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
  </style>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
    function printReport() {
      window.print();
    }
  </script>
</head>
<body>
  <!-- Print Button (hidden when printing) -->
  <button class="print-btn no-print" onclick="printReport()">🖨️ Print / Save as PDF</button>

  <div class="header">
    <h1>🇨🇦 ComplyCA - Full Site AODA Report</h1>
    <div class="subtitle">Ontario AODA Scanner</div>
    <div class="branding">Developed by Nizar Amanchar for Canada ❤️</div>
  </div>

  <div class="score-card">
    <div class="score-circle">
      <div class="score-number">${report.avgScore}</div>
      <div class="score-grade">${report.grade}</div>
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${report.scannedPages}/${report.totalPages}</div>
        <div class="stat-label">Pages Scanned</div>
      </div>
      <div class="stat">
        <div class="stat-value">${report.complianceRate}%</div>
        <div class="stat-label">Compliance Rate</div>
      </div>
      <div class="stat">
        <div class="stat-value">${Math.round(report.estimatedFixTime / 60)}h</div>
        <div class="stat-label">Est. Fix Time</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">📊 Site Summary</h2>
    <p><strong>Base URL:</strong> ${report.baseUrl}</p>
    <p><strong>Scanned:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
    <p><strong>Average Score:</strong> ${report.avgScore}/100 (${report.grade})</p>
    <p><strong>Strategy:</strong> ${report.strategy}</p>
  </div>

  ${report.topViolations.length > 0 ? `
  <div class="section">
    <h2 class="section-title">🚨 Top Violations Across Site</h2>
    ${report.topViolations.map(v => `
    <div class="violation ${v.impact}">
      <div><strong>${v.description}</strong></div>
      <div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
        Impact: <span style="text-transform: uppercase; font-weight: 600;">${v.impact}</span> •
        Found on: <strong>${v.frequency} pages</strong>
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title">📄 Individual Page Results (${report.pageResults.length})</h2>
    ${report.pageResults.map(page => `
    <div class="page-item">
      <div>
        <div class="page-url">${page.url}</div>
        <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
          ${page.violations.length} violations • ${page.passes} passes
          ${page.error ? `<span style="color: #dc2626;">• Error: ${page.error}</span>` : ''}
        </div>
      </div>
      <div class="page-score">
        <span class="score-badge ${page.score >= 90 ? 'good' : page.score >= 70 ? 'ok' : 'bad'}">
          ${page.score}/100
        </span>
        <strong>${page.grade}</strong>
      </div>
    </div>
    `).join('')}
  </div>

  <div class="footer">
    Made with ❤️ by Nizar Amanchar for Canada 🇨🇦<br>
    <small style="opacity: 0.7;">ComplyCA - Making the web accessible for everyone</small>
  </div>
</body>
</html>`;
}

export default SiteReportModal;
