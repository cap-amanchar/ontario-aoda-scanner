/**
 * Multi-Page Scanner
 *
 * Orchestrates scanning of multiple pages across a website
 * Runs in background service worker for performance
 * Features: Session persistence, resume capability, robust error handling
 */

import { discoverRoutes } from '@moderna11y/scanner';
import {
  clearScanSession,
  loadScanSession,
  saveScanSession,
  updateScanSession,
} from '../utils/storage';

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

export interface PageScanResult {
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
  status: 'discovering' | 'scanning' | 'aggregating' | 'complete' | 'error' | 'cancelled';
  currentPage: number;
  totalPages: number;
  currentUrl?: string;
  error?: string;
  canResume?: boolean;
}

interface ScanSession {
  id: string;
  baseUrl: string;
  status: 'discovering' | 'scanning' | 'aggregating' | 'complete' | 'error' | 'cancelled';
  currentPage: number;
  totalPages: number;
  scannedUrls: string[];
  remainingUrls: string[];
  pageResults: PageScanResult[];
  startTime: string;
  lastUpdate: string;
  error?: string;
}

// Track active scan cancellation
let cancelRequested = false;

/**
 * Cancel active scan
 */
export function cancelScan(): void {
  cancelRequested = true;
}

/**
 * Resume a previously interrupted scan
 */
export async function resumeScan(
  progressCallback?: (progress: ScanProgress) => void
): Promise<SiteReport | null> {
  const session = await loadScanSession();
  if (!session || session.status !== 'scanning') {
    return null;
  }

  // Continue scanning from where we left off
  return continueScanning(session, progressCallback);
}

/**
 * Scan entire website (multi-page)
 */
