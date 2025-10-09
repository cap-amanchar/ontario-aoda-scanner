/**
 * Offscreen Document Script
 *
 * Runs in offscreen context to perform headless accessibility scanning
 * Fetches HTML, loads it into DOM, runs axe-core
 */

import axe from 'axe-core';

/**
 * Fetch and scan a URL
 */
async function scanUrl(url: string): Promise<any> {
  try {
    console.log(`[Offscreen] Fetching ${url}`);

    // Fetch the HTML
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`[Offscreen] Fetched ${html.length} chars of HTML`);

    // Create an iframe to load the HTML (sandbox for security)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox.add('allow-same-origin'); // Needed for axe-core to access DOM
    document.body.appendChild(iframe);

    // Load HTML into iframe
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
      throw new Error('Failed to access iframe document');
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for DOM to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`[Offscreen] Running axe-core scan on ${url}`);

    // Run axe-core on the iframe document
    const results = await axe.run(iframeDoc, {
      resultTypes: ['violations', 'passes', 'incomplete'],
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      },
    });

    // Cleanup iframe
    document.body.removeChild(iframe);

    console.log(
      `[Offscreen] Scan complete - ${results.violations.length} violations, ${results.passes.length} passes`
    );

    // Process violations to match expected format
    const enhancedViolations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact || 'minor',
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map((node) => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary || '',
      })),
    }));

    // Check for bilingual support (basic check on HTML content)
    const bilingualCheck = checkBilingualSupport(html, url);

    return {
      violations: enhancedViolations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      bilingualCheck,
    };
  } catch (error) {
    console.error(`[Offscreen] Scan error for ${url}:`, error);
    throw error;
  }
}

/**
 * Basic bilingual support check
 */
function checkBilingualSupport(html: string, url: string): any {
  const hasLangAttribute = /lang=["'](en|fr)["']/i.test(html);
  const hasFrenchContent =
    /français|french/i.test(html) || html.toLowerCase().includes('lang="fr"');
  const hasLanguageToggle =
    /(toggle|switch|changer).*lang/i.test(html) ||
    /lang.*(toggle|switch|changer)/i.test(html);
  const isOntarioGov = /\.ontario\.ca|\.on\.ca/i.test(url);

  return {
    hasLangAttribute,
    isBilingual: hasLangAttribute && hasFrenchContent,
    detectedLanguages: hasLangAttribute ? ['en', 'fr'] : ['en'],
    hasLanguageToggle,
    hasFrenchContent,
    isOntarioGov,
    languageToggles: hasLanguageToggle ? 1 : 0,
  };
}

/**
 * Message listener
 */
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.target !== 'offscreen') {
    return false;
  }

  if (request.action === 'scanUrl') {
    scanUrl(request.url)
      .then((result) => {
        sendResponse({ success: true, result });
      })
      .catch((error) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    return true; // Keep channel open for async response
  }

  return false;
});

console.log('[Offscreen] Offscreen document ready for headless scanning');
