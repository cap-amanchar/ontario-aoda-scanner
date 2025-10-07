import axe from 'axe-core';
import { AODA_RULES_MAP, getAODAMapping } from '@moderna11y/scanner';

// ============================================
// TYPES
// ============================================

interface BilingualCheck {
  hasLangAttribute: boolean;
  isBilingual: boolean;
  detectedLanguages: string[];
  hasLanguageToggle: boolean;
  hasFrenchContent: boolean;
  isOntarioGov: boolean;
  languageToggles: number;
}

interface ScanResponse {
  violations: any[];
  passes: number;
  incomplete: number;
  timestamp: string;
  bilingualCheck: BilingualCheck;
  error?: string;
}

// ============================================
// BILINGUAL DETECTION
// ============================================

const checkBilingualSupport = (): BilingualCheck => {
  const htmlLang = document.documentElement.lang;
  const hasLangAttribute = !!htmlLang;

  // Check for language toggles
  const languageToggles = document.querySelectorAll(
    'a[href*="lang"], a[href*="/fr"], a[href*="/en"], button[aria-label*="French"], button[aria-label*="Français"], [class*="lang-toggle"], [id*="lang-toggle"]'
  );

  // Check for French content
  const bodyText = document.body.innerText.toLowerCase();
  const frenchWords = ['français', 'bonjour', 'accueil', 'contactez', 'recherche', 'services'];
  const hasFrenchContent = frenchWords.some((word) => bodyText.includes(word));

  // Check for multiple lang attributes
  const elementsWithLang = document.querySelectorAll('[lang]');
  const languages = new Set<string>();

  elementsWithLang.forEach((el) => {
    const lang = el.getAttribute('lang');
    if (lang) {
      languages.add(lang.substring(0, 2).toLowerCase());
    }
  });

  const isBilingual =
    (languages.has('en') && languages.has('fr')) ||
    (languageToggles.length > 0 && hasFrenchContent);

  // Check if it's an Ontario government site
  const isOntarioGov =
    window.location.hostname.includes('ontario.ca') ||
    window.location.hostname.includes('.on.ca') ||
    window.location.hostname.includes('.gc.ca') ||
    window.location.hostname.includes('.gouv.qc.ca');

  return {
    hasLangAttribute,
    isBilingual,
    detectedLanguages: Array.from(languages),
    hasLanguageToggle: languageToggles.length > 0,
    hasFrenchContent,
    isOntarioGov,
    languageToggles: languageToggles.length,
  };
};

// ============================================
// ACCESSIBILITY SCAN
// ============================================

const runAccessibilityScan = async (): Promise<ScanResponse> => {
  console.log('🔍 Running AODA accessibility scan...');

  try {
    // Run axe-core scan
    const results = await axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    });

    // Run bilingual check
    const bilingualCheck = checkBilingualSupport();

    // Enhance violations with AODA data
    const enhancedViolations = results.violations.map((violation) => {
      const aodaData = getAODAMapping(violation.id);

      return {
        ...violation,
        wcagCriterion: aodaData?.wcagCriterion,
        aodaSection: aodaData?.aodaSection,
        penalty: aodaData?.penalty,
        fixTime: aodaData?.estimatedFixTime,
        affectedUsers: aodaData?.affectedUsers,
      };
    });

    console.log('✅ Scan complete:', {
      violations: enhancedViolations.length,
      bilingual: bilingualCheck.isBilingual,
    });

    return {
      violations: enhancedViolations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      timestamp: new Date().toISOString(),
      bilingualCheck,
    };
  } catch (error) {
    console.error('❌ Scan failed:', error);
    return {
      violations: [],
      passes: 0,
      incomplete: 0,
      timestamp: new Date().toISOString(),
      bilingualCheck: checkBilingualSupport(),
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// ============================================
// MESSAGE LISTENER
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scan') {
    runAccessibilityScan()
      .then(sendResponse)
      .catch((error) => {
        console.error('Scan error:', error);
        sendResponse({
          error: error.message,
          violations: [],
          passes: 0,
          incomplete: 0,
          timestamp: new Date().toISOString(),
          bilingualCheck: checkBilingualSupport(),
        });
      });
    return true; // Keep message channel open for async response
  }
});

// ============================================
// VISUAL INDICATOR
// ============================================

const showIndicator = () => {
  const indicator = document.createElement('div');
  indicator.id = 'moderna11y-indicator';
  indicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
      <span>ModernA11y Active</span>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
  `;
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
  `;

  document.body.appendChild(indicator);

  // Fade out indicator (reduced from 3s to 1s for better UX)
  setTimeout(() => {
    indicator.style.transform = 'translateY(100px)';
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 300);
  }, 1000);
};

// Show indicator when content script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showIndicator);
} else {
  showIndicator();
}

console.log('🚀 ModernA11y content script loaded - Ready to scan');
