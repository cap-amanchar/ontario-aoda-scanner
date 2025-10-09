import { type ScanScore, calculateScore, getAODAMapping } from '@moderna11y/scanner';
import axe from 'axe-core';

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
  score?: ScanScore;
  error?: string;
}

// ============================================
// BILINGUAL DETECTION
// ============================================

const checkBilingualSupport = (): BilingualCheck => {
  const htmlLang = document.documentElement.lang;
  const hasLangAttribute = !!htmlLang;

  // Check for language toggles (more specific patterns to avoid false matches)
  const languageToggles = document.querySelectorAll(
    'a[href$="/fr"], a[href$="/en"], a[href*="/fr/"], a[href*="/en/"], button[aria-label*="French"], button[aria-label*="Français"], button[aria-label*="English"], [class*="language-toggle"], [id*="language-toggle"], [data-lang]'
  );

  // Check for substantial French content (requires multiple keywords)
  const bodyText = document.body.innerText.toLowerCase();

  // French UI keywords
  const frenchUIWords = ['accueil', 'à propos', 'contactez', 'recherche', 'services', 'politique', 'confidentialité'];
  const uiWordsFound = frenchUIWords.filter((word) => bodyText.includes(word)).length;

  // French structural words
  const frenchStructuralWords = ['bienvenue', 'français', 'langue'];
  const structuralWordsFound = frenchStructuralWords.filter((word) => bodyText.includes(word)).length;

  // Require multiple keywords (at least 3 UI words OR 2+ structural words)
  const hasFrenchContent = uiWordsFound >= 3 || structuralWordsFound >= 2;

  // Check for multiple lang attributes
  const elementsWithLang = document.querySelectorAll('[lang]');
  const languages = new Set<string>();

  elementsWithLang.forEach((el) => {
    const lang = el.getAttribute('lang');
    if (lang) {
      languages.add(lang.substring(0, 2).toLowerCase());
    }
  });

  // Check if it's an Ontario government site
  const isOntarioGov =
    window.location.hostname.includes('ontario.ca') ||
    window.location.hostname.includes('.on.ca') ||
    window.location.hostname.includes('.gc.ca') ||
    window.location.hostname.includes('.gouv.qc.ca');

  // Strict bilingual detection
  const hasEnglish = languages.has('en');
  const hasFrench = languages.has('fr');

  // PRIMARY: Both lang attributes present
  const isBilingual = (hasEnglish && hasFrench) ||
    // SECONDARY: Government sites with toggle AND substantial French content
    (isOntarioGov && languageToggles.length > 0 && hasFrenchContent);

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

    // Calculate AODA score
    const scoreData = calculateScore({
      violations: enhancedViolations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      bilingualCheck,
    });

    console.log('✅ Scan complete:', {
      violations: enhancedViolations.length,
      bilingual: bilingualCheck.isBilingual,
      score: scoreData.score,
      grade: scoreData.grade,
    });

    return {
      violations: enhancedViolations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      timestamp: new Date().toISOString(),
      bilingualCheck,
      score: scoreData,
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

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
      <span>ComplyCA Active</span>
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
    font-family: Helvetica, Arial, sans-serif;
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

console.log('🚀 ComplyCA content script loaded - Ready to scan');
