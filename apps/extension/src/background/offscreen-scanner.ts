/**
 * Headless Offscreen Scanner
 *
 * Uses Chrome Offscreen API to scan pages without opening visible/hidden tabs
 * Runs axe-core in an offscreen document for true headless scanning
 */

import type { PageScanResult } from './multi-page-scanner';

let offscreenDocumentCreated = false;

/**
 * Check if offscreen API is available
 */
function isOffscreenSupported(): boolean {
  return typeof chrome.offscreen !== 'undefined';
}

/**
 * Ensure offscreen document is created
 */
async function ensureOffscreenDocument(): Promise<void> {
  if (!isOffscreenSupported()) {
    throw new Error('Offscreen API not supported');
  }

  if (offscreenDocumentCreated) {
    return;
  }

  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
  });

  if (existingContexts.length > 0) {
    offscreenDocumentCreated = true;
    return;
  }

  // Create offscreen document
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['DOM_SCRAPING' as chrome.offscreen.Reason],
    justification: 'Headless accessibility scanning using axe-core',
  });

  offscreenDocumentCreated = true;
  console.log('[Offscreen] Created offscreen document for headless scanning');
}

/**
 * Scan a single page headlessly (no tab opening)
 */
export async function scanPageHeadless(url: string, retries = 2): Promise<PageScanResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Ensure offscreen document exists
      await ensureOffscreenDocument();

      // Send scan request to offscreen document
      const response = await chrome.runtime.sendMessage({
        target: 'offscreen',
        action: 'scanUrl',
        url,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Import scoring functions
      const { calculateScore } = await import('@moderna11y/scanner');
      const scoreData = calculateScore(response.result);

      return {
        url,
        score: scoreData.score,
        grade: scoreData.grade,
        violations: response.result.violations || [],
        passes: response.result.passes || 0,
        incomplete: response.result.incomplete || 0,
        bilingualCheck: response.result.bilingualCheck,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown scan error');
      console.error(`[Offscreen] Scan attempt ${attempt + 1} failed for ${url}:`, error);

      // Wait before retry
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // All retries failed
  throw lastError || new Error('Headless scan failed after retries');
}

/**
 * Close offscreen document (cleanup)
 */
export async function closeOffscreenDocument(): Promise<void> {
  if (!offscreenDocumentCreated) {
    return;
  }

  try {
    await chrome.offscreen.closeDocument();
    offscreenDocumentCreated = false;
    console.log('[Offscreen] Closed offscreen document');
  } catch (error) {
    console.error('[Offscreen] Error closing offscreen document:', error);
  }
}
