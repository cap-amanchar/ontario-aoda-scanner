import axe from 'axe-core';

// AODA Rules Mapping
const AODA_RULES_MAP: Record<string, any> = {
    'color-contrast': {
        wcagCriterion: '1.4.3 Contrast (Minimum)',
        wcagLevel: 'AA',
        aodaSection: 'IASR 14(4)(a) - Web Accessibility',
        impact: 'critical',
        affectedUsers: ['Low vision', 'Color blindness', 'Aging users'],
        estimatedFixTime: 30,
        penalty: 'Up to $100,000/day for organizations',
    },
    'html-has-lang': {
        wcagCriterion: '3.1.1 Language of Page',
        wcagLevel: 'A',
        aodaSection: 'IASR 14(4) + Ontario Bilingual Requirements',
        impact: 'critical',
        affectedUsers: ['Screen reader users', 'Translation tools', 'French-speaking Ontarians'],
        estimatedFixTime: 5,
        penalty: 'AODA violation + Official Languages Act non-compliance',
    },
    'image-alt': {
        wcagCriterion: '1.1.1 Non-text Content',
        wcagLevel: 'A',
        aodaSection: 'IASR 14(4)',
        impact: 'critical',
        affectedUsers: ['Blind users', 'Screen reader users'],
        estimatedFixTime: 15,
        penalty: 'Up to $100,000/day for organizations',
    },
    'button-name': {
        wcagCriterion: '4.1.2 Name, Role, Value',
        wcagLevel: 'A',
        aodaSection: 'IASR 14(4)',
        impact: 'critical',
        affectedUsers: ['Screen reader users', 'Keyboard-only users'],
        estimatedFixTime: 10,
        penalty: 'Up to $100,000/day for organizations',
    },
    'label': {
        wcagCriterion: '3.3.2 Labels or Instructions',
        wcagLevel: 'A',
        aodaSection: 'IASR 14(4) + IASR 11(1) Feedback Processes',
        impact: 'critical',
        affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
        estimatedFixTime: 20,
        penalty: 'Up to $100,000/day for organizations',
    },
    'link-name': {
        wcagCriterion: '2.4.4 Link Purpose (In Context)',
        wcagLevel: 'A',
        aodaSection: 'IASR 14(4)',
        impact: 'serious',
        affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
        estimatedFixTime: 15,
        penalty: 'Up to $100,000/day for organizations',
    },
    'focus-order-semantics': {
        wcagCriterion: '2.4.3 Focus Order',
        wcagLevel: 'A',
        aodaSection: 'IASR 14(4)',
        impact: 'serious',
        affectedUsers: ['Keyboard-only users', 'Motor disabilities'],
        estimatedFixTime: 45,
        penalty: 'Up to $100,000/day for organizations',
    },
    'page-has-heading-one': {
        wcagCriterion: '2.4.6 Headings and Labels',
        wcagLevel: 'AA',
        aodaSection: 'IASR 14(4)(a)',
        impact: 'serious',
        affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
        estimatedFixTime: 10,
        penalty: 'Up to $100,000/day for organizations',
    },
    'heading-order': {
        wcagCriterion: '1.3.1 Info and Relationships',
        wcagLevel: 'A',
        aodaSection: 'IASR 14(4)',
        impact: 'serious',
        affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
        estimatedFixTime: 30,
        penalty: 'Up to $100,000/day for organizations',
    },
    'landmark-one-main': {
        wcagCriterion: '2.4.1 Bypass Blocks',
        wcagLevel: 'A',
        aodaSection: 'IASR 14(4)',
        impact: 'moderate',
        affectedUsers: ['Screen reader users', 'Keyboard-only users'],
        estimatedFixTime: 20,
        penalty: 'Up to $100,000/day for organizations',
    },
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scan') {
        runAccessibilityScan()
            .then(sendResponse)
            .catch((error) => {
                console.error('Scan error:', error);
                sendResponse({ error: error.message });
            });
        return true; // Keep message channel open for async response
    }
});

async function runAccessibilityScan() {
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
            const aodaData = AODA_RULES_MAP[violation.id] || {};

            return {
                ...violation,
                wcagCriterion: aodaData.wcagCriterion,
                aodaSection: aodaData.aodaSection,
                penalty: aodaData.penalty,
                fixTime: aodaData.estimatedFixTime,
                affectedUsers: aodaData.affectedUsers,
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
        throw error;
    }
}

function checkBilingualSupport() {
    // Check for language attribute
    const htmlLang = document.documentElement.lang;
    const hasLangAttribute = !!htmlLang;

    // Check for language toggles
    const languageToggles = document.querySelectorAll(
        'a[href*="lang"], a[href*="/fr"], a[href*="/en"], button[aria-label*="French"], button[aria-label*="Français"], [class*="lang-toggle"]'
    );

    // Check for French content
    const bodyText = document.body.innerText.toLowerCase();
    const frenchWords = ['français', 'bonjour', 'accueil', 'contactez', 'recherche'];
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
        window.location.hostname.includes('.on.ca');

    return {
        hasLangAttribute,
        isBilingual,
        detectedLanguages: Array.from(languages),
        hasLanguageToggle: languageToggles.length > 0,
        hasFrenchContent,
        isOntarioGov,
        languageToggles: languageToggles.length,
    };
}

// Inject visual indicator
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
  transition: transform 0.3s ease;
`;
document.body.appendChild(indicator);

// Fade out indicator
setTimeout(() => {
    indicator.style.transform = 'translateY(100px)';
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 300);
}, 3000);