// Background service worker for ModernA11y extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 ModernA11y extension installed');

  // Set default settings
  chrome.storage.local.set({
    scansPerformed: 0,
    scanLimit: 5, // Free tier limit
    isPro: false,
  });
});

// Listen for tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab loaded:', tab.url);
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'incrementScanCount') {
    chrome.storage.local.get(['scansPerformed'], (result) => {
      const newCount = (result.scansPerformed || 0) + 1;
      chrome.storage.local.set({ scansPerformed: newCount });
      sendResponse({ scansPerformed: newCount });
    });
    return true;
  }
});
