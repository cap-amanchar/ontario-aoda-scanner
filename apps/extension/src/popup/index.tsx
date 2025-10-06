import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

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
    totalIssues: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    timestamp: string;
    violations: Violation[];
    isBilingual?: boolean;
    hasLangAttribute?: boolean;
    detectedLanguages?: string[];
}

interface ScanHistory {
    scans: ScanResult[];
    totalScans: number;
    scanLimit: number;
    isPro: boolean;
}

function App() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [history, setHistory] = useState<ScanHistory>({
        scans: [],
        totalScans: 0,
        scanLimit: 5,
        isPro: false,
    });
    const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
    const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');

    useEffect(() => {
        // Load scan history from storage
        chrome.storage.local.get(['scanHistory'], (data) => {
            if (data.scanHistory) {
                setHistory(data.scanHistory);
            }
        });
    }, []);

    const handleScan = async () => {
        // Check scan limit
        if (history.totalScans >= history.scanLimit && !history.isPro) {
            alert(
                `Free tier limit reached (${history.scanLimit} scans). Upgrade to Pro for 50 scans/month!`
            );
            return;
        }

        setScanning(true);

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab.id) {
                throw new Error('No active tab found');
            }

            // Send message to content script to run scan
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'scan' });

            const scanResult: ScanResult = {
                url: tab.url || '',
                totalIssues: response.violations?.length || 0,
                critical: response.violations?.filter((v: any) => v.impact === 'critical').length || 0,
                serious: response.violations?.filter((v: any) => v.impact === 'serious').length || 0,
                moderate: response.violations?.filter((v: any) => v.impact === 'moderate').length || 0,
                minor: response.violations?.filter((v: any) => v.impact === 'minor').length || 0,
                timestamp: new Date().toISOString(),
                violations: response.violations || [],
                isBilingual: response.bilingualCheck?.isBilingual,
                hasLangAttribute: response.bilingualCheck?.hasLangAttribute,
                detectedLanguages: response.bilingualCheck?.detectedLanguages,
            };

            setResult(scanResult);

            // Update history
            const newHistory = {
                ...history,
                scans: [scanResult, ...history.scans].slice(0, 10), // Keep last 10
                totalScans: history.totalScans + 1,
            };
            setHistory(newHistory);

            // Save to storage
            chrome.storage.local.set({ scanHistory: newHistory });
        } catch (error) {
            console.error('Scan failed:', error);
            alert('Scan failed. Please refresh the page and try again.');
        } finally {
            setScanning(false);
        }
    };

    const exportPDF = () => {
        if (!result) return;

        // Create detailed report
        const report = generateReport(result);
        const blob = new Blob([report], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            url: url,
            filename: `aoda-report-${new Date().getTime()}.html`,
            saveAs: true,
        });
    };

    const generateReport = (scan: ScanResult): string => {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AODA Compliance Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #2563eb; }
    .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .violation { border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0; background: #fef2f2; }
    .critical { border-color: #dc2626; }
    .serious { border-color: #f97316; }
    .moderate { border-color: #eab308; }
    .minor { border-color: #3b82f6; }
  </style>
</head>
<body>
  <h1>🇨🇦 Ontario AODA Compliance Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>URL:</strong> ${scan.url}</p>
    <p><strong>Scanned:</strong> ${new Date(scan.timestamp).toLocaleString()}</p>
    <p><strong>Total Issues:</strong> ${scan.totalIssues}</p>
    <ul>
      <li>Critical: ${scan.critical}</li>
      <li>Serious: ${scan.serious}</li>
      <li>Moderate: ${scan.moderate}</li>
      <li>Minor: ${scan.minor}</li>
    </ul>
    ${
            scan.isBilingual !== undefined
                ? `<p><strong>Bilingual:</strong> ${scan.isBilingual ? '✅ Yes' : '❌ No'}</p>`
                : ''
        }
  </div>
  <h2>Violations</h2>
  ${scan.violations
            .map(
                (v) => `
    <div class="violation ${v.impact}">
      <h3>${v.description}</h3>
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
    };

    return (
        <div style={{ padding: '20px', width: '500px', maxHeight: '600px' }}>
            <header
                style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '20px' }}
            >
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                    🇨🇦 ModernA11y
                </h1>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>
                    Ontario AODA Scanner
                </p>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                    Scans: {history.totalScans}/{history.scanLimit} {!history.isPro && '(Free)'}
                </div>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('scan')}
                    style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: activeTab === 'scan' ? '#2563eb' : '#f3f4f6',
                        color: activeTab === 'scan' ? 'white' : '#6b7280',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                    }}
                >
                    Scan
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: activeTab === 'history' ? '#2563eb' : '#f3f4f6',
                        color: activeTab === 'history' ? 'white' : '#6b7280',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                    }}
                >
                    History ({history.scans.length})
                </button>
            </div>

            {activeTab === 'scan' && (
                <main>
                    <button
                        onClick={handleScan}
                        disabled={scanning || (history.totalScans >= history.scanLimit && !history.isPro)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor:
                                scanning || (history.totalScans >= history.scanLimit && !history.isPro)
                                    ? '#9ca3af'
                                    : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor:
                                scanning || (history.totalScans >= history.scanLimit && !history.isPro)
                                    ? 'not-allowed'
                                    : 'pointer',
                            marginBottom: '20px',
                        }}
                    >
                        {scanning ? '🔍 Scanning...' : '🔍 Scan Current Page'}
                    </button>

                    {history.totalScans >= history.scanLimit && !history.isPro && (
                        <div
                            style={{
                                padding: '12px',
                                backgroundColor: '#fef3c7',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                fontSize: '14px',
                            }}
                        >
                            <strong>⚠️ Limit Reached</strong>
                            <p style={{ margin: '8px 0 0 0' }}>
                                Upgrade to Pro for 50 scans/month! Only $19/month
                            </p>
                        </div>
                    )}

                    {result && (
                        <div
                            style={{
                                backgroundColor: '#f9fafb',
                                padding: '16px',
                                borderRadius: '8px',
                                maxHeight: '400px',
                                overflowY: 'auto',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Results</h2>
                                <button
                                    onClick={exportPDF}
                                    style={{
                                        padding: '4px 12px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    📄 Export
                                </button>
                            </div>

                            {/* Bilingual Check */}
                            {result.isBilingual !== undefined && (
                                <div
                                    style={{
                                        padding: '8px',
                                        backgroundColor: result.isBilingual ? '#d1fae5' : '#fee2e2',
                                        borderRadius: '6px',
                                        marginBottom: '12px',
                                        fontSize: '13px',
                                    }}
                                >
                                    <strong>
                                        {result.isBilingual
                                            ? '✅ Bilingual Support Detected'
                                            : '❌ Not Bilingual (Ontario requires EN + FR)'}
                                    </strong>
                                    {result.detectedLanguages && (
                                        <div style={{ marginTop: '4px', fontSize: '12px' }}>
                                            Languages: {result.detectedLanguages.join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Summary */}
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                                    Total Issues
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                                    {result.totalIssues}
                                </div>
                            </div>

                            {/* Impact Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: 16 }}>
                                {[
                                    { label: 'Critical', count: result.critical, bg: '#fee2e2', color: '#991b1b' },
                                    { label: 'Serious', count: result.serious, bg: '#fed7aa', color: '#9a3412' },
                                    { label: 'Moderate', count: result.moderate, bg: '#fef3c7', color: '#92400e' },
                                    { label: 'Minor', count: result.minor, bg: '#dbeafe', color: '#1e40af' },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        style={{ padding: '8px', backgroundColor: item.bg, borderRadius: '6px' }}
                                    >
                                        <div style={{ fontSize: '12px', color: item.color }}>{item.label}</div>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: item.color }}>
                                            {item.count}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Violations List */}
                            {result.violations.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                                        Violations
                                    </h3>
                                    {result.violations.slice(0, 5).map((violation, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedViolation(violation)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: 'white',
                                                borderRadius: '6px',
                                                marginBottom: '8px',
                                                cursor: 'pointer',
                                                border: '1px solid #e5e7eb',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'start',
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div
                                                        style={{
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            marginBottom: '4px',
                                                        }}
                                                    >
                                                        {violation.description}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                                        {violation.nodes.length} element(s) affected
                                                    </div>
                                                </div>
                                                <span
                                                    style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        backgroundColor:
                                                            violation.impact === 'critical'
                                                                ? '#fee2e2'
                                                                : violation.impact === 'serious'
                                                                    ? '#fed7aa'
                                                                    : violation.impact === 'moderate'
                                                                        ? '#fef3c7'
                                                                        : '#dbeafe',
                                                        color:
                                                            violation.impact === 'critical'
                                                                ? '#991b1b'
                                                                : violation.impact === 'serious'
                                                                    ? '#9a3412'
                                                                    : violation.impact === 'moderate'
                                                                        ? '#92400e'
                                                                        : '#1e40af',
                                                    }}
                                                >
                          {violation.impact}
                        </span>
                                            </div>
                                        </div>
                                    ))}
                                    {result.violations.length > 5 && (
                                        <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                                            +{result.violations.length - 5} more violations
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            )}

            {activeTab === 'history' && (
                <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    {history.scans.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            No scans yet. Start by scanning a page!
                        </div>
                    ) : (
                        history.scans.map((scan, idx) => (
                            <div
                                key={idx}
                                onClick={() => setResult(scan)}
                                style={{
                                    padding: '12px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    cursor: 'pointer',
                                    border: '1px solid #e5e7eb',
                                }}
                            >
                                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                                    {new URL(scan.url).hostname}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                                    {new Date(scan.timestamp).toLocaleString()}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                                    <span style={{ color: '#991b1b' }}>🔴 {scan.critical}</span>
                                    <span style={{ color: '#9a3412' }}>🟠 {scan.serious}</span>
                                    <span style={{ color: '#92400e' }}>🟡 {scan.moderate}</span>
                                    <span style={{ color: '#1e40af' }}>🔵 {scan.minor}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Violation Detail Modal */}
            {selectedViolation && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setSelectedViolation(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '12px',
                            maxWidth: '500px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                        }}
                    >
                        <h3 style={{ marginTop: 0, fontSize: '18px' }}>{selectedViolation.description}</h3>

                        {selectedViolation.wcagCriterion && (
                            <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                                <strong>WCAG:</strong> {selectedViolation.wcagCriterion}
                            </div>
                        )}

                        {selectedViolation.aodaSection && (
                            <div
                                style={{
                                    marginBottom: '12px',
                                    padding: '8px',
                                    backgroundColor: '#fef3c7',
                                    borderRadius: '6px',
                                }}
                            >
                                <strong>🇨🇦 AODA Section:</strong> {selectedViolation.aodaSection}
                                {selectedViolation.penalty && (
                                    <div style={{ marginTop: '4px', fontSize: '13px', color: '#991b1b' }}>
                                        ⚠️ {selectedViolation.penalty}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedViolation.affectedUsers && (
                            <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                                <strong>Affected Users:</strong> {selectedViolation.affectedUsers.join(', ')}
                            </div>
                        )}

                        {selectedViolation.fixTime && (
                            <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                                <strong>Estimated Fix Time:</strong> {selectedViolation.fixTime} minutes
                            </div>
                        )}

                        <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                            <strong>How to Fix:</strong>
                            <p style={{ marginTop: '8px' }}>{selectedViolation.help}</p>
                        </div>

                        <a
                            href={selectedViolation.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2563eb', fontSize: '14px' }}
                        >
                            Learn more →
                        </a>

                        <button
                            onClick={() => setSelectedViolation(null)}
                            style={{
                                marginTop: '16px',
                                width: '100%',
                                padding: '8px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Mount React app
const root = document.getElementById('root');
if (root) {
    createRoot(root).render(<App />);
}