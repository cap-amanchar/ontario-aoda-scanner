/**
 * Storage utility for persisting extension state
 * Uses chrome.storage.session for temporary data (cleared on browser close)
 * Uses chrome.storage.local for permanent data
 */

interface ScanState {
  result?: unknown;
  siteReport?: unknown;
  scanProgress?: {
    current: number;
    total: number;
    url?: string;
  };
  fullSiteScanning?: boolean;
  showSiteScanner?: boolean;
  baseUrl?: string;
  timestamp?: string;
}

interface ScanSession {
  id: string;
  baseUrl: string;
  status: 'discovering' | 'scanning' | 'aggregating' | 'complete' | 'error' | 'cancelled';
  currentPage: number;
  totalPages: number;
  scannedUrls: string[];
  remainingUrls: string[];
  pageResults: unknown[];
  startTime: string;
  lastUpdate: string;
  error?: string;
}

const SCAN_STATE_KEY = 'currentScanState';
const SCAN_SESSION_KEY = 'activeScanSession';
const SETTINGS_KEY = 'settings';

/**
 * Save current scan state (persists across popup close/open)
 */
export async function saveScanState(state: ScanState): Promise<void> {
  await chrome.storage.session.set({
    [SCAN_STATE_KEY]: {
      ...state,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Load saved scan state
 */
export async function loadScanState(): Promise<ScanState | null> {
  const result = await chrome.storage.session.get(SCAN_STATE_KEY);
  return result[SCAN_STATE_KEY] || null;
}

/**
 * Clear scan state
 */
export async function clearScanState(): Promise<void> {
  await chrome.storage.session.remove(SCAN_STATE_KEY);
}

/**
 * Save active scan session (for resume capability)
 */
export async function saveScanSession(session: ScanSession): Promise<void> {
  await chrome.storage.local.set({
    [SCAN_SESSION_KEY]: {
      ...session,
      lastUpdate: new Date().toISOString(),
    },
  });
}

/**
 * Load active scan session
 */
export async function loadScanSession(): Promise<ScanSession | null> {
  const result = await chrome.storage.local.get(SCAN_SESSION_KEY);
  return result[SCAN_SESSION_KEY] || null;
}

/**
 * Clear scan session
 */
export async function clearScanSession(): Promise<void> {
  await chrome.storage.local.remove(SCAN_SESSION_KEY);
}

/**
 * Update scan session progress
 */
export async function updateScanSession(
  updates: Partial<ScanSession>
): Promise<ScanSession | null> {
  const session = await loadScanSession();
  if (!session) return null;

  const updatedSession = {
    ...session,
    ...updates,
    lastUpdate: new Date().toISOString(),
  };

  await saveScanSession(updatedSession);
  return updatedSession;
}

/**
 * Save settings
 */
export async function saveSettings(settings: unknown): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

/**
 * Load settings
 */
export async function loadSettings(): Promise<unknown | null> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return result[SETTINGS_KEY] || null;
}

/**
 * Check if there's an active scan session that can be resumed
 */
export async function hasResumableScan(): Promise<boolean> {
  const session = await loadScanSession();
  if (!session) return false;

  // Check if session is less than 1 hour old
  const sessionAge = Date.now() - new Date(session.lastUpdate).getTime();
  const oneHour = 60 * 60 * 1000;

  return sessionAge < oneHour && session.status === 'scanning';
}
