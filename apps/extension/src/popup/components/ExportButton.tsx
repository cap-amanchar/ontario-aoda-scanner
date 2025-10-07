import React, { useCallback } from 'react';

interface ScanResult {
  url: string;
  timestamp: string;
  violations: any[];
  passes: number;
  incomplete: number;
}

interface ExportButtonProps {
  result: ScanResult;
}

const ExportButton: React.FC<ExportButtonProps> = ({ result }) => {
  const handleExport = useCallback(() => {
    const summary = {
      critical: result.violations.filter((v) => v.impact === 'critical').length,
      serious: result.violations.filter((v) => v.impact === 'serious').length,
      moderate: result.violations.filter((v) => v.impact === 'moderate').length,
      minor: result.violations.filter((v) => v.impact === 'minor').length,
    };

    const report = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AODA Compliance Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; }
    h1 { color: #2563eb; font-size: 32px; margin-bottom: 8px; }
    .summary { background: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #e5e7eb; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 16px; }
    .summary-card { padding: 16px; border-radius: 8px; }
    .violation { border-left: 4px solid; padding: 16px; margin: 16px 0; background: #fefefe; border-radius: 8px; }
    .critical { border-color: #ef4444; background: #fef2f2; }
    .serious { border-color: #f97316; background: #fff7ed; }
    .moderate { border-color: #eab308; background: #fefce8; }
    .minor { border-color: #3b82f6; background: #eff6ff; }
  </style>
</head>
<body>
  <h1>🇨🇦 AODA Compliance Report</h1>
  <div class="summary">
    <h2 style="margin-top: 0;">Summary</h2>
    <p><strong>URL:</strong> ${result.url}</p>
    <p><strong>Scanned:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
    <p><strong>Total Issues:</strong> ${result.violations.length}</p>
    <div class="summary-grid">
      <div class="summary-card" style="background: #fee2e2; border-left: 3px solid #ef4444;">
        <div style="color: #991b1b; font-size: 12px;">Critical</div>
        <div style="color: #991b1b; font-size: 32px; font-weight: 700;">${summary.critical}</div>
      </div>
      <div class="summary-card" style="background: #fed7aa; border-left: 3px solid #f97316;">
        <div style="color: #9a3412; font-size: 12px;">Serious</div>
        <div style="color: #9a3412; font-size: 32px; font-weight: 700;">${summary.serious}</div>
      </div>
      <div class="summary-card" style="background: #fef3c7; border-left: 3px solid #eab308;">
        <div style="color: #92400e; font-size: 12px;">Moderate</div>
        <div style="color: #92400e; font-size: 32px; font-weight: 700;">${summary.moderate}</div>
      </div>
      <div class="summary-card" style="background: #dbeafe; border-left: 3px solid #3b82f6;">
        <div style="color: #1e40af; font-size: 12px;">Minor</div>
        <div style="color: #1e40af; font-size: 32px; font-weight: 700;">${summary.minor}</div>
      </div>
    </div>
  </div>
  <h2>Violations</h2>
  ${result.violations
    .map(
      (v) => `
    <div class="violation ${v.impact}">
      <h3 style="margin-top: 0;">${v.description}</h3>
      <p><strong>Impact:</strong> ${v.impact.toUpperCase()}</p>
      ${v.wcagCriterion ? `<p><strong>WCAG:</strong> ${v.wcagCriterion}</p>` : ''}
      ${v.aodaSection ? `<p><strong>AODA:</strong> ${v.aodaSection}</p>` : ''}
      ${v.penalty ? `<p><strong>Penalty:</strong> ${v.penalty}</p>` : ''}
      <p>${v.help}</p>
      <p><strong>Affected elements:</strong> ${v.nodes.length}</p>
    </div>
  `
    )
    .join('')}
</body>
</html>`;

    const blob = new Blob([report], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url,
      filename: `aoda-report-${Date.now()}.html`,
      saveAs: true,
    });
  }, [result]);

  return (
    <button onClick={handleExport} className="footer-button">
      📄 Export
    </button>
  );
};

export default ExportButton;
