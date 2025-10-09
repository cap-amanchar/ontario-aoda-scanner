/**
 * Multi-Page Scanner
 *
 * Orchestrates scanning of multiple pages across a website
 * Runs in background service worker for performance
 */

import { discoverRoutes, normalizeUrl } from '@moderna11y/scanner';

export interface PageScanResult {
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

export interface SiteReport {
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

export interface ScanProgress {
  status: 'discovering' | 'scanning' | 'aggregating' | 'complete' | 'error';
  currentPage: number;
  totalPages: number;
  currentUrl?: string;
  error?: string;
}

/**
 * Scan entire website (multi-page)
 */
export async function scanFullSite(
  baseUrl: string,
  progressCallback?: (progress: ScanProgress) => void
): Promise<SiteReport> {
  try {
    // Phase 1: Discover routes
    progressCallback?.({
      status: 'discovering',
      currentPage: 0,
      totalPages: 0,
    });

    const discoveryResult = await discoverRoutes(baseUrl, {
      maxPages: 50,
      maxDepth: 2,
    });

    const urls = discoveryResult.urls;

    if (urls.length === 0) {
      // Fallback to just scanning the base URL
      urls.push(baseUrl);
    }

    // Phase 2: Scan each page
    const pageResults: PageScanResult[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      progressCallback?.({
        status: 'scanning',
        currentPage: i + 1,
        totalPages: urls.length,
        currentUrl: url,
      });

      try {
        const result = await scanSinglePage(url);
        pageResults.push(result);
      } catch (error) {
        // Log error but continue with other pages
        console.error(`Failed to scan ${url}:`, error);
        pageResults.push({
          url,
          score: 0,
          grade: 'F',
          violations: [],
          passes: 0,
          incomplete: 0,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Small delay to avoid overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Phase 3: Aggregate results
    progressCallback?.({
      status: 'aggregating',
      currentPage: urls.length,
      totalPages: urls.length,
    });

    const report = aggregateResults(baseUrl, pageResults, discoveryResult.strategy);

    progressCallback?.({
      status: 'complete',
      currentPage: urls.length,
      totalPages: urls.length,
    });

    return report;
  } catch (error) {
    progressCallback?.({
      status: 'error',
      currentPage: 0,
      totalPages: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Scan a single page by creating a hidden tab
 */
async function scanSinglePage(url: string): Promise<PageScanResult> {
  // Create hidden tab
  const tab = await chrome.tabs.create({
    url,
    active: false,
  });

  try {
    // Wait for page to load
    await waitForTabLoad(tab.id!);

    // Wait a bit more for dynamic content
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Send scan message to content script
    const response = await chrome.tabs.sendMessage(tab.id!, { action: 'scan' });

    // Import scoring functions dynamically
    const { calculateScore } = await import('@moderna11y/scanner');
    const scoreData = calculateScore(response);

    return {
      url,
      score: scoreData.score,
      grade: scoreData.grade,
      violations: response.violations || [],
      passes: response.passes || 0,
      incomplete: response.incomplete || 0,
      bilingualCheck: response.bilingualCheck,
      timestamp: new Date().toISOString(),
    };
  } finally {
    // Always close the tab
    if (tab.id) {
      await chrome.tabs.remove(tab.id);
    }
  }
}

/**
 * Wait for tab to finish loading
 */
function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // Timeout after 10 seconds
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 10000);
  });
}

/**
 * Aggregate results from multiple pages
 */
function aggregateResults(
  baseUrl: string,
  pageResults: PageScanResult[],
  strategy: string
): SiteReport {
  const validResults = pageResults.filter((r) => !r.error);

  // Calculate average score
  const avgScore =
    validResults.length > 0
      ? Math.round(validResults.reduce((sum, r) => sum + r.score, 0) / validResults.length)
      : 0;

  // Determine overall grade
  const { getGrade } = require('@moderna11y/scanner');
  const grade = getGrade(avgScore);

  // Find top violations (most frequent across all pages)
  const violationFrequency = new Map<
    string,
    { count: number; description: string; impact: string }
  >();

  for (const page of validResults) {
    for (const violation of page.violations) {
      const existing = violationFrequency.get(violation.id);
      if (existing) {
        existing.count++;
      } else {
        violationFrequency.set(violation.id, {
          count: 1,
          description: violation.description || violation.help || violation.id,
          impact: violation.impact || 'unknown',
        });
      }
    }
  }

  const topViolations = Array.from(violationFrequency.entries())
    .map(([ruleId, data]) => ({
      ruleId,
      description: data.description,
      frequency: data.count,
      impact: data.impact,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  // Calculate total estimated fix time
  const estimatedFixTime = validResults.reduce((sum, page) => {
    return sum + page.violations.reduce((vSum, v) => vSum + (v.fixTime || 0), 0);
  }, 0);

  // Calculate compliance rate (pages scoring 90+)
  const compliantPages = validResults.filter((r) => r.score >= 90).length;
  const complianceRate =
    validResults.length > 0 ? Math.round((compliantPages / validResults.length) * 100) : 0;

  return {
    baseUrl,
    totalPages: pageResults.length,
    scannedPages: validResults.length,
    avgScore,
    grade,
    pageResults,
    topViolations,
    estimatedFixTime: Math.round(estimatedFixTime),
    complianceRate,
    timestamp: new Date().toISOString(),
    strategy,
  };
}
