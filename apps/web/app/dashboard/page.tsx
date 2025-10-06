'use client';

import { useState } from 'react';

interface ScanData {
    id: string;
    url: string;
    timestamp: string;
    totalIssues: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    isBilingual: boolean;
}

export default function DashboardPage() {
    const [scans] = useState<ScanData[]>([
        {
            id: '1',
            url: 'https://ontario.ca',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            totalIssues: 12,
            critical: 2,
            serious: 4,
            moderate: 4,
            minor: 2,
            isBilingual: true,
        },
        {
            id: '2',
            url: 'https://example.com',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            totalIssues: 28,
            critical: 8,
            serious: 12,
            moderate: 6,
            minor: 2,
            isBilingual: false,
        },
        {
            id: '3',
            url: 'https://mysite.com',
            timestamp: new Date(Date.now() - 259200000).toISOString(),
            totalIssues: 5,
            critical: 0,
            serious: 2,
            moderate: 2,
            minor: 1,
            isBilingual: false,
        },
    ]);

    const totalScans = scans.length;
    const avgIssues = Math.round(
        scans.reduce((acc, scan) => acc + scan.totalIssues, 0) / scans.length
    );
    const criticalCount = scans.reduce((acc, scan) => acc + scan.critical, 0);
    const bilingualCount = scans.filter((s) => s.isBilingual).length;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <header
                style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '20px 40px',
                }}
            >
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                        🇨🇦 ModernA11y Dashboard
                    </h1>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                        Ontario AODA Compliance Tracking
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
                {/* Stats Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '40px',
                    }}
                >
                    <StatCard title="Total Scans" value={totalScans} subtitle="This month" color="#2563eb" />
                    <StatCard
                        title="Avg Issues"
                        value={avgIssues}
                        subtitle="Per scan"
                        color="#f59e0b"
                    />
                    <StatCard
                        title="Critical Issues"
                        value={criticalCount}
                        subtitle="Needs immediate fix"
                        color="#ef4444"
                    />
                    <StatCard
                        title="Bilingual Sites"
                        value={bilingualCount}
                        subtitle={`${Math.round((bilingualCount / totalScans) * 100)}% of scans`}
                        color="#10b981"
                    />
                </div>

                {/* Scan History */}
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                >
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                        Recent Scans
                    </h2>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                <th
                                    style={{
                                        textAlign: 'left',
                                        padding: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                    }}
                                >
                                    URL
                                </th>
                                <th
                                    style={{
                                        textAlign: 'left',
                                        padding: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                    }}
                                >
                                    Date
                                </th>
                                <th
                                    style={{
                                        textAlign: 'center',
                                        padding: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                    }}
                                >
                                    Total
                                </th>
                                <th
                                    style={{
                                        textAlign: 'center',
                                        padding: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                    }}
                                >
                                    Critical
                                </th>
                                <th
                                    style={{
                                        textAlign: 'center',
                                        padding: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                    }}
                                >
                                    Serious
                                </th>
                                <th
                                    style={{
                                        textAlign: 'center',
                                        padding: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#6b7280',
                                    }}
                                >
                                    Bilingual
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {scans.map((scan) => (
                                <tr
                                    key={scan.id}
                                    style={{
                                        borderBottom: '1px solid #e5e7eb',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f9fafb';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <td style={{ padding: '16px', fontSize: '14px' }}>
                                        <div style={{ fontWeight: '500' }}>{new URL(scan.url).hostname}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                            {scan.url}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                                        {new Date(scan.timestamp).toLocaleDateString()}
                                    </td>
                                    <td
                                        style={{
                                            padding: '16px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {scan.totalIssues}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span
                          style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '14px',
                              fontWeight: '600',
                              backgroundColor: scan.critical > 0 ? '#fee2e2' : '#f3f4f6',
                              color: scan.critical > 0 ? '#991b1b' : '#6b7280',
                          }}
                      >
                        {scan.critical}
                      </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span
                          style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '14px',
                              fontWeight: '600',
                              backgroundColor: scan.serious > 0 ? '#fed7aa' : '#f3f4f6',
                              color: scan.serious > 0 ? '#9a3412' : '#6b7280',
                          }}
                      >
                        {scan.serious}
                      </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '20px' }}>
                                        {scan.isBilingual ? '✅' : '❌'}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Compliance Tips */}
                <div
                    style={{
                        marginTop: '40px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                >
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                        🎯 Ontario AODA Compliance Tips
                    </h2>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        <TipCard
                            title="Bilingual Requirement"
                            description="Ontario government sites must provide equal quality content in English and French. This includes alt text, labels, and all interactive elements."
                        />
                        <TipCard
                            title="WCAG 2.0 Level AA Mandatory"
                            description="All Ontario websites must meet WCAG 2.0 Level AA by law. Penalties up to $100,000/day for organizations."
                        />
                        <TipCard
                            title="Deadline Passed"
                            description="The January 1, 2021 deadline has passed. If you're not compliant yet, prioritize critical and serious issues immediately."
                        />
                        <TipCard
                            title="Focus on High-Impact Issues"
                            description="Start with color contrast, alt text, form labels, and keyboard navigation - these affect the most users."
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({
                      title,
                      value,
                      subtitle,
                      color,
                  }: {
    title: string;
    value: number;
    subtitle: string;
    color: string;
}) {
    return (
        <div
            style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
        >
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{title}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color, marginBottom: '4px' }}>
                {value}
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>{subtitle}</div>
        </div>
    );
}

function TipCard({ title, description }: { title: string; description: string }) {
    return (
        <div
            style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                borderLeft: '4px solid #2563eb',
            }}
        >
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>{title}</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{description}</p>
        </div>
    );
}