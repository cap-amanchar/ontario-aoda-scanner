// Background service worker for ModernA11y extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 ModernA11y extension installed - Open source, privacy-first');

  // Initialize default settings
  chrome.storage.local.set({
    jurisdiction: 'federal', // federal, ontario, quebec
    darkMode: false,
    autoScan: false,
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
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['jurisdiction', 'darkMode', 'autoScan'], (result) => {
      sendResponse(result);
    });
    return true;
  }
});
