import type React from 'react';
import { useCallback } from 'react';
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

interface ScanResult {
  url: string;
  timestamp: string;
  violations: EnhancedViolation[];
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
    deductions: {
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
      total: number;
    };
    breakdown: {
      passedChecks: number;
      totalChecks: number;
      violationCount: number;
      elementCount: number;
    };
  };
}

interface ExportButtonProps {
  result: ScanResult;
}

const ExportButton: React.FC<ExportButtonProps> = ({ result }) => {
  const { t } = useTranslation();

  const handleExport = useCallback(() => {
    // HTML escape function to prevent rendering issues
    const escapeHtml = (text: string) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    const summary = {
      critical: result.violations.filter((v) => v.impact === 'critical').length,
      serious: result.violations.filter((v) => v.impact === 'serious').length,
      moderate: result.violations.filter((v) => v.impact === 'moderate').length,
      minor: result.violations.filter((v) => v.impact === 'minor').length,
    };

    const urlObj = new URL(result.url);
    const siteName = urlObj.hostname.replace('www.', '');
    const totalViolations = result.violations?.length || 0;
    const totalPasses = result.passes || 0;
    const totalIncomplete = result.incomplete || 0;
    const score = result.score?.score || 0;
    const grade = result.score?.grade || 'N/A';
    const isBilingual = result.bilingualCheck?.isBilingual || false;
    const detectedLanguages = result.bilingualCheck?.detectedLanguages || [];

    const report = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AODA Compliance Report</title>
  <style>
    /* Base Styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      padding: 40px;
    }

    /* Print Styles */
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
      @page { margin: 1cm; size: A4; }
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 3px solid #2563eb;
    }
    .header h1 {
      color: #2563eb;
      font-size: 36px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .subtitle { color: #6b7280; font-size: 16px; margin-bottom: 4px; }
    .branding { color: #9ca3af; font-size: 13px; font-style: italic; margin-top: 8px; }

    /* Score Card */
    .score-card {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 32px;
      border-radius: 12px;
      margin: 24px 0;
      text-align: center;
    }
    .score-main { font-size: 64px; font-weight: 700; margin-bottom: 8px; }
    .score-grade { font-size: 32px; opacity: 0.9; }
    .score-status { font-size: 18px; margin-top: 12px; }

    /* Info Section */
    .info-section {
      background: #f9fafb;
      padding: 24px;
      border-radius: 12px;
      margin: 24px 0;
      border: 1px solid #e5e7eb;
    }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .info-item { padding: 12px; background: white; border-radius: 6px; }
    .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
    .info-value { font-size: 18px; font-weight: 600; color: #1f2937; }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin: 24px 0;
    }
    .summary-card {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid;
    }
    .summary-card.critical { background: #fef2f2; border-color: #ef4444; }
    .summary-card.serious { background: #fff7ed; border-color: #f97316; }
    .summary-card.moderate { background: #fefce8; border-color: #eab308; }
    .summary-card.minor { background: #eff6ff; border-color: #3b82f6; }
    .summary-label { font-size: 12px; text-transform: uppercase; margin-bottom: 8px; font-weight: 600; }
    .summary-count { font-size: 32px; font-weight: 700; }
    .summary-card.critical .summary-label, .summary-card.critical .summary-count { color: #991b1b; }
    .summary-card.serious .summary-label, .summary-card.serious .summary-count { color: #9a3412; }
    .summary-card.moderate .summary-label, .summary-card.moderate .summary-count { color: #92400e; }
    .summary-card.minor .summary-label, .summary-card.minor .summary-count { color: #1e40af; }

    /* Violations */
    .section { margin: 32px 0; }
    .section-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #1f2937;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .violation {
      border-left: 5px solid;
      padding: 20px;
      margin: 16px 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .violation.critical { border-color: #ef4444; background: #fef2f2; }
    .violation.serious { border-color: #f97316; background: #fff7ed; }
    .violation.moderate { border-color: #eab308; background: #fefce8; }
    .violation.minor { border-color: #3b82f6; background: #eff6ff; }
    .violation h3 { margin-bottom: 12px; font-size: 18px; }
    .violation-meta {
      display: flex;
      gap: 16px;
      margin: 12px 0;
      font-size: 14px;
      flex-wrap: wrap;
    }
    .violation-meta strong { font-weight: 600; }
    .violation p { margin: 8px 0; line-height: 1.6; }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 13px;
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
  </style>
  <script>
    window.onload = function() {
      // Auto-print dialog after 500ms
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

  <!-- Header -->
  <div class="header">
    <h1>ComplyCA - AODA Compliance Report</h1>
    <div class="subtitle">Ontario AODA Scanner</div>
    <div class="branding">Made with ❤️ by Nizar Amanchar for small business owners</div>
  </div>

  <!-- Score Card -->
  <div class="score-card">
    <div class="score-main">${score}</div>
    <div class="score-grade">Grade: ${grade}</div>
    <div class="score-status">
      ${score >= 90 ? '✅ AODA Compliant' : score >= 70 ? '⚠️ Needs Improvement' : '❌ Critical Issues'}
    </div>
  </div>

  <!-- Site Information -->
  <div class="info-section">
    <h2 style="margin-bottom: 16px;">Scan Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Website</div>
        <div class="info-value">${siteName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Scanned</div>
        <div class="info-value">${new Date(result.timestamp).toLocaleDateString()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Total Issues</div>
        <div class="info-value">${totalViolations}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Bilingual Support</div>
        <div class="info-value">${isBilingual ? '✅ Yes' : '❌ No'}</div>
      </div>
    </div>
    ${
      detectedLanguages.length > 0
        ? `
    <div style="margin-top: 12px; padding: 12px; background: #f3f4f6; border-radius: 6px;">
      <strong style="font-size: 12px; color: #6b7280;">Detected Languages:</strong>
      <span style="font-size: 14px; color: #1f2937;">${detectedLanguages.join(', ').toUpperCase()}</span>
    </div>
    `
        : ''
    }
    <div style="margin-top: 12px; padding: 12px; background: #f3f4f6; border-radius: 6px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
      <div>
        <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Violations</div>
        <div style="font-size: 18px; font-weight: 700; color: #dc2626;">${totalViolations}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Passes</div>
        <div style="font-size: 18px; font-weight: 700; color: #059669;">${totalPasses}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Incomplete</div>
        <div style="font-size: 18px; font-weight: 700; color: #f59e0b;">${totalIncomplete}</div>
      </div>
    </div>
    <div style="margin-top: 12px; font-size: 11px; color: #6b7280;">
      <strong>Full URL:</strong> <span style="word-break: break-all;">${escapeHtml(result.url)}</span>
    </div>
  </div>

  <!-- Summary Grid -->
  <div class="summary-grid">
    <div class="summary-card critical">
      <div class="summary-label">Critical</div>
      <div class="summary-count">${summary.critical}</div>
    </div>
    <div class="summary-card serious">
      <div class="summary-label">Serious</div>
      <div class="summary-count">${summary.serious}</div>
    </div>
    <div class="summary-card moderate">
      <div class="summary-label">Moderate</div>
      <div class="summary-count">${summary.moderate}</div>
    </div>
    <div class="summary-card minor">
      <div class="summary-label">Minor</div>
      <div class="summary-count">${summary.minor}</div>
    </div>
  </div>

  <!-- Violations Section -->
  <div class="section">
    <h2 class="section-title">📋 Accessibility Violations (${totalViolations})</h2>
  ${
    totalViolations === 0
      ? `
    <div style="text-align: center; padding: 40px 20px; background: #d1fae5; border-radius: 12px; color: #065f46;">
      <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
      <h3 style="font-size: 24px; margin-bottom: 8px;">Perfect! No Issues Found</h3>
      <p style="font-size: 16px;">This page meets WCAG 2.0 Level AA accessibility standards.</p>
    </div>
  `
      : result.violations
          .map(
            (v) => `
    <div class="violation ${v.impact || 'minor'}">
      <h3>${escapeHtml(v.description || 'Unknown violation')}</h3>
      <div class="violation-meta">
        <span><strong>Impact:</strong> ${(v.impact || 'unknown').toUpperCase()}</span>
        ${v.wcagCriterion ? `<span><strong>WCAG:</strong> ${escapeHtml(v.wcagCriterion)}</span>` : ''}
        ${v.aodaSection ? `<span><strong>AODA:</strong> ${escapeHtml(v.aodaSection)}</span>` : ''}
        <span><strong>Elements:</strong> ${v.nodes?.length || 0}</span>
      </div>
      ${v.penalty ? `<p style="color: #dc2626; font-weight: 600;">⚠️ ${escapeHtml(v.penalty)}</p>` : ''}
      <p><strong>How to fix:</strong> ${escapeHtml(v.help || 'No guidance available')}</p>
      ${v.affectedUsers && Array.isArray(v.affectedUsers) && v.affectedUsers.length > 0 ? `<p><strong>Affected Users:</strong> ${v.affectedUsers.map((u: string) => escapeHtml(u)).join(', ')}</p>` : ''}
      ${v.helpUrl ? `<p><a href="${escapeHtml(v.helpUrl)}" target="_blank" style="color: #2563eb; text-decoration: none;">📚 Learn More →</a></p>` : ''}
    </div>
  `
          )
          .join('')
  }
  </div>

  <!-- Footer -->
  <div class="footer">
    <p><strong>Made with ❤️ by Nizar Amanchar for Canada</strong></p>
    <p style="opacity: 0.8; margin-top: 8px;">ComplyCA - Making the web accessible for everyone</p>
    <p style="opacity: 0.7; margin-top: 8px; font-size: 11px;">
      Report generated on ${new Date().toLocaleString()} •
      <a href="https://www.ontario.ca/page/how-make-websites-accessible" target="_blank" style="color: #2563eb;">AODA Guidelines</a>
    </p>
  </div>
</body>
</html>`;

    // Use data URL instead of blob URL (works better in Chrome extensions)
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(report)}`;

    // Open in new tab which will auto-trigger print dialog
    chrome.tabs.create({
      url: dataUrl,
      active: true,
    });
  }, [result]);

  return (
    <button type="button" onClick={handleExport} className="footer-button">
      📄 {t('exportPDF')}
    </button>
  );
};

export default ExportButton;