export async function scanFullSite(
  baseUrl: string,
  progressCallback?: (progress: ScanProgress) => void,
  resume = false,
  config?: { maxPages?: number; maxDepth?: number }
): Promise<SiteReport> {
  try {
    // Reset cancel flag
    cancelRequested = false;

    // Check for existing session
    if (resume) {
      const existingSession = await loadScanSession();
      if (existingSession && existingSession.baseUrl === baseUrl) {
        return continueScanning(existingSession, progressCallback);
      }
    }

    // Clear any old session
    await clearScanSession();

    // Phase 1: Discover routes
    progressCallback?.({
      status: 'discovering',
      currentPage: 0,
      totalPages: 0,
    });

    const discoveryResult = await discoverRoutes(baseUrl, {
      maxPages: config?.maxPages || 50,
      maxDepth: config?.maxDepth || 2,
    });

    let urls = discoveryResult.urls;

    console.log(`[Scanner] Discovery complete: ${urls.length} URLs found via ${discoveryResult.strategy}`);
    console.log(`[Scanner] URLs to scan:`, urls);

    if (urls.length === 0) {
      // Fallback to just scanning the base URL
      console.log('[Scanner] No URLs found, falling back to base URL only');
      urls = [baseUrl];
    }

    // Create new session
    const session: ScanSession = {
      id: `scan_${Date.now()}`,
      baseUrl,
      status: 'scanning',
      currentPage: 0,
      totalPages: urls.length,
      scannedUrls: [],
      remainingUrls: urls,
      pageResults: [],
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
    };

    await saveScanSession(session);

    // Phase 2: Scan pages
    return continueScanning(session, progressCallback);
  } catch (error) {
    await clearScanSession();
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
 * Continue scanning from a session
 */
async function continueScanning(
  session: ScanSession,
  progressCallback?: (progress: ScanProgress) => void
): Promise<SiteReport> {
  try {
    const { remainingUrls, pageResults, baseUrl } = session;

    // Scan remaining pages
    for (let i = 0; i < remainingUrls.length; i++) {
      // Check for cancellation
      if (cancelRequested) {
        await updateScanSession({
          status: 'cancelled',
        });
        progressCallback?.({
          status: 'cancelled',
          currentPage: session.scannedUrls.length,
          totalPages: session.totalPages,
          canResume: true,
        });
        throw new Error('Scan cancelled by user');
      }

      const url = remainingUrls[i];

      // Skip non-scanneable URLs silently
      if (!isScannableUrl(url)) {
        console.log(`Skipping non-scanneable URL: ${url}`);
        await updateScanSession({
          currentPage: session.scannedUrls.length + i + 1,
          scannedUrls: [...session.scannedUrls, url],
          remainingUrls: remainingUrls.slice(i + 1),
          pageResults: [...pageResults],
        });
        continue;
      }

      progressCallback?.({
        status: 'scanning',
        currentPage: session.scannedUrls.length + i + 1,
        totalPages: session.totalPages,
        currentUrl: url,
      });

      try {
        const result = await scanSinglePage(url);
        pageResults.push(result);

        // Update session after each page
        await updateScanSession({
          currentPage: session.scannedUrls.length + i + 1,
          scannedUrls: [...session.scannedUrls, url],
          remainingUrls: remainingUrls.slice(i + 1),
          pageResults: [...pageResults],
        });
      } catch (error) {
        // Log error but continue with other pages
        console.error(`Failed to scan ${url}:`, error);
        const errorResult: PageScanResult = {
          url,
          score: 0,
          grade: 'F',
          violations: [],
          passes: 0,
          incomplete: 0,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        pageResults.push(errorResult);

        // Update session with error result
        await updateScanSession({
          currentPage: session.scannedUrls.length + i + 1,
          scannedUrls: [...session.scannedUrls, url],
          remainingUrls: remainingUrls.slice(i + 1),
          pageResults: [...pageResults],
        });
      }

      // Small delay to avoid overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Phase 3: Aggregate results
    progressCallback?.({
      status: 'aggregating',
      currentPage: session.totalPages,
      totalPages: session.totalPages,
    });

    // Import strategy from discovery or default
    const strategy = 'sitemap-crawl';
    const report = aggregateResults(baseUrl, pageResults, strategy);

    await updateScanSession({
      status: 'complete',
    });

    progressCallback?.({
      status: 'complete',
      currentPage: session.totalPages,
      totalPages: session.totalPages,
    });

    // Clear session on successful completion
    await clearScanSession();

    return report;
  } catch (error) {
    await updateScanSession({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    progressCallback?.({
      status: 'error',
      currentPage: session.scannedUrls.length,
      totalPages: session.totalPages,
      error: error instanceof Error ? error.message : 'Unknown error',
      canResume: !cancelRequested,
    });

    throw error;
  }
}

/**
 * Check if URL is scanneable (not XML, PDF, etc.)
 */
function isScannableUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    // List of non-scanneable extensions
    const unscannable = ['.xml', '.pdf', '.jpg', '.jpeg', '.png', '.gif',
                        '.svg', '.json', '.css', '.js', '.rss', '.xsl',
                        '.atom', '.mp4', '.mp3', '.zip', '.ico'];

    // Check file extension
    for (const ext of unscannable) {
      if (pathname.endsWith(ext)) {
        console.log(`[Scanner] Skipping ${ext} file: ${url}`);
        return false;
      }
    }

    // Check if it's a sitemap (even if already filtered, double-check)
    if (pathname.includes('sitemap') && pathname.endsWith('.xml')) {
      console.log(`[Scanner] Skipping sitemap XML: ${url}`);
      return false;
    }

    // Check if URL contains feed keywords
    if (pathname.includes('/feed/') || pathname.includes('rss')) {
      console.log(`[Scanner] Skipping feed: ${url}`);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Scan a single page by creating a hidden tab
 * Includes retry logic and content script injection
 */
async function scanSinglePage(url: string, retries = 2): Promise<PageScanResult> {
  // Skip non-scanneable URLs
  if (!isScannableUrl(url)) {
    throw new Error('URL is not scanneable (XML, PDF, image, etc.)');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let tabId: number | undefined;

    try {
      // Create hidden tab
      const tab = await chrome.tabs.create({
        url,
        active: false,
      });

      if (!tab.id) {
        throw new Error('Failed to create tab');
      }

      tabId = tab.id;

      // Wait for page to load with timeout
      await Promise.race([
        waitForTabLoad(tabId),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Page load timeout')), 15000)
        ),
      ]);

      // Ensure content script is injected
      await ensureContentScript(tabId);

      // Wait a bit more for dynamic content
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Send scan message to content script with timeout
      const response = await Promise.race([
        chrome.tabs.sendMessage(tabId, { action: 'scan' }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Scan timeout')), 30000)
        ),
      ]);

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
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown scan error');
      console.error(`Scan attempt ${attempt + 1} failed for ${url}:`, error);

      // Don't retry on certain errors
      if (
        error instanceof Error &&
        (error.message.includes('chrome://') || error.message.includes('restricted'))
      ) {
        break;
      }

      // Wait before retry
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } finally {
      // Always close the tab
      if (tabId) {
        try {
          await chrome.tabs.remove(tabId);
        } catch {
          // Ignore errors when closing tab
        }
      }
    }
  }

  // All retries failed
  throw lastError || new Error('Scan failed after retries');
}

/**
 * Ensure content script is injected in tab
 */
async function ensureContentScript(tabId: number): Promise<void> {
  try {
    // Try to ping the content script
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch {
    // Content script not loaded - inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });

      // Wait for script to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw new Error('Could not load accessibility scanner');
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
