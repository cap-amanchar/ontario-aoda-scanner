// Background service worker for ComplyCA extension

import {
  cancelScan,
  resumeScan,
  type ScanProgress,
  type SiteReport,
  scanFullSite,
} from './multi-page-scanner';

chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 ComplyCA extension installed - Open source, privacy-first');

  // Initialize default settings
  chrome.storage.local.set({
    jurisdiction: 'federal', // federal, ontario, quebec
    darkMode: false,
    autoScan: false,
  });
});

// Listen for tab updates to inject content script
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab loaded:', tab.url);
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['jurisdiction', 'darkMode', 'autoScan'], (result) => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'scanFullSite') {
    // Start multi-page scan with optional config
    const baseUrl = request.baseUrl;
    const config = request.config;

    scanFullSite(
      baseUrl,
      (progress: ScanProgress) => {
        // Send progress updates to popup
        chrome.runtime.sendMessage({
          type: 'scanProgress',
          progress,
        });
      },
      false, // resume
      config // pass config to scanner
    )
      .then((report: SiteReport) => {
        sendResponse({ success: true, report });
      })
      .catch((error: Error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep message channel open for async response
  }

  if (request.action === 'cancelScan') {
    // Cancel active scan
    cancelScan();
    sendResponse({ success: true });
    return false;
  }

  if (request.action === 'resumeScan') {
    // Resume interrupted scan
    resumeScan((progress: ScanProgress) => {
      // Send progress updates to popup
      chrome.runtime.sendMessage({
        type: 'scanProgress',
        progress,
      });
    })
      .then((report: SiteReport | null) => {
        if (report) {
          sendResponse({ success: true, report });
        } else {
          sendResponse({ success: false, error: 'No scan to resume' });
        }
      })
      .catch((error: Error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep message channel open for async response
  }

  return false;
});
