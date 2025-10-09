import type React from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from '../../utils/i18n';

interface ViolationNode {
  html: string;
  target: string[];
  failureSummary: string;
}

interface EnhancedViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  wcagCriterion?: string;
  aodaSection?: string;
  penalty?: string;
  fixTime?: number;
  affectedUsers?: string[];
  nodes: ViolationNode[];
}

interface BilingualCheck {
  hasLangAttribute: boolean;
  isBilingual: boolean;
  detectedLanguages: string[];
  hasLanguageToggle: boolean;
  hasFrenchContent: boolean;
  isOntarioGov: boolean;
  languageToggles: number;
}

interface PageScanResult {
  url: string;
  score: number;
  grade: string;
  violations: EnhancedViolation[];
  passes: number;
  incomplete: number;
  bilingualCheck?: BilingualCheck;
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
  const modalRef = useRef<HTMLDialogElement>(null);

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
        className="site-report-modal"
        onClick={handleContentClick}
        onKeyDown={handleContentClick}
        open
      >
        {/* Header */}
        <div className="site-report-header">
          <div>
            <h2 className="site-report-title">
              🌐 {t('fullSiteScan')} {t('results')}
            </h2>
            <p className="site-report-url">{report.baseUrl}</p>
          </div>
          <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">
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
                {report.avgScore >= 90 ? `✅ ${t('compliant')}` : `⚠️ ${t('needsImprovement')}`}
              </div>
            </div>
          </div>
          <div className="site-stats">
            <div className="site-stat">
              <div className="site-stat-value">
                {report.scannedPages}/{report.totalPages}
              </div>
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
                      <span className="frequency-badge">
                        {v.frequency} {t('pages')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page Results */}
        <div className="site-section">
          <h3 className="site-section-title">
            {t('pageResults')} ({report.pageResults.length})
          </h3>
          <div className="page-results-list">
            {report.pageResults.map((page) => (
              <div key={page.url} className="page-result-item">
                <div className="page-result-main">
                  <div className="page-url">{new URL(page.url).pathname || '/'}</div>
                  <div className="page-result-score">
                    <div
                      className={`page-score ${page.score >= 90 ? 'good' : page.score >= 70 ? 'ok' : 'bad'}`}
                    >
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
                  {page.error && <span className="page-error">❌ {page.error}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="site-report-actions">
          <button type="button" className="report-action-btn primary" onClick={handleExportReport}>
            📄 {t('exportReport')}
          </button>
          <button type="button" className="report-action-btn secondary" onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </dialog>
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
      font-family: Helvetica, Arial, sans-serif;
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
      details { display: block !important; }
      details[open] summary { display: block; }
      details > *:not(summary) { display: block !important; }
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
    .page-item { padding: 0; border: 1px solid #e5e7eb; border-radius: 8px; margin: 12px 0; overflow: hidden; }
    .page-header { padding: 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: #f9fafb; }
    .page-header:hover { background: #f3f4f6; }
    .page-url { font-family: monospace; color: #2563eb; font-weight: 500; }
    .page-score { display: flex; gap: 12px; align-items: center; }
    .score-badge { padding: 8px 16px; border-radius: 6px; font-weight: 700; }
    .score-badge.good { background: #d1fae5; color: #065f46; }
    .score-badge.ok { background: #fef3c7; color: #92400e; }
    .score-badge.bad { background: #fee2e2; color: #991b1b; }
    details { border: 1px solid #e5e7eb; border-radius: 8px; margin: 12px 0; }
    summary { padding: 16px; cursor: pointer; background: #f9fafb; list-style: none; display: flex; justify-content: space-between; align-items: center; }
    summary::-webkit-details-marker { display: none; }
    summary:hover { background: #f3f4f6; }
    summary::after { content: '▼'; font-size: 12px; color: #6b7280; transition: transform 0.2s; }
    details[open] summary::after { transform: rotate(180deg); }
    .violations-list { padding: 16px; background: white; }
    .violation-item { padding: 12px; margin: 8px 0; border-left: 4px solid; border-radius: 6px; }
    .violation-item.critical { border-color: #ef4444; background: #fef2f2; }
    .violation-item.serious { border-color: #f97316; background: #fff7ed; }
    .violation-item.moderate { border-color: #eab308; background: #fefce8; }
    .violation-item.minor { border-color: #3b82f6; background: #eff6ff; }
    .violation-title { font-weight: 600; margin-bottom: 8px; }
    .violation-meta { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
  </style>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };

    function printReport() {
      // Expand all dropdowns before printing
      const allDetails = document.querySelectorAll('details');
      allDetails.forEach(detail => detail.setAttribute('open', ''));

      setTimeout(function() {
        window.print();
      }, 100);
    }

    // Auto-expand all on print
    window.onbeforeprint = function() {
      const allDetails = document.querySelectorAll('details');
      allDetails.forEach(detail => detail.setAttribute('open', ''));
    };
  </script>
</head>
<body>
  <!-- Print Button (hidden when printing) -->
  <button class="print-btn no-print" onclick="printReport()">🖨️ Print / Save as PDF</button>

  <div class="header">
    <h1>ComplyCA - Full Site AODA Report</h1>
    <div class="subtitle">Ontario AODA Scanner</div>
    <div class="branding">Made with ❤️ by Nizar Amanchar for small business owners</div>
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

  <div class="section">
    <h2 class="section-title">📄 Page Results (${report.pageResults.length})</h2>
    ${report.pageResults
      .map(
        (page) => `
    <details>
      <summary>
        <div style="flex: 1;">
          <div class="page-url">${new URL(page.url).pathname || '/'}</div>
          <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
            ${page.violations.length} violations • ${page.passes} passes
            ${page.error ? `<span style="color: #dc2626;">• Error: ${page.error}</span>` : ''}
          </div>
        </div>
        <div class="page-score">
          <span class="score-badge ${page.score >= 90 ? 'good' : page.score >= 70 ? 'ok' : 'bad'}">
            ${page.score}/100
          </span>
          <strong style="margin-left: 8px;">${page.grade}</strong>
        </div>
      </summary>
      <div class="violations-list">
        ${
          page.violations.length === 0
            ? '<p style="text-align: center; color: #059669; padding: 20px;">✨ No violations found!</p>'
            : page.violations
                .map(
                  (v) => `
        <div class="violation-item ${v.impact}">
          <div class="violation-title">${v.description}</div>
          <div class="violation-meta">
            <strong>Impact:</strong> ${v.impact.toUpperCase()} •
            ${v.wcagCriterion ? `<strong>WCAG:</strong> ${v.wcagCriterion} •` : ''}
            ${v.aodaSection ? `<strong>AODA:</strong> ${v.aodaSection} •` : ''}
            <strong>Elements:</strong> ${v.nodes?.length || 0}
          </div>
          ${v.help ? `<p style="margin-top: 8px; font-size: 14px;"><strong>How to fix:</strong> ${v.help}</p>` : ''}
        </div>
        `
                )
                .join('')
        }
      </div>
    </details>
    `
      )
      .join('')}
  </div>

  <div class="footer">
    Made with ❤️ by Nizar Amanchar for Canada<br>
    <small style="opacity: 0.7;">ComplyCA - Making the web accessible for everyone</small>
  </div>
</body>
</html>`;
}

export default SiteReportModal;
